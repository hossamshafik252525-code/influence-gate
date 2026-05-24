import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../../campaign/entities/campaign.entity';
import { CampaignSubmissionDataService } from '../../campaign/submissions/services/campaign-submission-data.service';
import { AdvertiserWalletTransactionService } from '../../wallet/services/advertiser/advertiser-wallet-transaction.service';
import { CampaignReportRepository } from '../repositories/campaign-report.repository';
import { CampaignReport } from '../entities/campaign-report.entity';
import { ReportStatus } from '../enums';

@Injectable()
export class CampaignReportGenerationService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    private readonly campaignReportRepository: CampaignReportRepository,
    private readonly submissionsDataService: CampaignSubmissionDataService,
    private readonly advertiserWalletTransactionService: AdvertiserWalletTransactionService,
  ) {}

  async generateForCompletedCampaign(campaign: Campaign): Promise<void> {
    await this.generate(campaign, ReportStatus.COMPLETED);
  }

  async generateForDiscardedCampaign(campaign: Campaign): Promise<void> {
    await this.generate(campaign, ReportStatus.DISCARDED);
  }

  private async generate(
    campaign: Campaign,
    status: ReportStatus,
  ): Promise<CampaignReport | null> {
    const alreadyExists =
      await this.campaignReportRepository.existsForCampaign(campaign.id);
    if (alreadyExists) return null;

    const withCategories = await this.campaignRepository.findOne({
      where: { id: campaign.id },
      relations: ['categories', 'contentTypes', 'platforms'],
    });

    if (!withCategories) return null;

    const acceptedSubmissionsInfluencersCount =
      await this.submissionsDataService.countAcceptedSubmissionInfluencers(
        campaign.id,
      );

    const actualPaid =
      await this.advertiserWalletTransactionService.getCampaignActualPaid(
        campaign.id,
      );

    return this.campaignReportRepository.create({
      advertiserId: withCategories.advertiserId,
      campaignId: withCategories.id,
      campaignNumber: withCategories.campaignNumber,
      campaignName: withCategories.name ?? null,
      status,
      campaignVisibility: withCategories.campaignVisibility ?? null,
      categories: withCategories.categories ?? [],
      platforms: withCategories.platforms ?? [],
      contentTypes: withCategories.contentTypes ?? [],
      acceptedSubmissionsInfluencersCount,
      actualPaid,
      startDate: withCategories.startDate ?? null,
      endDate: withCategories.endDate ?? null,
      applicationDeadlineDate: withCategories.applicationDeadlineDate ?? null,
      submittedAt: withCategories.submittedAt ?? null,
      approvedAt: withCategories.approvedAt ?? null,
    });
  }
}
