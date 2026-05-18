import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Campaign } from '../../entities/campaign.entity';
import { CampaignApplication } from '../entities/campaign-application.entity';
import { CampaignStatus } from '../../enums';
import { ApplicationStatus } from '../enums';
import { InfluencerProfile } from '../../../influencer/entities/influencer-profile.entity';
import { GetApplicationsResult, CampaignApplicationItem } from '../interfaces';

@Injectable()
export class AdvertiserApplicationQueryService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(CampaignApplication)
    private readonly applicationRepository: Repository<CampaignApplication>,
    @InjectRepository(InfluencerProfile)
    private readonly influencerProfileRepository: Repository<InfluencerProfile>,
  ) {}

  async getCampaignApplications(
    campaignId: string,
    advertiserId: string,
    page: number,
    limit: number,
  ): Promise<GetApplicationsResult> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, advertiserId },
    });

    if (!campaign) {
      throw new NotFoundException('الحملة غير موجودة');
    }

    const eligibleStatuses: CampaignStatus[] = [
      CampaignStatus.APPROVED,
      CampaignStatus.PENDING_MINIMUM,
    ];

    if (!eligibleStatuses.includes(campaign.status)) {
      throw new BadRequestException('لا يمكن عرض الطلبات في هذه المرحلة');
    }

    const [applications, total] = await this.applicationRepository.findAndCount({
      where: {
        campaignId,
        status: Not(ApplicationStatus.PENDING_ADMIN_APPROVAL),
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const influencerIds = applications.map((a) => a.influencerId);

    const profiles = influencerIds.length
      ? await this.influencerProfileRepository
          .createQueryBuilder('ip')
          .leftJoin('ip.user', 'user')
          .select(['ip.userId', 'ip.rating', 'ip.ratingCount', 'user.fullName'])
          .where('ip.userId IN (:...ids)', { ids: influencerIds })
          .getMany()
      : [];

    const completedCounts = await this.applicationRepository
      .createQueryBuilder('app')
      .innerJoin('app.campaign', 'campaign')
      .select('app.influencerId', 'influencerId')
      .addSelect('COUNT(*)', 'count')
      .where('app.influencerId IN (:...ids)', { ids: influencerIds.length ? influencerIds : [''] })
      .andWhere('app.status = :status', { status: ApplicationStatus.ACCEPTED })
      .andWhere('campaign.status = :campaignStatus', { campaignStatus: CampaignStatus.COMPLETED })
      .groupBy('app.influencerId')
      .getRawMany<{ influencerId: string; count: string }>();

    const profileMap = new Map(profiles.map((p) => [p.userId, { rating: p.rating, ratingCount: p.ratingCount, fullName: p.user?.fullName ?? '' }]));
    const countMap = new Map(completedCounts.map((r) => [r.influencerId, Number(r.count)]));

    const data: CampaignApplicationItem[] = applications.map((app) => ({
      id: app.id,
      campaignId: app.campaignId,
      influencerId: app.influencerId,
      status: app.status,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      influencer: {
        fullName: profileMap.get(app.influencerId)?.fullName ?? '',
        rating: Number(profileMap.get(app.influencerId)?.rating ?? 0),
        ratingCount: profileMap.get(app.influencerId)?.ratingCount ?? 0,
        completedCampaignsCount: countMap.get(app.influencerId) ?? 0,
      },
    }));

    return { data, pagination: { total, page, limit } };
  }
}
