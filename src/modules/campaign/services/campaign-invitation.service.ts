import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampaignInvitedInfluencer } from '../entities/campaign-invited-influencer.entity';
import { Campaign } from '../entities/campaign.entity';

@Injectable()
export class CampaignInvitationService {
  constructor(
    @InjectRepository(CampaignInvitedInfluencer)
    private readonly invitationRepo: Repository<CampaignInvitedInfluencer>,
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
  ) {}

  async rejectInvitation(influencerId: string, campaignId: string): Promise<void> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });

    if (!campaign) {
      throw new NotFoundException('الحملة غير موجودة');
    }

    if (campaign.deadlineDate && new Date(campaign.deadlineDate) < new Date()) {
      throw new BadRequestException('انتهى الموعد النهائي لقبول أو رفض الدعوة');
    }

    const invitation = await this.invitationRepo.findOne({
      where: { campaignId, influencerId },
    });

    if (!invitation) {
      throw new NotFoundException('لا توجد دعوة لهذه الحملة');
    }

    await this.invitationRepo.delete(invitation.id);
  }
}
