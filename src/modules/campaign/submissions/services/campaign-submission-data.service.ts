import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampaignSubmission } from '../entities/campaign-submission.entity';
import { SubmissionStatus } from '../enums';

export interface SubmissionForRating {
  submissionId: string;
  influencerId: string;
  status: SubmissionStatus;
  campaign: {
    title: string;
    description: string | null;
    platforms: string[];
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
      relations: ['campaign', 'campaign.platforms'],
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
        platforms: (submission.campaign.platforms ?? []).map((p) => p.name),
      },
    };
  }

  async getAcceptedInfluencerIds(campaignId: string): Promise<string[]> {
    const submissions = await this.submissionRepo.find({
      where: { campaignId, status: SubmissionStatus.ACCEPTED },
    });
    return submissions.map((s) => s.influencerId);
  }

  async countAcceptedSubmissionInfluencers(campaignId: string): Promise<number> {
    const ids = await this.submissionRepo.find({
      where: { campaignId, status: SubmissionStatus.ACCEPTED },
      select: ['influencerId'],
    });
    return new Set(ids.map((s) => s.influencerId)).size;
  }
}
