import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignStatus, CampaignVisibility } from '../enums';
import { ReviewCampaignDto } from '../dto';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/enums';
import { PrivateCampaignLaunchService } from './private-campaign-launch.service';
import { InvitationsManagementService } from '../invitations/services/invitations-management.service';

@Injectable()
export class CampaignReviewService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    private readonly notificationsService: NotificationsService,
    private readonly privateCampaignLaunchService: PrivateCampaignLaunchService,
    private readonly invitationsManagementService: InvitationsManagementService,
  ) {}

  async reviewCampaign(campaignId: string, dto: ReviewCampaignDto): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, status: CampaignStatus.PENDING_REVIEW },
    });

    if (!campaign) {
      throw new NotFoundException('الحملة غير موجودة أو ليست قيد المراجعة');
    }

    if (dto.status === CampaignStatus.APPROVED) {
      await this.approveCampaign(campaign);
    } else if (dto.status === CampaignStatus.REJECTED) {
      if (!dto.rejectionReason) {
        throw new BadRequestException('سبب الرفض مطلوب');
      }
      await this.rejectCampaign(campaign, dto.rejectionReason);
    }

    return this.campaignRepository.findOne({ where: { id: campaign.id } });
  }

  async getPendingCampaigns(): Promise<Campaign[]> {
    return this.campaignRepository.find({
      where: { status: CampaignStatus.PENDING_REVIEW },
      relations: ['advertiser'],
      order: { submittedAt: 'ASC' },
    });
  }

  private async approveCampaign(campaign: Campaign): Promise<void> {
    await this.campaignRepository.update(campaign.id, {
      approvedAt: new Date(),
    });

    if (campaign.campaignVisibility === CampaignVisibility.PRIVATE) {
      await this.invitationsManagementService.activateInvitations(campaign.id, campaign.name);
      await this.privateCampaignLaunchService.launchOnApproval(campaign);

      await this.notificationsService.notify(
        campaign.advertiserId,
        'تمت الموافقة على حملتك',
        `تمت الموافقة على حملة "${campaign.name}" وبدأت مرحلة التنفيذ`,
        NotificationType.CAMPAIGN_APPROVED,
        { campaignId: campaign.id },
      );
      return;
    }

    await this.campaignRepository.update(campaign.id, {
      status: CampaignStatus.APPROVED,
    });

    await this.notificationsService.notify(
      campaign.advertiserId,
      'تمت الموافقة على حملتك',
      `تمت الموافقة على حملة "${campaign.name}"`,
      NotificationType.CAMPAIGN_APPROVED,
      { campaignId: campaign.id },
    );
  }

  private async rejectCampaign(campaign: Campaign, rejectionReason: string): Promise<void> {
    await this.campaignRepository.update(campaign.id, {
      status: CampaignStatus.REJECTED,
      rejectedAt: new Date(),
      rejectionReason,
    });

    await this.notificationsService.notify(
      campaign.advertiserId,
      'تم رفض حملتك',
      `تم رفض حملة "${campaign.name}": ${rejectionReason}`,
      NotificationType.CAMPAIGN_REJECTED,
      { campaignId: campaign.id },
    );
  }
}
