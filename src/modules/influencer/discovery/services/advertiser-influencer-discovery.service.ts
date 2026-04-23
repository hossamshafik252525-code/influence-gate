import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../users/entities/user.entity';
import { InfluencerProfile } from '../../entities/influencer-profile.entity';
import { InfluencerService } from '../../entities/influencer-service.entity';
import { SocialPlatform } from '../../../social-linking/entities/social-platform.entity';
import { CampaignApplication } from '../../../campaign/entities/campaign-application.entity';
import { CampaignInvitedInfluencer } from '../../../campaign/entities/campaign-invited-influencer.entity';
import { ApplicationStatus, InvitationStatus, CampaignStatus } from '../../../campaign/enums';
import { PlatformSettingsService } from '../../../platform-settings/platform-settings.service';
import { Role } from '../../../../common/enums';
import { GetInfluencersQueryDto } from '../dto/get-influencers-query.dto';
import {
  InfluencerCard,
  InfluencersDiscoveryResult,
} from '../interfaces/influencer-card.interface';
import { InfluencerDetail } from '../interfaces/influencer-detail.interface';
import { InfluencerCardMapper, InfluencerCardSource } from '../mappers/influencer-card.mapper';
import { InfluencerDetailMapper } from '../mappers/influencer-detail.mapper';
import { InfluencerAdvertiserHistoryService } from './influencer-advertiser-history.service';

@Injectable()
export class AdvertiserInfluencerDiscoveryService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(InfluencerProfile)
    private readonly influencerProfileRepo: Repository<InfluencerProfile>,
    @InjectRepository(InfluencerService)
    private readonly influencerServiceRepo: Repository<InfluencerService>,
    @InjectRepository(SocialPlatform)
    private readonly socialPlatformRepo: Repository<SocialPlatform>,
    @InjectRepository(CampaignApplication)
    private readonly campaignApplicationRepo: Repository<CampaignApplication>,
    @InjectRepository(CampaignInvitedInfluencer)
    private readonly invitedInfluencerRepo: Repository<CampaignInvitedInfluencer>,
    private readonly platformSettingsService: PlatformSettingsService,
    private readonly historyService: InfluencerAdvertiserHistoryService,
  ) {}

  async getInfluencers(query: GetInfluencersQueryDto): Promise<InfluencersDiscoveryResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const feeMultiplier = await this.resolveFeeMultiplier();

    const qb = this.userRepo
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.influencerProfile', 'profile')
      .leftJoinAndSelect('profile.services', 'service')
      .leftJoinAndSelect('user.country', 'country')
      .leftJoinAndSelect('profile.categories', 'influencerCategory')
      .leftJoinAndSelect('influencerCategory.category', 'category')
      .where('user.role = :role', { role: Role.INFLUENCER })
      .andWhere(
        `EXISTS (
          SELECT 1 FROM influencer_services s
          WHERE s."influencerProfileId" = profile.id
        )`,
      )
      // .andWhere(   only on development and later i will delete this comments
      //   `EXISTS (
      //     SELECT 1 FROM social_platforms sp
      //     WHERE sp."influencerProfileId" = profile.id
      //   )`,
      // );

    this.applyFilters(qb, query, feeMultiplier);

    qb.orderBy('profile.rating', 'DESC').addOrderBy('user.createdAt', 'DESC');

    const [users, total] = await qb.skip(offset).take(limit).getManyAndCount();

    const cards = await Promise.all(
      users.map((user) => this.buildCard(user, feeMultiplier)),
    );

    return {
      data: cards,
      pagination: { total, page, limit },
    };
  }

  async getInfluencerById(influencerId: string, advertiserId: string): Promise<InfluencerDetail> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.influencerProfile', 'profile')
      .leftJoinAndSelect('profile.services', 'service')
      .leftJoinAndSelect('user.country', 'country')
      .leftJoinAndSelect('profile.categories', 'influencerCategory')
      .leftJoinAndSelect('influencerCategory.category', 'category')
      .where('user.id = :id', { id: influencerId })
      .andWhere('user.role = :role', { role: Role.INFLUENCER })
      .getOne();

    if (!user) {
      throw new NotFoundException('المؤثر غير موجود');
    }

    const feeMultiplier = await this.resolveFeeMultiplier();
    const card = await this.buildCard(user, feeMultiplier);

    const hasHistory = await this.historyService.hasCompletedCampaignWith(
      influencerId,
      advertiserId,
    );

    const socialPlatforms = hasHistory
      ? await this.socialPlatformRepo.find({
          where: { influencerProfileId: user.influencerProfile.id },
        })
      : null;

    return InfluencerDetailMapper.toDetail(card, socialPlatforms);
  }

  private async buildCard(user: User, feeMultiplier: number): Promise<InfluencerCard> {
    const totalFollowers = await this.calculateTotalFollowers(user.influencerProfile.id);
    const completedCampaignsCount = await this.countCompletedCampaigns(user.id);

    const source: InfluencerCardSource = {
      user,
      profile: user.influencerProfile,
      services: user.influencerProfile.services ?? [],
      totalFollowers,
      completedCampaignsCount,
      feeMultiplier,
    };

    return InfluencerCardMapper.toCard(source);
  }

  private async calculateTotalFollowers(influencerProfileId: string): Promise<number> {
    const platforms = await this.socialPlatformRepo.find({
      where: { influencerProfileId },
      select: ['id', 'statistics'],
    });

    if (platforms.length === 0) {
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

  private async countCompletedCampaigns(influencerId: string): Promise<number> {
    const acceptedApplications = await this.campaignApplicationRepo
      .createQueryBuilder('app')
      .innerJoin('app.campaign', 'campaign')
      .where('app.influencerId = :influencerId', { influencerId })
      .andWhere('app.status = :appStatus', { appStatus: ApplicationStatus.ACCEPTED })
      .andWhere('campaign.status = :campaignStatus', {
        campaignStatus: CampaignStatus.COMPLETED,
      })
      .getCount();

    const acceptedInvitations = await this.invitedInfluencerRepo
      .createQueryBuilder('inv')
      .innerJoin('inv.campaign', 'campaign')
      .where('inv.influencerId = :influencerId', { influencerId })
      .andWhere('inv.status = :invStatus', { invStatus: InvitationStatus.ACCEPTED })
      .andWhere('campaign.status = :campaignStatus', {
        campaignStatus: CampaignStatus.COMPLETED,
      })
      .getCount();

    return acceptedApplications + acceptedInvitations;
  }

  private async resolveFeeMultiplier(): Promise<number> {
    const feePercentage = await this.platformSettingsService.getPlatformFeePercentage();
    return 1 + feePercentage / 100;
  }

  private applyFilters(
    qb: ReturnType<Repository<User>['createQueryBuilder']>,
    query: GetInfluencersQueryDto,
    feeMultiplier: number,
  ): void {
    if (query.search) {
      qb.andWhere('user.fullName ILIKE :search', { search: `%${query.search}%` });
    }

    if (query.countryId) {
      qb.andWhere('user.countryId = :countryId', { countryId: query.countryId });
    }

    if (query.categoryIds && query.categoryIds.length > 0) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM influencer_categories ic
          WHERE ic."influencerProfileId" = profile.id AND ic."categoryId" IN (:...categoryIds)
        )`,
        { categoryIds: query.categoryIds },
      );
    }

    if (query.ratingFrom !== undefined) {
      qb.andWhere('profile.rating >= :ratingFrom', { ratingFrom: query.ratingFrom });
    }
    if (query.ratingTo !== undefined) {
      qb.andWhere('profile.rating <= :ratingTo', { ratingTo: query.ratingTo });
    }

    if (query.priceAverageFrom !== undefined || query.priceAverageTo !== undefined) {
      const subQuery = `(
        SELECT COALESCE(AVG(s.price * :feeMultiplier), 0)
        FROM influencer_services s
        WHERE s."influencerProfileId" = profile.id
      )`;
      qb.setParameter('feeMultiplier', feeMultiplier);
      if (query.priceAverageFrom !== undefined) {
        qb.andWhere(`${subQuery} >= :priceAverageFrom`, {
          priceAverageFrom: query.priceAverageFrom,
        });
      }
      if (query.priceAverageTo !== undefined) {
        qb.andWhere(`${subQuery} <= :priceAverageTo`, {
          priceAverageTo: query.priceAverageTo,
        });
      }
    }

    if (query.followersFrom !== undefined || query.followersTo !== undefined) {
      const followersSubQuery = `(
        SELECT COALESCE(SUM(
          COALESCE(
            (sp.statistics->>'followersCount')::numeric,
            (sp.statistics->>'followerCount')::numeric,
            (sp.statistics->>'fanCount')::numeric,
            0
          )
        ), 0)
        FROM social_platforms sp
        WHERE sp."influencerProfileId" = profile.id
      )`;
      if (query.followersFrom !== undefined) {
        qb.andWhere(`${followersSubQuery} >= :followersFrom`, {
          followersFrom: query.followersFrom,
        });
      }
      if (query.followersTo !== undefined) {
        qb.andWhere(`${followersSubQuery} <= :followersTo`, {
          followersTo: query.followersTo,
        });
      }
    }

  }
}
