import { Injectable, BadRequestException } from '@nestjs/common';
import { Campaign } from '../../entities/campaign.entity';
import { CampaignApplication } from '../entities/campaign-application.entity';
import { CampaignStatus, CampaignVisibility } from '../../enums';
import { ApplicationStatus } from '../enums';
import { ApplicationsDataService } from './applications-data.service';

@Injectable()
export class ApplicationsValidationService {
  constructor(private readonly applicationsDataService: ApplicationsDataService) {}

  async ensureCampaignHasAcceptedApplication(campaignId: string): Promise<void> {
    const count =
      await this.applicationsDataService.countAcceptedApplications(campaignId);
    if (count === 0) {
      throw new BadRequestException(
        'لا يمكن إطلاق الحملة بدون مؤثر مقبول واحد على الأقل',
      );
    }
  }

  async ensureBudgetCovers(
    campaign: Campaign,
    additionalCost: number,
  ): Promise<void> {
    const currentTotalCost =
      await this.applicationsDataService.sumAcceptedCost(campaign.id);
    const newTotalCost = currentTotalCost + additionalCost;

    if (newTotalCost > Number(campaign.budget || 0)) {
      throw new BadRequestException(
        'ميزانية الحملة لا تكفي لقبول هذا الطلب. يرجى زيادة ميزانية الحملة.',
      );
    }
  }

  ensureApplicationIsPending(application: CampaignApplication): void {
    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException('تم مراجعة هذا الطلب مسبقاً');
    }
  }

  ensureAdvertiserOwnsApplication(
    application: CampaignApplication,
    advertiserId: string,
  ): void {
    if (application.campaign.advertiserId !== advertiserId) {
      throw new BadRequestException('غير مصرح لك بمراجعة هذا الطلب');
    }
  }

  ensureCampaignCanReceiveReview(application: CampaignApplication): void {
    if (application.campaign.campaignVisibility === CampaignVisibility.PRIVATE) {
      throw new BadRequestException('مراجعة الطلبات متاحة للحملات العامة فقط');
    }

    const reviewableStatuses = [
      CampaignStatus.APPROVED,
      CampaignStatus.PENDING_MINIMUM,
    ];
    if (!reviewableStatuses.includes(application.campaign.status)) {
      throw new BadRequestException('لا يمكن مراجعة الطلبات لهذه الحملة');
    }
  }
}
