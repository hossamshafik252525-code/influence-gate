import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampaignApplication } from '../entities/campaign-application.entity';
import { ApplicationStatus } from '../enums';

@Injectable()
export class ApplicationsDataService {
  constructor(
    @InjectRepository(CampaignApplication)
    private readonly applicationRepository: Repository<CampaignApplication>,
  ) {}

  async getAcceptedInfluencerIds(campaignId: string): Promise<string[]> {
    const applications = await this.applicationRepository.find({
      where: { campaignId, status: ApplicationStatus.ACCEPTED },
    });
    return applications.map((a) => a.influencerId);
  }

  async getPriceForInfluencer(
    campaignId: string,
    influencerId: string,
  ): Promise<number> {
    const application = await this.applicationRepository.findOne({
      where: { campaignId, influencerId, status: ApplicationStatus.ACCEPTED },
    });
    return application ? Number(application.priceWithFee) : 0;
  }

  async countAcceptedApplications(campaignId: string): Promise<number> {
    return this.applicationRepository.count({
      where: { campaignId, status: ApplicationStatus.ACCEPTED },
    });
  }

  async sumAcceptedCost(campaignId: string): Promise<number> {
    const acceptedApplications = await this.applicationRepository.find({
      where: { campaignId, status: ApplicationStatus.ACCEPTED },
    });
    return acceptedApplications.reduce(
      (sum, app) => sum + Number(app.priceWithFee || 0),
      0,
    );
  }

  async listPending(campaignId: string): Promise<CampaignApplication[]> {
    return this.applicationRepository.find({
      where: { campaignId, status: ApplicationStatus.PENDING },
    });
  }

  async listAccepted(campaignId: string): Promise<CampaignApplication[]> {
    return this.applicationRepository.find({
      where: { campaignId, status: ApplicationStatus.ACCEPTED },
    });
  }
}
