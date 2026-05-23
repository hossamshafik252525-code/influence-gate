import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignStatus, CampaignVisibility } from '../enums';
import { WalletTransactionService } from '../../wallet/services/influencer/wallet-transaction.service';
import { TransactionStatus } from '../../wallet/enums';
import { InvitationsDataService } from '../invitations/services/invitations-data.service';
import { ApplicationsDataService } from '../applications/services/applications-data.service';
import { CampaignSubmissionDataService } from '../submissions/services/campaign-submission-data.service';
import { CampaignReportGenerationService } from '../../reports/services/campaign-report-generation.service';

@Injectable()
export class CampaignCompletionService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    private readonly walletTransactionService: WalletTransactionService,
    private readonly invitationsDataService: InvitationsDataService,
    private readonly applicationsDataService: ApplicationsDataService,
    private readonly submissionsDataService: CampaignSubmissionDataService,
    private readonly campaignReportGenerationService: CampaignReportGenerationService,
  ) {}

  async markCompleted(campaign: Campaign): Promise<void> {
    await this.generateCancelledTransactionsForUnacceptedInfluencers(campaign);
    await this.campaignRepository.update(campaign.id, {
      status: CampaignStatus.COMPLETED,
    });
    const updated = await this.campaignRepository.findOne({
      where: { id: campaign.id },
    });
    if (updated) {
      await this.campaignReportGenerationService.generateForCompletedCampaign(
        updated,
      );
    }
  }

  private async generateCancelledTransactionsForUnacceptedInfluencers(
    campaign: Campaign,
  ): Promise<void> {
    const isPublic = campaign.campaignVisibility === CampaignVisibility.PUBLIC;

    const acceptedInfluencerIds = isPublic
      ? await this.applicationsDataService.getAcceptedInfluencerIds(campaign.id)
      : await this.invitationsDataService.getAcceptedInfluencerIds(campaign.id);

    if (!acceptedInfluencerIds.length) return;

    const acceptedSubmissionInfluencerIds =
      await this.submissionsDataService.getAcceptedInfluencerIds(campaign.id);
    const acceptedSubmissionSet = new Set(acceptedSubmissionInfluencerIds);

    for (const influencerId of acceptedInfluencerIds) {
      if (acceptedSubmissionSet.has(influencerId)) continue;

      const amount = isPublic
        ? await this.applicationsDataService.getPriceForInfluencer(
            campaign.id,
            influencerId,
          )
        : await this.invitationsDataService.getPriceForInfluencer(
            campaign.id,
            influencerId,
          );

      await this.walletTransactionService.createRevenueTransaction({
        influencerId,
        amount,
        campaignId: campaign.id,
        campaignName: campaign.name,
        includedPlatforms: campaign.includedPlatforms,
        status: TransactionStatus.CANCELLED,
      });
    }
  }
}
