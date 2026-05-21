import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignQueryService } from './campaign-query.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { InvitationsManagementService } from '../invitations/services/invitations-management.service';

@Injectable()
export class CampaignDraftService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    private readonly campaignQueryService: CampaignQueryService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly invitationsManagementService: InvitationsManagementService,
  ) {}

  async deleteDraft(campaignId: string, advertiserId: string): Promise<void> {
    const campaign = await this.campaignQueryService.findDraftOrFail(
      campaignId,
      advertiserId,
    );

    if (campaign.contentPdfPublicId) {
      await this.cloudinaryService.deleteFile(campaign.contentPdfPublicId);
    }

    await this.invitationsManagementService.deleteInvitationsByCampaign(campaign.id);
    await this.campaignRepository.remove(campaign);
  }
}
