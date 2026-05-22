import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignStatus, CampaignVisibility } from '../enums';
import { UpdateCampaignDatesDto } from '../dto';
import { isBeforeStart, validateUpdatedDateOrdering } from '../utils';
import { ApplicationsValidationService } from '../applications/services/applications-validation.service';
import { CampaignLaunchService } from './campaign-launch.service';

const UPDATABLE_STATUSES = [
  CampaignStatus.SCHEDULED,
  CampaignStatus.APPROVED,
  CampaignStatus.PENDING_MINIMUM,
];

@Injectable()
export class CampaignManagementService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    private readonly applicationsValidationService: ApplicationsValidationService,
    private readonly campaignLaunchService: CampaignLaunchService,
  ) {}

  async updateDates(
    campaignId: string,
    advertiserId: string,
    dto: UpdateCampaignDatesDto,
  ): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, advertiserId },
    });

    if (!campaign) {
      throw new NotFoundException('الحملة غير موجودة');
    }

    if (!UPDATABLE_STATUSES.includes(campaign.status)) {
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

    return this.campaignRepository.findOne({
      where: { id: campaign.id },
      relations: [
        'categories',
        'invitedInfluencers',
        'invitedInfluencers.influencer',
        'invitedInfluencers.influencer.influencerProfile',
      ],
    });
  }

  async launchPublicOnDemand(
    campaignId: string,
    advertiserId: string,
  ): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, advertiserId },
    });

    if (!campaign) {
      throw new NotFoundException('الحملة غير موجودة');
    }

    if (campaign.campaignVisibility !== CampaignVisibility.PUBLIC) {
      throw new BadRequestException('هذه العملية متاحة للحملات العامة فقط');
    }

    const launchableStatuses = [
      CampaignStatus.APPROVED,
      CampaignStatus.PENDING_MINIMUM,
    ];
    if (!launchableStatuses.includes(campaign.status)) {
      throw new BadRequestException('لا يمكن إطلاق الحملة في هذه الحالة');
    }

    await this.applicationsValidationService.ensureCampaignHasAcceptedApplication(
      campaign.id,
    );

    await this.campaignLaunchService.launchImplementation(campaign);

    return this.campaignRepository.findOne({
      where: { id: campaign.id },
      relations: [
        'categories',
        'invitedInfluencers',
        'invitedInfluencers.influencer',
        'invitedInfluencers.influencer.influencerProfile',
      ],
    });
  }


}
