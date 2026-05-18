import { Injectable } from '@nestjs/common';
import { InfluencerProfileManagementService } from '../../influencer/profile/services/influencer-profile-management.service';

@Injectable()
export class CampaignRecordService {
  constructor(
    private readonly influencerProfileManagementService: InfluencerProfileManagementService,
  ) {}

  async recordCompletedCampaignForInfluencer(userId: string): Promise<void> {
    await this.influencerProfileManagementService.incrementCompletedCampaigns(userId);
  }
}
