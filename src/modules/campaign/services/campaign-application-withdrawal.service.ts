import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignApplication } from '../entities/campaign-application.entity';
import {
  ApplicationStatus,
  CampaignStatus,
  CampaignVisibility,
} from '../enums';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/enums';

@Injectable()
export class CampaignApplicationWithdrawalService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(CampaignApplication)
    private readonly applicationRepo: Repository<CampaignApplication>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async withdrawApplication(
    influencerId: string,
    campaignId: string,
  ): Promise<{ message: string }> {
    const campaign = await this.campaignRepo.findOne({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('الحملة غير موجودة');
    }

    if (campaign.campaignVisibility !== CampaignVisibility.PUBLIC) {
      throw new BadRequestException('لا يمكن الخروج من حملة خاصة');
    }

    if (
      campaign.status !== CampaignStatus.APPROVED &&
      campaign.status !== CampaignStatus.PENDING_MINIMUM
    ) {
      throw new BadRequestException(
        'لا يمكن الخروج من الحملة في هذه الحالة',
      );
    }

    const application = await this.applicationRepo.findOne({
      where: { campaignId, influencerId },
    });

    if (!application) {
      throw new NotFoundException('لا يوجد طلب لهذه الحملة');
    }

    if (
      application.status === ApplicationStatus.REJECTED ||
      application.status === ApplicationStatus.WITHDRAWN
    ) {
      throw new BadRequestException('لا يمكن الخروج من هذا الطلب');
    }

    application.status = ApplicationStatus.WITHDRAWN;
    await this.applicationRepo.save(application);

    await this.notificationsService.notify(
      campaign.advertiserId,
      'خروج مؤثر',
      `خرج المؤثر من حملة ${campaign.name}`,
      NotificationType.APPLICATION_REJECTED,
      { campaignId: campaign.id, applicationId: application.id },
    );

    return { message: 'تم الخروج من الحملة' };
  }
}
