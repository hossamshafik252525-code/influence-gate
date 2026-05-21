import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampaignApplication } from '../entities/campaign-application.entity';
import { ApplicationStatus } from '../enums';
import { ReviewApplicationDto } from '../dto';
import { NotificationsService } from '../../../notifications/services/notifications.service';
import { NotificationType } from '../../../notifications/enums';
import { ApplicationsValidationService } from './applications-validation.service';
import { ApplicationsDataService } from './applications-data.service';
import { CampaignLaunchService } from '../../services/campaign-launch.service';

@Injectable()
export class CampaignApplicationReviewService {
  constructor(
    @InjectRepository(CampaignApplication)
    private readonly applicationRepo: Repository<CampaignApplication>,
    private readonly notificationsService: NotificationsService,
    private readonly applicationsValidationService: ApplicationsValidationService,
    private readonly applicationsDataService: ApplicationsDataService,
    @Inject(forwardRef(() => CampaignLaunchService))
    private readonly campaignLaunchService: CampaignLaunchService,
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

    this.applicationsValidationService.ensureAdvertiserOwnsApplication(
      application,
      advertiserId,
    );
    this.applicationsValidationService.ensureCampaignCanReceiveReview(application);
    this.applicationsValidationService.ensureApplicationIsPending(application);

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
    await this.applicationsValidationService.ensureBudgetCovers(
      application.campaign,
      Number(application.priceWithFee || 0),
    );

    application.status = ApplicationStatus.ACCEPTED;
    await this.applicationRepo.save(application);

    await this.notificationsService.notify(
      application.influencerId,
      'تم قبول طلبك',
      `تم قبول طلبك للحملة ${application.campaign.name}`,
      NotificationType.APPLICATION_ACCEPTED,
      { campaignId: application.campaignId, applicationId: application.id },
    );

    const acceptedCount = await this.applicationsDataService.countAcceptedApplications(
      application.campaignId,
    );

    if (acceptedCount >= application.campaign.requiredInfluencersCount) {
      await this.campaignLaunchService.launchImplementation(application.campaign);
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
}
