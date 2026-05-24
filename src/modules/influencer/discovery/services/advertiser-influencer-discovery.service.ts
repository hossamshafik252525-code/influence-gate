import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../users/entities/user.entity';
import { SocialPlatform } from '../../../social-linking/entities/social-platform.entity';
import { PlatformSettingsService } from '../../../platform-settings/platform-settings.service';
import { InfluencerType, Role } from '../../../../common/enums';
import { GetInfluencersQueryDto } from '../dto/get-influencers-query.dto';
import {
  InfluencersDiscoveryRawResult,
  InfluencersDiscoveryRawRow,
  InfluencerDetailRawResult,
} from '../interfaces/influencer-card.interface';
import { InfluencerAdvertiserHistoryService } from './influencer-advertiser-history.service';
import { MEGA_FOLLOWERS_THRESHOLD } from '../constants/follower-thresholds';

@Injectable()
export class AdvertiserInfluencerDiscoveryService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(SocialPlatform)
    private readonly socialPlatformRepo: Repository<SocialPlatform>,
    private readonly platformSettingsService: PlatformSettingsService,
    private readonly historyService: InfluencerAdvertiserHistoryService,
  ) {}

  async getInfluencers(query: GetInfluencersQueryDto): Promise<InfluencersDiscoveryRawResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const feeMultiplier = await this.resolveFeeMultiplier();

    const qb = this.userRepo
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.influencerProfile', 'profile')
      .leftJoinAndSelect('user.country', 'country')
      .leftJoinAndSelect('profile.categories', 'category')
      .leftJoinAndSelect('profile.platforms', 'platform')
      .where('user.role = :role', { role: Role.INFLUENCER })
      .andWhere('profile.price IS NOT NULL')
      .andWhere(
        `EXISTS (
          SELECT 1 FROM social_platforms sp
          WHERE sp."influencerProfileId" = profile.id
        )`,
      );

    this.applyFilters(qb, query, feeMultiplier);

    qb.orderBy('profile.rating', 'DESC').addOrderBy('user.createdAt', 'DESC');

    const [users, total] = await qb.skip(offset).take(limit).getManyAndCount();

    const rows: InfluencersDiscoveryRawRow[] = users.map((user) => ({
      user,
      feeMultiplier,
    }));

    return {
      data: rows,
      pagination: { total, page, limit },
    };
  }

  async getInfluencerById(
    influencerId: string,
    advertiserId: string,
  ): Promise<InfluencerDetailRawResult> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.influencerProfile', 'profile')
      .leftJoinAndSelect('user.country', 'country')
      .leftJoinAndSelect('profile.categories', 'category')
      .leftJoinAndSelect('profile.platforms', 'platform')
      .where('user.id = :id', { id: influencerId })
      .andWhere('user.role = :role', { role: Role.INFLUENCER })
      .getOne();

    if (!user) {
      throw new NotFoundException('المؤثر غير موجود');
    }

    const feeMultiplier = await this.resolveFeeMultiplier();

    const hasHistory = await this.historyService.hasCompletedCampaignWith(
      influencerId,
      advertiserId,
    );

    const socialPlatforms = await this.socialPlatformRepo.find({
      where: { influencerProfileId: user.influencerProfile.id },
      relations: ['platformRef'],
    });

    return { user, socialPlatforms, feeMultiplier, hasHistory };
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

    if (query.platformIds && query.platformIds.length > 0) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM influencer_profile_platforms ipp
          WHERE ipp."influencerProfileId" = profile.id AND ipp."platformId" IN (:...platformIds)
        )`,
        { platformIds: query.platformIds },
      );
    }

    if (query.type === InfluencerType.MICRO) {
      qb.andWhere('profile.totalFollowers < :megaThreshold', {
        megaThreshold: MEGA_FOLLOWERS_THRESHOLD,
      });
    } else if (query.type === InfluencerType.MEGA) {
      qb.andWhere('profile.totalFollowers >= :megaThreshold', {
        megaThreshold: MEGA_FOLLOWERS_THRESHOLD,
      });
    }

    if (query.ratingFrom !== undefined) {
      qb.andWhere('profile.rating >= :ratingFrom', { ratingFrom: query.ratingFrom });
    }
    if (query.ratingTo !== undefined) {
      qb.andWhere('profile.rating <= :ratingTo', { ratingTo: query.ratingTo });
    }

    if (query.priceAverageFrom !== undefined || query.priceAverageTo !== undefined) {
      qb.setParameter('feeMultiplier', feeMultiplier);
      if (query.priceAverageFrom !== undefined) {
        qb.andWhere(`(profile.price * :feeMultiplier) >= :priceAverageFrom`, {
          priceAverageFrom: query.priceAverageFrom,
        });
      }
      if (query.priceAverageTo !== undefined) {
        qb.andWhere(`(profile.price * :feeMultiplier) <= :priceAverageTo`, {
          priceAverageTo: query.priceAverageTo,
        });
      }
    }

    if (query.followersFrom !== undefined) {
      qb.andWhere('profile.totalFollowers >= :followersFrom', {
        followersFrom: query.followersFrom,
      });
    }
    if (query.followersTo !== undefined) {
      qb.andWhere('profile.totalFollowers <= :followersTo', {
        followersTo: query.followersTo,
      });
    }
  }
}
