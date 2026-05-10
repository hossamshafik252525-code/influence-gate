import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampaignApplication } from '../entities/campaign-application.entity';
import { ApplicationStatus, OfferReviewDecision } from '../enums';
import { ReviewOfferDto } from '../dto';
import { NotificationsService } from '../../../notifications/services/notifications.service';
import { NotificationType } from '../../../notifications/enums';

@Injectable()
export class AdminOfferReviewService {
  constructor(
    @InjectRepository(CampaignApplication)
    private readonly applicationRepo: Repository<CampaignApplication>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async reviewOffer(
    applicationId: string,
    dto: ReviewOfferDto,
  ): Promise<{ message: string }> {
    const application = await this.applicationRepo.findOne({
      where: { id: applicationId },
      relations: ['campaign'],
    });

    if (!application) {
      throw new NotFoundException('الطلب غير موجود');
    }

    if (application.status !== ApplicationStatus.PENDING_ADMIN_APPROVAL) {
      throw new BadRequestException('تمت مراجعة هذا العرض مسبقاً');
    }

    if (dto.decision === OfferReviewDecision.APPROVE) {
      await this.approveOffer(application);
      return { message: 'تم قبول العرض' };
    }

    if (!dto.rejectionReason || !dto.rejectionReason.trim()) {
      throw new BadRequestException('سبب الرفض مطلوب');
    }

    await this.rejectOffer(application);
    return { message: 'تم رفض العرض' };
  }

  private async approveOffer(application: CampaignApplication): Promise<void> {
    const acceptedCount = await this.applicationRepo.count({
      where: {
        campaignId: application.campaignId,
        status: ApplicationStatus.ACCEPTED,
      },
    });

    if (acceptedCount >= application.campaign.requiredInfluencersCount) {
      application.status = ApplicationStatus.REJECTED;
      await this.applicationRepo.save(application);

      await this.notificationsService.notify(
        application.influencerId,
        'تم رفض طلبك',
        `تم رفض طلبك للحملة ${application.campaign.name} لاكتمال العدد المطلوب`,
        NotificationType.APPLICATION_REJECTED,
        { campaignId: application.campaignId, applicationId: application.id },
      );
      return;
    }

    application.status = ApplicationStatus.PENDING;
    await this.applicationRepo.save(application);

    await this.notificationsService.notify(
      application.campaign.advertiserId,
      'طلب تقديم جديد',
      `تقدم مؤثر جديد على حملة ${application.campaign.name}`,
      NotificationType.NEW_CAMPAIGN_APPLICATION,
      {
        campaignId: application.campaignId,
        applicationId: application.id,
      },
    );
  }

  private async rejectOffer(application: CampaignApplication): Promise<void> {
    application.status = ApplicationStatus.REJECTED;
    await this.applicationRepo.save(application);

    await this.notificationsService.notify(
      application.influencerId,
      'تم رفض طلبك',
      `تم رفض طلبك للحملة ${application.campaign.name}`,
      NotificationType.APPLICATION_OFFER_REJECTED,
      { campaignId: application.campaignId, applicationId: application.id },
    );
  }
}
