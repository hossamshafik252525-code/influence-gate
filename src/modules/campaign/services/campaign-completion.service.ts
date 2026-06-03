import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignStatus, CampaignVisibility } from '../enums';
import { WalletTransactionService } from '../../wallet/services/influencer/wallet-transaction.service';
import { AdvertiserWalletTransactionService } from '../../wallet/services/advertiser/advertiser-wallet-transaction.service';
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
    private readonly advertiserWalletTransactionService: AdvertiserWalletTransactionService,
    private readonly invitationsDataService: InvitationsDataService,
    private readonly applicationsDataService: ApplicationsDataService,
    private readonly submissionsDataService: CampaignSubmissionDataService,
    private readonly campaignReportGenerationService: CampaignReportGenerationService,
    private readonly dataSource: DataSource,
  ) {}

  async markCompleted(campaign: Campaign): Promise<void> {
    if (campaign.status === CampaignStatus.COMPLETED) return;

    const withPlatforms = await this.campaignRepository.findOne({
      where: { id: campaign.id },
      relations: ['platforms'],
    });
    const resolved = withPlatforms ?? campaign;

    await this.dataSource.transaction(async (manager) => {
      await this.generateCancelledTransactionsForUnacceptedInfluencers(
        resolved,
        manager,
      );
      await this.releaseUnusedReservedBudget(resolved, manager);
      await manager.update(Campaign, campaign.id, {
        status: CampaignStatus.COMPLETED,
      });
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

  private async releaseUnusedReservedBudget(
    campaign: Campaign,
    manager: EntityManager,
  ): Promise<void> {
    const actualPaid =
      await this.advertiserWalletTransactionService.getCampaignActualPaid(
        campaign.id,
      );
    const releaseAmount = Number(campaign.budget) - actualPaid;

    if (releaseAmount <= 0) return;

    await this.advertiserWalletTransactionService.generateReleaseTransaction(
      {
        advertiserId: campaign.advertiserId,
        amount: releaseAmount,
        campaignId: campaign.id,
        description: 'تحرير الميزانية غير المستخدمة',
      },
      manager,
    );
  }

  private async generateCancelledTransactionsForUnacceptedInfluencers(
    campaign: Campaign,
    manager: EntityManager,
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
        ? await this.applicationsDataService.getInfluencerNetPrice(
            campaign.id,
            influencerId,
          )
        : await this.invitationsDataService.getInfluencerNetPrice(
            campaign.id,
            influencerId,
          );

      await this.walletTransactionService.createRevenueTransaction(
        {
          influencerId,
          amount,
          campaignId: campaign.id,
          campaignName: campaign.name,
          includedPlatforms: (campaign.platforms ?? []).map((p) => p.name),
          status: TransactionStatus.CANCELLED,
        },
        manager,
      );
    }
  }
}
