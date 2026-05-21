import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampaignInvitedInfluencer } from '../entities/campaign-invited-influencer.entity';
import { InfluencerProfile } from '../../../influencer/entities/influencer-profile.entity';
import { UsersService } from '../../../users/users.service';
import { PlatformSettingsService } from '../../../platform-settings/platform-settings.service';
import { NotificationsService } from '../../../notifications/services/notifications.service';
import { NotificationType } from '../../../notifications/enums';
import { Role } from '../../../../common/enums';
import { InvitationStatus } from '../enums';

@Injectable()
export class InvitationsManagementService {
  constructor(
    @InjectRepository(CampaignInvitedInfluencer)
    private readonly invitedInfluencerRepository: Repository<CampaignInvitedInfluencer>,
    @InjectRepository(InfluencerProfile)
    private readonly influencerProfileRepository: Repository<InfluencerProfile>,
    private readonly usersService: UsersService,
    private readonly platformSettingsService: PlatformSettingsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async deleteInvitationsByCampaign(campaignId: string): Promise<void> {
    await this.invitedInfluencerRepository.delete({ campaignId });
  }

  async createInvitations(campaignId: string, influencerIds: string[]): Promise<void> {
    const feePercentage = await this.platformSettingsService.getPlatformFeePercentage();
    const feeMultiplier = 1 + feePercentage / 100;

    for (const influencerId of influencerIds) {
      const influencer = await this.usersService.findById(influencerId);
      if (!influencer || influencer.role !== Role.INFLUENCER) {
        throw new BadRequestException(` احدالمؤثرين غير موجود `);
      }

      const profile = await this.influencerProfileRepository.findOne({
        where: { userId: influencerId },
      });
      if (!profile) {
        throw new BadRequestException(`الملف الشخصي للمؤثر غير موجود: ${influencerId}`);
      }

      if (!profile.price) {
        throw new BadRequestException(`المؤثر لم يحدد سعر الخدمة: ${influencerId}`);
      }

      const basePrice = Number(profile.price);
      const priceWithFee = Math.round(basePrice * feeMultiplier * 100) / 100;

      await this.invitedInfluencerRepository.save(
        this.invitedInfluencerRepository.create({
          campaignId,
          influencerId,
          status: InvitationStatus.CREATED,
          basePrice,
          priceWithFee,
        }),
      );
    }
  }

  async activateInvitations(campaignId: string, campaignName: string): Promise<void> {
    const invitations = await this.invitedInfluencerRepository.find({
      where: { campaignId, status: InvitationStatus.CREATED },
    });

    for (const invitation of invitations) {
      await this.invitedInfluencerRepository.update(invitation.id, {
        status: InvitationStatus.PENDING,
      });

      await this.notificationsService.notify(
        invitation.influencerId,
        'دعوة للمشاركة في حملة',
        `تمت دعوتك للمشاركة في حملة "${campaignName}"`,
        NotificationType.CAMPAIGN_INVITATION,
        { campaignId, invitationId: invitation.id },
      );
    }
  }

  async cancelPendingByCampaign(
    campaignId: string,
    campaignName: string,
  ): Promise<void> {
    const pending = await this.invitedInfluencerRepository.find({
      where: { campaignId, status: InvitationStatus.PENDING },
    });

    for (const invitation of pending) {
      invitation.status = InvitationStatus.CANCELLED;
      await this.invitedInfluencerRepository.save(invitation);

      await this.notificationsService.notify(
        invitation.influencerId,
        'تم إلغاء الدعوة',
        `تم إلغاء دعوتك للمشاركة في حملة ${campaignName}`,
        NotificationType.APPLICATION_REJECTED,
        { campaignId, invitationId: invitation.id },
      );
    }
  }
}
