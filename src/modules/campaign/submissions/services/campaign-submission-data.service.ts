import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampaignSubmission } from '../entities/campaign-submission.entity';
import { SubmissionStatus } from '../enums';
import { TargetPlatform } from '../../../../common/enums';

export interface SubmissionForRating {
  submissionId: string;
  influencerId: string;
  status: SubmissionStatus;
  campaign: {
    title: string;
    description: string | null;
    includedPlatforms: TargetPlatform[];
  };
}

@Injectable()
export class CampaignSubmissionDataService {
  constructor(
    @InjectRepository(CampaignSubmission)
    private readonly submissionRepo: Repository<CampaignSubmission>,
  ) {}

  async getSubmissionForRating(submissionId: string): Promise<SubmissionForRating> {
    const submission = await this.submissionRepo.findOne({
      where: { id: submissionId },
      relations: ['campaign'],
    });

    if (!submission) {
      throw new NotFoundException('المحتوى غير موجود');
    }

    return {
      submissionId: submission.id,
      influencerId: submission.influencerId,
      status: submission.status,
      campaign: {
        title: submission.campaign.name,
        description: submission.campaign.description ?? null,
        includedPlatforms: submission.campaign.includedPlatforms ?? [],
      },
    };
  }
}
