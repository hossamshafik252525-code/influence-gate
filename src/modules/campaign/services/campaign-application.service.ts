import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignApplication } from '../entities/campaign-application.entity';
import {
  CampaignStatus,
  ApplicationStatus,
  CampaignVisibility,
} from '../enums';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/enums';

@Injectable()
export class CampaignApplicationService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(CampaignApplication)
    private readonly applicationRepo: Repository<CampaignApplication>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async applyToCampaign(
    influencerId: string,
    campaignId: string,
  ): Promise<CampaignApplication> {
    const campaign = await this.campaignRepo.findOne({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('الحملة غير موجودة');
    }

    if (
      campaign.status !== CampaignStatus.APPROVED &&
      campaign.status !== CampaignStatus.PENDING_MINIMUM
    ) {
      throw new BadRequestException('لا يمكن التقديم على هذه الحملة');
    }

    if (campaign.campaignVisibility !== CampaignVisibility.PUBLIC) {
      throw new BadRequestException('هذه الحملة غير متاحة للتقديم');
    }

    const existingApplication = await this.applicationRepo.findOne({
      where: { campaignId, influencerId },
    });

    if (existingApplication) {
      throw new ConflictException('لقد تقدمت بالفعل على هذه الحملة');
    }

    const acceptedCount = await this.applicationRepo.count({
      where: { campaignId, status: ApplicationStatus.ACCEPTED },
    });

    if (acceptedCount >= campaign.requiredInfluencersCount) {
      throw new BadRequestException(
        'تم اكتمال عدد المؤثرين المطلوبين لهذه الحملة',
      );
    }

    const application = this.applicationRepo.create({
      campaignId,
      influencerId,
      status: ApplicationStatus.PENDING,
    });

    const savedApplication = await this.applicationRepo.save(application);

    await this.notificationsService.notify(
      campaign.advertiserId,
      'طلب تقديم جديد',
      `تقدم مؤثر جديد على حملة ${campaign.name}`,
      NotificationType.NEW_CAMPAIGN_APPLICATION,
      { campaignId, applicationId: savedApplication.id },
    );

    return savedApplication;
  }
}
