import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampaignInvitedInfluencer } from '../entities/campaign-invited-influencer.entity';
import { Campaign } from '../../entities/campaign.entity';
import { CampaignStatus, CampaignVisibility } from '../../enums';
import { InvitationStatus } from '../enums';

@Injectable()
export class InvitationsValidationService {
  constructor(
    @InjectRepository(CampaignInvitedInfluencer)
    private readonly invitationRepository: Repository<CampaignInvitedInfluencer>,
  ) {}

  async hasInvitationInCampaign(
    campaignId: string,
    influencerId: string,
  ): Promise<boolean> {
    const count = await this.invitationRepository.count({
      where: { campaignId, influencerId },
    });
    return count > 0;
  }

  async assertPendingInvitationForInfluencer(
    invitationId: string,
    influencerId: string,
  ): Promise<CampaignInvitedInfluencer> {
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId, influencerId },
    });

    if (!invitation) {
      throw new NotFoundException('الدعوة غير موجودة');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('تم الرد على هذه الدعوة مسبقاً');
    }

    return invitation;
  }

  assertCampaignAcceptingInvitationResponses(campaign: Campaign): void {
    if (campaign.campaignVisibility !== CampaignVisibility.PRIVATE) {
      throw new BadRequestException('هذه الحملة ليست حملة خاصة');
    }

    const isLive =
      campaign.status === CampaignStatus.IMPLEMENTATION ||
      campaign.status === CampaignStatus.SCHEDULED;

    if (!isLive) {
      throw new BadRequestException('لا يمكن الرد على الدعوة في هذه الحالة');
    }

    if (campaign.applicationDeadlineDate) {
      const now = Date.now();
      const deadline = new Date(campaign.applicationDeadlineDate).getTime();
      if (now >= deadline) {
        throw new BadRequestException('انتهت فترة قبول الدعوات لهذه الحملة');
      }
    }
  }
}
