import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { CampaignApplication } from '../applications/entities/campaign-application.entity';
import { CampaignInvitedInfluencer } from '../invitations/entities/campaign-invited-influencer.entity';
import { CampaignVisibility } from '../enums';
import { InvitationStatus } from '../invitations/enums';

@Injectable()
export class CampaignValidationService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(CampaignApplication)
    private readonly applicationRepository: Repository<CampaignApplication>,
    @InjectRepository(CampaignInvitedInfluencer)
    private readonly invitationRepository: Repository<CampaignInvitedInfluencer>,
  ) {}

  async assertCampaignExists(campaignId: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId },
      relations: ['categories'],
    });

    if (!campaign) {
      throw new NotFoundException('الحملة غير موجودة');
    }

    return campaign;
  }

  async assertInfluencerCanAccessCampaign(
    campaign: Campaign,
    userId: string,
  ): Promise<void> {
    if (campaign.campaignVisibility === CampaignVisibility.PUBLIC) {
      return;
    }

    const hasAccess = await this.hasAccessToPrivateCampaign(campaign.id, userId);

    if (!hasAccess) {
      throw new ForbiddenException('لا يمكنك الوصول لهذه الحملة');
    }
  }

  async hasAccessToPrivateCampaign(
    campaignId: string,
    userId: string,
  ): Promise<boolean> {
    const invitation = await this.invitationRepository.findOne({
      where: { campaignId, influencerId: userId },
    });

    if (invitation && invitation.status !== InvitationStatus.CANCELLED) {
      return true;
    }

    const application = await this.applicationRepository.findOne({
      where: { campaignId, influencerId: userId },
    });

    return !!application;
  }

  assertAllStepsCompleted(campaign: Campaign): void {
    if (!campaign.name || !campaign.description || !campaign.categories?.length) {
      throw new BadRequestException('يجب إكمال معلومات الحملة');
    }

    if (!campaign.includedPlatforms || !campaign.implementationType) {
      throw new BadRequestException('يجب إكمال معلومات الحملة');
    }

    if (
      !campaign.startDate ||
      !campaign.endDate ||
      !campaign.applicationDeadlineDate
    ) {
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
