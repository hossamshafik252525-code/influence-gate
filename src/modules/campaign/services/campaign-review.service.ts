import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignInvitedInfluencer } from '../entities/campaign-invited-influencer.entity';
import { CampaignStatus, CampaignVisibility } from '../enums';
import { ReviewCampaignDto } from '../dto';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/enums';

@Injectable()
export class CampaignReviewService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(CampaignInvitedInfluencer)
    private readonly invitedInfluencerRepository: Repository<CampaignInvitedInfluencer>,
    private readonly notificationsService: NotificationsService,
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
      relations: ['advertiser', 'category'],
      order: { submittedAt: 'ASC' },
    });
  }

  private async approveCampaign(campaign: Campaign): Promise<void> {
    await this.campaignRepository.update(campaign.id, {
      status: CampaignStatus.APPROVED,
      approvedAt: new Date(),
    });

    await this.notificationsService.notify(
      campaign.advertiserId,
      'تمت الموافقة على حملتك',
      `تمت الموافقة على حملة "${campaign.name}"`,
      NotificationType.CAMPAIGN_APPROVED,
      { campaignId: campaign.id },
    );

    if (campaign.campaignVisibility === CampaignVisibility.PRIVATE) {
      const invitedInfluencers = await this.invitedInfluencerRepository.find({
        where: { campaignId: campaign.id },
      });

      for (const invitation of invitedInfluencers) {
        await this.notificationsService.notify(
          invitation.influencerId,
          'دعوة للمشاركة في حملة',
          `تمت دعوتك للمشاركة في حملة "${campaign.name}"`,
          NotificationType.CAMPAIGN_INVITATION,
          { campaignId: campaign.id },
        );
      }
    }
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
