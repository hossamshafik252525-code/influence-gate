import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Campaign } from '../entities/campaign.entity';
import { CampaignApplication } from '../entities/campaign-application.entity';
import { CampaignStatus, PendingMinimumAction, ApplicationStatus } from '../enums';
import { ResolvePendingMinimumDto } from '../dto';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/enums';

@Injectable()
export class CampaignLifecycleService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(CampaignApplication)
    private readonly applicationRepository: Repository<CampaignApplication>,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron('0 0 * * *')
  async processDeadlines(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const campaigns = await this.campaignRepository.find({
      where: {
        status: CampaignStatus.APPROVED,
        deadlineDate: LessThanOrEqual(today),
      },
    });

    for (const campaign of campaigns) {
      await this.campaignRepository.update(campaign.id, {
        status: CampaignStatus.PENDING_MINIMUM,
        pendingMinimumDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      await this.notificationsService.notify(
        campaign.advertiserId,
        'انتهى الموعد النهائي لحملتك',
        `انتهى الموعد النهائي لحملة ${campaign.name}. يرجى اتخاذ إجراء`,
        NotificationType.CAMPAIGN_PENDING_MINIMUM,
        { campaignId: campaign.id },
      );
    }
  }

  @Cron('0 */6 * * *')
  async processGracePeriodExpirations(): Promise<void> {
    const now = new Date();

    const campaigns = await this.campaignRepository.find({
      where: {
        status: CampaignStatus.PENDING_MINIMUM,
        pendingMinimumDeadline: LessThanOrEqual(now),
      },
    });

    for (const campaign of campaigns) {
      await this.campaignRepository.update(campaign.id, {
        status: CampaignStatus.DISCARDED,
      });

      await this.notificationsService.notify(
        campaign.advertiserId,
        'تم إلغاء حملتك',
        `تم إلغاء حملة ${campaign.name} تلقائياً لعدم اتخاذ إجراء`,
        NotificationType.CAMPAIGN_AUTO_DISCARDED,
        { campaignId: campaign.id },
      );
    }
  }

  @Cron('0 1 * * *')
  async processImplementationCompletion(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const campaigns = await this.campaignRepository.find({
      where: {
        status: CampaignStatus.IMPLEMENTATION,
        implementationEndDate: LessThanOrEqual(today),
      },
    });

    for (const campaign of campaigns) {
      await this.campaignRepository.update(campaign.id, {
        status: CampaignStatus.COMPLETED,
      });
    }
  }

  async resolvePendingMinimum(
    campaignId: string,
    advertiserId: string,
    dto: ResolvePendingMinimumDto,
  ): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: {
        id: campaignId,
        advertiserId,
        status: CampaignStatus.PENDING_MINIMUM,
      },
    });

    if (!campaign) {
      throw new NotFoundException('الحملة غير موجودة أو ليست في حالة انتظار');
    }

    switch (dto.action) {
      case PendingMinimumAction.EXTEND_7_DAYS: {
        const newDeadline = new Date(campaign.deadlineDate);
        newDeadline.setDate(newDeadline.getDate() + 7);

        await this.campaignRepository.update(campaign.id, {
          deadlineDate: newDeadline,
          status: CampaignStatus.APPROVED,
          pendingMinimumDeadline: null,
        });
        break;
      }

      case PendingMinimumAction.LAUNCH_ANYWAY: {
        const acceptedCount = await this.applicationRepository.count({
          where: { campaignId: campaign.id, status: ApplicationStatus.ACCEPTED },
        });

        if (acceptedCount === 0) {
          throw new BadRequestException('لا يمكن إطلاق الحملة بدون مؤثر مقبول واحد على الأقل');
        }

        await this.campaignRepository.update(campaign.id, {
          status: CampaignStatus.IMPLEMENTATION,
          implementationStartDate: new Date(),
          implementationEndDate: this.calculateEndDate(campaign.implementationPeriodDays),
          pendingMinimumDeadline: null,
        });
        break;
      }

      case PendingMinimumAction.DISCARD: {
        await this.campaignRepository.update(campaign.id, {
          status: CampaignStatus.DISCARDED,
          pendingMinimumDeadline: null,
        });
        break;
      }
    }

    return this.campaignRepository.findOne({ where: { id: campaign.id } });
  }

  private calculateEndDate(periodDays: number): Date {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + periodDays);
    return endDate;
  }
}
