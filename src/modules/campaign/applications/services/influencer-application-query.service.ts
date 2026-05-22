import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampaignApplication } from '../entities/campaign-application.entity';
import { GetInfluencerApplicationsQueryDto } from '../dto';
import { PaginatedResult } from '../../../../common/interfaces';
import { CampaignRepository } from '../../repositories';

@Injectable()
export class InfluencerApplicationQueryService {
  constructor(
    @InjectRepository(CampaignApplication)
    private readonly applicationRepository: Repository<CampaignApplication>,
    private readonly campaignRepository: CampaignRepository,
  ) {}

  async getApplications(
    userId: string,
    query: GetInfluencerApplicationsQueryDto,
  ): Promise<PaginatedResult<CampaignApplication>> {
    const qb = this.applicationRepository
      .createQueryBuilder('app')
      .innerJoinAndSelect('app.campaign', 'campaign')
      .where('app.influencerId = :userId', { userId });

    this.campaignRepository.applyCommonCampaignFilters(qb, query);

    qb.orderBy('app.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      pagination: { total, page: query.page, limit: query.limit },
    };
  }
}
