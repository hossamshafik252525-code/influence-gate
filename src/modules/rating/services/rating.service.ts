import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InfluencerRating } from '../entities/influencer-rating.entity';
import { InfluencerProfile } from '../../influencer/entities/influencer-profile.entity';
import { CampaignSubmissionDataService } from '../../campaign/submissions/services/campaign-submission-data.service';
import { SubmissionStatus } from '../../campaign/submissions/enums';
import { CreateRatingDto } from '../dto/create-rating.dto';
import { PaginationQueryDto } from '../../../common/dto';

export interface RatingCard {
  id: string;
  campaign: {
    title: string;
    description: string | null;
    includedPlatforms: string[];
  };
  commitment: number;
  qualityOfWork: number;
  communication: number;
  averageScore: number;
  note: string | null;
  createdAt: Date;
}

export interface RatingsResult {
  data: RatingCard[];
  pagination: { total: number; page: number; limit: number };
}

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(InfluencerRating)
    private readonly ratingRepo: Repository<InfluencerRating>,
    @InjectRepository(InfluencerProfile)
    private readonly profileRepo: Repository<InfluencerProfile>,
    private readonly submissionDataService: CampaignSubmissionDataService,
    private readonly dataSource: DataSource,
  ) {}

  async createRating(dto: CreateRatingDto): Promise<{ message: string }> {
    // 1. Fetch submission data from the campaign module
    const submissionData = await this.submissionDataService.getSubmissionForRating(
      dto.submissionId,
    );

    // 2. Guard: submission must have been accepted
    if (submissionData.status !== SubmissionStatus.ACCEPTED) {
      throw new BadRequestException(
        'لا يمكن تقييم المؤثر إلا بعد قبول المحتوى',
      );
    }

    // 3. Guard: one rating per submission
    const existing = await this.ratingRepo.findOne({
      where: { submissionId: dto.submissionId },
    });
    if (existing) {
      throw new ConflictException('تم تقييم هذا المحتوى مسبقاً');
    }

    const averageScore =
      (dto.commitment + dto.qualityOfWork + dto.communication) / 3;

    // 4. Persist rating + update profile aggregate — atomically
    await this.dataSource.transaction(async (manager) => {
      // 4a. Save rating
      await manager.save(InfluencerRating, {
        submissionId: dto.submissionId,
        influencerId: submissionData.influencerId,
        campaignSnapshot: submissionData.campaign,
        commitment: dto.commitment,
        qualityOfWork: dto.qualityOfWork,
        communication: dto.communication,
        note: dto.note ?? null,
      });

      // 4b. Atomically update rolling average on InfluencerProfile
      // new_rating = (old_rating * old_count + new_avg) / (old_count + 1)
      await manager
        .createQueryBuilder()
        .update(InfluencerProfile)
        .set({
          rating: () =>
            `(rating * "ratingCount" + ${averageScore}) / ("ratingCount" + 1)`,
          ratingCount: () => `"ratingCount" + 1`,
        })
        .where('"userId" = :influencerId', {
          influencerId: submissionData.influencerId,
        })
        .execute();
    });

    return { message: 'تم التقييم بنجاح' };
  }

  async getRatingsForInfluencer(
    influencerId: string,
    query: PaginationQueryDto,
  ): Promise<RatingsResult> {
    const { page, limit } = query;

    const [rows, total] = await this.ratingRepo.findAndCount({
      where: { influencerId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const data: RatingCard[] = rows.map((r) => ({
      id: r.id,
      campaign: {
        title: r.campaignSnapshot.title,
        description: r.campaignSnapshot.description,
        includedPlatforms: r.campaignSnapshot.includedPlatforms,
      },
      commitment: r.commitment,
      qualityOfWork: r.qualityOfWork,
      communication: r.communication,
      averageScore:
        Math.round(
          ((r.commitment + r.qualityOfWork + r.communication) / 3) * 100,
        ) / 100,
      note: r.note,
      createdAt: r.createdAt,
    }));

    return { data, pagination: { total, page, limit } };
  }
}
