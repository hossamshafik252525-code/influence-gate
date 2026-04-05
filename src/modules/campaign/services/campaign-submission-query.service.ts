import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignSubmission } from '../entities/campaign-submission.entity';
import { InfluencerProfile } from '../../influencer/entities/influencer-profile.entity';
import { CampaignStatus } from '../enums';
import { SubmissionsResult, SubmissionListItem } from '../interfaces/campaign-submission.interface';

interface SubmissionRaw {
  sub_id: string;
  sub_influencerId: string;
  sub_status: string;
  sub_links: string[];
  sub_fileUrls: string[];
  sub_modificationDetails: string;
  sub_modificationFileUrls: string[];
  sub_createdAt: Date;
  sub_updatedAt: Date;
  fullName: string;
  profileImageUrl: string;
}

@Injectable()
export class CampaignSubmissionQueryService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(CampaignSubmission)
    private readonly submissionRepo: Repository<CampaignSubmission>,
    @InjectRepository(InfluencerProfile)
    private readonly influencerProfileRepo: Repository<InfluencerProfile>,
  ) {}

  async getSubmissions(
    advertiserId: string,
    campaignId: string,
    page: number,
    limit: number,
  ): Promise<SubmissionsResult> {
    const campaign = await this.campaignRepo.findOne({
      where: { id: campaignId, advertiserId },
    });

    if (!campaign) {
      throw new NotFoundException('الحملة غير موجودة');
    }

    if (campaign.status !== CampaignStatus.IMPLEMENTATION) {
      throw new BadRequestException('الحملة ليست في مرحلة التنفيذ');
    }

    const total = await this.submissionRepo.count({ where: { campaignId } });

    const rows = await this.submissionRepo
      .createQueryBuilder('sub')
      .leftJoin('influencer_profiles', 'ip', 'ip."userId" = sub."influencerId"')
      .leftJoin('users', 'u', 'u.id = sub."influencerId"')
      .select('sub.id', 'sub_id')
      .addSelect('sub."influencerId"', 'sub_influencerId')
      .addSelect('sub.status', 'sub_status')
      .addSelect('sub.links', 'sub_links')
      .addSelect('sub."fileUrls"', 'sub_fileUrls')
      .addSelect('sub."modificationDetails"', 'sub_modificationDetails')
      .addSelect('sub."modificationFileUrls"', 'sub_modificationFileUrls')
      .addSelect('sub."createdAt"', 'sub_createdAt')
      .addSelect('sub."updatedAt"', 'sub_updatedAt')
      .addSelect('u."fullName"', 'fullName')
      .addSelect('ip."profileImageUrl"', 'profileImageUrl')
      .where('sub."campaignId" = :campaignId', { campaignId })
      .orderBy('sub."createdAt"', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany<SubmissionRaw>();

    const data: SubmissionListItem[] = rows.map((r) => ({
      id: r.sub_id,
      influencerId: r.sub_influencerId,
      status: r.sub_status as SubmissionListItem['status'],
      links: r.sub_links,
      fileUrls: r.sub_fileUrls ?? null,
      modificationDetails: r.sub_modificationDetails ?? null,
      modificationFileUrls: r.sub_modificationFileUrls ?? null,
      createdAt: r.sub_createdAt,
      updatedAt: r.sub_updatedAt,
      influencer: {
        fullName: r.fullName ?? '',
        profileImageUrl: r.profileImageUrl ?? null,
      },
    }));

    return { data, pagination: { total, page, limit } };
  }
}
