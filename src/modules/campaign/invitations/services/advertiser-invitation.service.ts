import { BadRequestException, Injectable } from '@nestjs/common';
import { CampaignQueryService } from '../../services/campaign-query.service';
import { InvitationsValidationService } from './invitations-validation.service';
import { InvitationsManagementService } from './invitations-management.service';

@Injectable()
export class AdvertiserInvitationService {
  constructor(
    private readonly campaignQueryService: CampaignQueryService,
    private readonly invitationsValidationService: InvitationsValidationService,
    private readonly invitationsManagementService: InvitationsManagementService,
  ) {}

  async inviteInfluencer(
    advertiserId: string,
    campaignId: string,
    influencerId: string,
  ): Promise<void> {
    const campaign = await this.campaignQueryService.findCampaignWithRelations(
      campaignId,
      advertiserId,
    );

    const targetStatus =
      this.invitationsValidationService.assertCampaignAllowsAdvertiserInvite(campaign);

    const alreadyInvited =
      await this.invitationsValidationService.hasInvitationInCampaign(
        campaignId,
        influencerId,
      );
    if (alreadyInvited) {
      throw new BadRequestException('تم دعوة هذا المؤثر مسبقاً لهذه الحملة');
    }

    const snapshot =
      await this.invitationsManagementService.buildInvitationPriceSnapshot(influencerId);

    await this.invitationsValidationService.ensureBudgetCoversNewInvitation(
      campaign,
      snapshot.priceWithFee,
    );

    await this.invitationsManagementService.createSingleInvitation(
      campaignId,
      influencerId,
      targetStatus,
    );
  }
}
