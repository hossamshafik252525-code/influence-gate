import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignStatus, CampaignVisibility } from '../enums';
import {
  UpdateCampaignDatesDto,
  UpdateCampaignBudgetDto,
  UpdateRequiredInfluencersDto,
} from '../dto';
import { isBeforeStart, validateUpdatedDateOrdering } from '../utils';
import { ApplicationsDataService } from '../applications/services/applications-data.service';
import { InvitationsDataService } from '../invitations/services/invitations-data.service';
import { AdvertiserWalletTransactionService } from '../../wallet/services/advertiser/advertiser-wallet-transaction.service';

const DATES_UPDATABLE_STATUSES = [
  CampaignStatus.SCHEDULED,
  CampaignStatus.APPROVED,
  CampaignStatus.PENDING_MINIMUM,
];

const REQUIRED_INFLUENCERS_UPDATABLE_STATUSES = [
  CampaignStatus.SCHEDULED,
  CampaignStatus.APPROVED,
  CampaignStatus.PENDING_MINIMUM,
];

const BUDGET_UPDATABLE_STATUSES = [
  CampaignStatus.SCHEDULED,
  CampaignStatus.APPROVED,
  CampaignStatus.PENDING_MINIMUM,
  CampaignStatus.IMPLEMENTATION,
];

const CAMPAIGN_DETAIL_RELATIONS = [
  'categories',
  'invitedInfluencers',
  'invitedInfluencers.influencer',
  'invitedInfluencers.influencer.influencerProfile',
];

@Injectable()
export class CampaignManagementService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    private readonly applicationsDataService: ApplicationsDataService,
    private readonly invitationsDataService: InvitationsDataService,
    private readonly advertiserWalletTransactionService: AdvertiserWalletTransactionService,
    private readonly dataSource: DataSource,
  ) {}

  async updateDates(
    campaignId: string,
    advertiserId: string,
    dto: UpdateCampaignDatesDto,
  ): Promise<Campaign> {
    const campaign = await this.findOwnedCampaignOrFail(campaignId, advertiserId);

    if (!DATES_UPDATABLE_STATUSES.includes(campaign.status)) {
      throw new BadRequestException('لا يمكن تعديل تواريخ الحملة في هذه الحالة');
    }

    const newEndDate = new Date(dto.endDate);
    const newApplicationDeadline = new Date(dto.applicationDeadlineDate);
    const startDate = new Date(campaign.startDate);

    validateUpdatedDateOrdering(startDate, newApplicationDeadline, newEndDate);

    const now = new Date();
    const updated = {
      ...campaign,
      endDate: newEndDate,
      applicationDeadlineDate: newApplicationDeadline,
    };

    const nextStatus = isBeforeStart(updated, now)
      ? CampaignStatus.SCHEDULED
      : CampaignStatus.APPROVED;

    await this.campaignRepository.update(campaign.id, {
      endDate: newEndDate,
      applicationDeadlineDate: newApplicationDeadline,
      status: nextStatus,
      pendingMinimumDeadline: null,
    });

    return this.findWithDetailRelations(campaign.id);
  }

  async updateRequiredInfluencersCount(
    campaignId: string,
    advertiserId: string,
    dto: UpdateRequiredInfluencersDto,
  ): Promise<Campaign> {
    const campaign = await this.findOwnedCampaignOrFail(campaignId, advertiserId);

    if (!REQUIRED_INFLUENCERS_UPDATABLE_STATUSES.includes(campaign.status)) {
      throw new BadRequestException(
        'لا يمكن تعديل عدد المؤثرين المطلوب في هذه الحالة',
      );
    }

    const floor = await this.computeRequiredInfluencersFloor(campaign);

    if (dto.requiredInfluencersCount < floor) {
      throw new BadRequestException(
        `عدد المؤثرين المطلوب لا يمكن أن يكون أقل من العدد الحالي (${floor})`,
      );
    }

    await this.campaignRepository.update(campaign.id, {
      requiredInfluencersCount: dto.requiredInfluencersCount,
    });

    return this.findWithDetailRelations(campaign.id);
  }

  async updateBudget(
    campaignId: string,
    advertiserId: string,
    dto: UpdateCampaignBudgetDto,
  ): Promise<Campaign> {
    const campaign = await this.findOwnedCampaignOrFail(campaignId, advertiserId);

    if (!BUDGET_UPDATABLE_STATUSES.includes(campaign.status)) {
      throw new BadRequestException('لا يمكن تعديل الميزانية في هذه الحالة');
    }

    const oldBudget = Number(campaign.budget);
    const newBudget = dto.budget;

    if (newBudget === oldBudget) {
      return this.findWithDetailRelations(campaign.id);
    }

    if (newBudget < oldBudget) {
      const floor = await this.computeBudgetFloor(campaign);
      if (newBudget < floor) {
        throw new BadRequestException(
          'لا يمكن تخفيض الميزانية لأقل من تكلفة المؤثرين الملتزم بهم',
        );
      }
    }

    await this.dataSource.transaction(async (manager) => {
      if (newBudget < oldBudget) {
        await this.advertiserWalletTransactionService.generateReleaseTransaction(
          {
            advertiserId: campaign.advertiserId,
            amount: oldBudget - newBudget,
            campaignId: campaign.id,
            description: 'تخفيض ميزانية الحملة',
          },
          manager,
        );
      } else {
        await this.advertiserWalletTransactionService.generateReserveTransaction(
          {
            advertiserId: campaign.advertiserId,
            amount: newBudget - oldBudget,
            campaignId: campaign.id,
            description: 'زيادة ميزانية الحملة',
          },
          manager,
        );
      }
      await manager.update(Campaign, campaign.id, { budget: newBudget });
    });

    return this.findWithDetailRelations(campaign.id);
  }

  private async findOwnedCampaignOrFail(
    campaignId: string,
    advertiserId: string,
  ): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, advertiserId },
    });

    if (!campaign) {
      throw new NotFoundException('الحملة غير موجودة');
    }

    return campaign;
  }

  private findWithDetailRelations(campaignId: string): Promise<Campaign> {
    return this.campaignRepository.findOne({
      where: { id: campaignId },
      relations: CAMPAIGN_DETAIL_RELATIONS,
    });
  }

  private async computeRequiredInfluencersFloor(
    campaign: Campaign,
  ): Promise<number> {
    if (campaign.campaignVisibility === CampaignVisibility.PUBLIC) {
      return this.applicationsDataService.countAcceptedApplications(campaign.id);
    }
    return this.invitationsDataService.countActiveInvitations(campaign.id);
  }

  private async computeBudgetFloor(campaign: Campaign): Promise<number> {
    if (campaign.campaignVisibility === CampaignVisibility.PUBLIC) {
      return this.applicationsDataService.sumAcceptedCost(campaign.id);
    }
    return this.invitationsDataService.sumAllInvitationsCost(campaign.id);
  }

}
