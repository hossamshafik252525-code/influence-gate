import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignStatus, CampaignVisibility } from '../enums';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/enums';
import { Role } from '../../../common/enums';

@Injectable()
export class CampaignSubmissionService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async submitForReview(
    campaignId: string,
    advertiserId: string,
  ): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, advertiserId, status: CampaignStatus.DRAFT },
      relations: ['invitedInfluencers'],
    });

    if (!campaign) {
      throw new NotFoundException('المسودة غير موجودة');
    }

    this.validateAllStepsCompleted(campaign);

    await this.campaignRepository.update(campaign.id, {
      status: CampaignStatus.PENDING_REVIEW,
      submittedAt: new Date(),
    });

    await this.notificationsService.notifyByRole(
      Role.ADMIN,
      'حملة جديدة للمراجعة',
      `تم تقديم حملة "${campaign.name}" للمراجعة`,
      NotificationType.CAMPAIGN_SUBMITTED_FOR_REVIEW,
      { campaignId: campaign.id },
    );

    return this.campaignRepository.findOne({ where: { id: campaign.id } });
  }

  private validateAllStepsCompleted(campaign: Campaign): void {
    if (!campaign.name || !campaign.description || !campaign.categoryId) {
      throw new BadRequestException('يجب إكمال معلومات الحملة');
    }

    if (!campaign.includedPlatforms || !campaign.implementationType) {
      throw new BadRequestException('يجب إكمال معلومات الحملة');
    }

    if (!campaign.deadlineDate || !campaign.implementationPeriodDays) {
      throw new BadRequestException('يجب إكمال معلومات الحملة');
    }

    if (!campaign.contentTypes || !campaign.contentDescription) {
      throw new BadRequestException('يجب إكمال متطلبات المحتوى');
    }

    if (
      campaign.requiredInfluencersCount === null ||
      campaign.requiredInfluencersCount === undefined
    ) {
      throw new BadRequestException('يجب إكمال متطلبات المؤثرين');
    }

    if (!campaign.influencerType || !campaign.campaignVisibility) {
      throw new BadRequestException('يجب إكمال متطلبات المؤثرين');
    }

    if (
      campaign.campaignVisibility === CampaignVisibility.PRIVATE &&
      (!campaign.invitedInfluencers || campaign.invitedInfluencers.length === 0)
    ) {
      throw new BadRequestException('يجب اختيار مؤثرين للحملة الخاصة');
    }

    if (campaign.budget === null || campaign.budget === undefined) {
      throw new BadRequestException('يجب إكمال الميزانية');
    }
  }
}
