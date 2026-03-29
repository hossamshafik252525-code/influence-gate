import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InfluencerProfile } from '../../entities/influencer-profile.entity';
import { SocialLinkingService } from '../../../social-linking/social-linking.service';
import { CampaignApplication } from '../../../campaign/entities/campaign-application.entity';
import { ApplicationStatus } from '../../../campaign/enums/application-status.enum';
import { CampaignStatus } from '../../../campaign/enums/campaign-status.enum';
import { InfluencerProfileData, InfluencerNumbers } from '../../interfaces';

@Injectable()
export class InfluencerProfileService {
  constructor(
    @InjectRepository(InfluencerProfile)
    private readonly influencerProfileRepo: Repository<InfluencerProfile>,
    @InjectRepository(CampaignApplication)
    private readonly campaignApplicationRepo: Repository<CampaignApplication>,
    private readonly socialLinkingService: SocialLinkingService,
  ) {}

  async ensureProfileExists(userId: string): Promise<InfluencerProfile> {
    const existing = await this.influencerProfileRepo.findOne({ where: { userId } });
    if (existing) {
      return existing;
    }
    const profile = this.influencerProfileRepo.create({ userId });
    return this.influencerProfileRepo.save(profile);
  }

  async getProfile(userId: string): Promise<InfluencerProfileData> {
    const profile = await this.influencerProfileRepo.findOne({
      where: { userId },
      relations: ['services'],
    });

    if (!profile) {
      throw new NotFoundException('الملف الشخصي غير موجود');
    }

    return {
      id: profile.id,
      userId: profile.userId,
      portfolioLink: profile.portfolioLink ?? null,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  async getNumbers(userId: string): Promise<InfluencerNumbers> {
    const profile = await this.influencerProfileRepo.findOne({ where: { userId } });

    if (!profile) {
      throw new NotFoundException('الملف الشخصي غير موجود');
    }

    const totalFollowers = await this.calculateTotalFollowers(userId);
    const completedCampaignsCount = await this.countCompletedCampaigns(userId);

    return {
      totalFollowers,
      completedCampaignsCount,
      rating: Number(profile.rating),
    };
  }

  private async calculateTotalFollowers(userId: string): Promise<number> {
    const { platforms } = await this.socialLinkingService.getLinkedPlatforms(userId);

    if (!platforms || platforms.length === 0) {
      return 0;
    }

    return platforms.reduce((total, platform) => {
      const stats = platform.statistics;
      if (!stats) {
        return total;
      }
      const followers = stats.followersCount ?? stats.followerCount ?? stats.fanCount ?? 0;
      return total + Number(followers);
    }, 0);
  }

  private async countCompletedCampaigns(userId: string): Promise<number> {
    return this.campaignApplicationRepo
      .createQueryBuilder('app')
      .innerJoin('app.campaign', 'campaign')
      .where('app.influencerId = :userId', { userId })
      .andWhere('app.status = :appStatus', { appStatus: ApplicationStatus.ACCEPTED })
      .andWhere('campaign.status = :campaignStatus', { campaignStatus: CampaignStatus.COMPLETED })
      .getCount();
  }
}
