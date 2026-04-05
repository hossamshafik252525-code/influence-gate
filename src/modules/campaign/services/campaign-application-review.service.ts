import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignApplication } from '../entities/campaign-application.entity';
import { CampaignStatus, ApplicationStatus } from '../enums';
import { ReviewApplicationDto } from '../dto';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/enums';

@Injectable()
export class CampaignApplicationReviewService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(CampaignApplication)
    private readonly applicationRepo: Repository<CampaignApplication>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async reviewApplication(
    advertiserId: string,
    applicationId: string,
    dto: ReviewApplicationDto,
  ): Promise<{ message: string }> {
    const application = await this.applicationRepo.findOne({
      where: { id: applicationId },
      relations: ['campaign'],
    });

    if (!application) {
      throw new NotFoundException('الطلب غير موجود');
    }

    if (application.campaign.advertiserId !== advertiserId) {
      throw new BadRequestException('غير مصرح لك بمراجعة هذا الطلب');
    }

    if (
      application.campaign.status !== CampaignStatus.APPROVED &&
      application.campaign.status !== CampaignStatus.PENDING_MINIMUM
    ) {
      throw new BadRequestException('لا يمكن مراجعة الطلبات لهذه الحملة');
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException('تم مراجعة هذا الطلب مسبقاً');
    }

    if (dto.status === ApplicationStatus.ACCEPTED) {
      await this.acceptApplication(application);
      return { message: 'تم القبول' };
    }

    await this.rejectApplication(application);
    return { message: 'تم الرفض' };
  }

  private async acceptApplication(
    application: CampaignApplication,
  ): Promise<void> {
    application.status = ApplicationStatus.ACCEPTED;
    await this.applicationRepo.save(application);

    await this.notificationsService.notify(
      application.influencerId,
      'تم قبول طلبك',
      `تم قبول طلبك للحملة ${application.campaign.name}`,
      NotificationType.APPLICATION_ACCEPTED,
      { campaignId: application.campaignId, applicationId: application.id },
    );

    const acceptedCount = await this.applicationRepo.count({
      where: {
        campaignId: application.campaignId,
        status: ApplicationStatus.ACCEPTED,
      },
    });

    if (acceptedCount >= application.campaign.requiredInfluencersCount) {
      await this.launchCampaign(application.campaign);
    }

  }

  private async rejectApplication(
    application: CampaignApplication,
  ): Promise<void> {
    application.status = ApplicationStatus.REJECTED;
    await this.applicationRepo.save(application);

    await this.notificationsService.notify(
      application.influencerId,
      'تم رفض طلبك',
      `تم رفض طلبك للحملة ${application.campaign.name}`,
      NotificationType.APPLICATION_REJECTED,
      { campaignId: application.campaignId, applicationId: application.id },
    );
  }

  private async launchCampaign(campaign: Campaign): Promise<void> {
    const implementationEndDate = new Date();
    implementationEndDate.setDate(
      implementationEndDate.getDate() + campaign.implementationPeriodDays,
    );

    await this.campaignRepo.update(campaign.id, {
      status: CampaignStatus.IMPLEMENTATION,
      implementationStartDate: new Date(),
      implementationEndDate,
    });

    const pendingApplications = await this.applicationRepo.find({
      where: { campaignId: campaign.id, status: ApplicationStatus.PENDING },
    });

    for (const pending of pendingApplications) {
      pending.status = ApplicationStatus.REJECTED;
      await this.applicationRepo.save(pending);

      await this.notificationsService.notify(
        pending.influencerId,
        'تم رفض طلبك',
        `تم رفض طلبك للحملة ${campaign.name} لاكتمال العدد المطلوب`,
        NotificationType.APPLICATION_REJECTED,
        { campaignId: campaign.id, applicationId: pending.id },
      );
    }

    const acceptedApplications = await this.applicationRepo.find({
      where: { campaignId: campaign.id, status: ApplicationStatus.ACCEPTED },
    });

    for (const accepted of acceptedApplications) {
      await this.notificationsService.notify(
        accepted.influencerId,
        'بدأت الحملة',
        `بدأت فترة التنفيذ للحملة ${campaign.name}`,
        NotificationType.CAMPAIGN_STARTED,
        { campaignId: campaign.id },
      );
    }
  }
}
