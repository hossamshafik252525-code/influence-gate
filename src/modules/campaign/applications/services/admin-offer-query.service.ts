import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampaignApplication } from '../entities/campaign-application.entity';
import { ApplicationStatus } from '../enums';
import {
  AdminPendingOfferItem,
  GetAdminPendingOffersResult,
} from '../interfaces/admin-offer.interface';

@Injectable()
export class AdminOfferQueryService {
  constructor(
    @InjectRepository(CampaignApplication)
    private readonly applicationRepo: Repository<CampaignApplication>,
  ) {}

  async getPendingOfferApplications(
    page: number,
    limit: number,
  ): Promise<GetAdminPendingOffersResult> {
    const [applications, total] = await this.applicationRepo
      .createQueryBuilder('app')
      .innerJoinAndSelect('app.campaign', 'campaign')
      .innerJoinAndSelect('campaign.advertiser', 'advertiser')
      .innerJoinAndSelect('app.influencer', 'influencer')
      .where('app.status = :status', {
        status: ApplicationStatus.PENDING_ADMIN_APPROVAL,
      })
      .orderBy('app.createdAt', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const data: AdminPendingOfferItem[] = applications.map((app) => {
      const influencerPrice = Number(app.basePrice ?? 0);
      const offerPrice = Number(app.offerPrice ?? 0);
      return {
        applicationId: app.id,
        influencerPrice,
        offerPrice,
        priceDelta: Math.round((influencerPrice - offerPrice) * 100) / 100,
        campaign: {
          id: app.campaign.id,
          campaignNumber: app.campaign.campaignNumber,
          name: app.campaign.name,
        },
        advertiser: {
          id: app.campaign.advertiser.id,
          fullName: app.campaign.advertiser.fullName,
        },
        influencer: {
          id: app.influencer.id,
          fullName: app.influencer.fullName,
        },
        createdAt: app.createdAt,
      };
    });

    return { data, pagination: { total, page, limit } };
  }
}
