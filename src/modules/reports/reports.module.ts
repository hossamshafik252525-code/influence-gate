import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampaignReport } from './entities/campaign-report.entity';
import { Campaign } from '../campaign/entities/campaign.entity';
import { CampaignReportRepository } from './repositories';
import {
  CampaignReportGenerationService,
  CampaignReportQueryService,
} from './services';
import { AdvertiserReportController } from './controllers/advertiser-report.controller';
import { SubmissionsModule } from '../campaign/submissions/submissions.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CampaignReport, Campaign]),
    SubmissionsModule,
    WalletModule,
  ],
  controllers: [AdvertiserReportController],
  providers: [
    CampaignReportRepository,
    CampaignReportGenerationService,
    CampaignReportQueryService,
  ],
  exports: [CampaignReportGenerationService],
})
export class ReportsModule {}
