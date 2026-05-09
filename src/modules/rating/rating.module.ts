import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InfluencerRating } from './entities/influencer-rating.entity';
import { InfluencerProfile } from '../influencer/entities/influencer-profile.entity';
import { RatingService } from './services/rating.service';
import { AdminRatingController } from './controllers/admin-rating.controller';
import { InfluencerRatingController } from './controllers/influencer-rating.controller';
import { CampaignModule } from '../campaign/campaign.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InfluencerRating, InfluencerProfile]),
    CampaignModule,
  ],
  controllers: [AdminRatingController, InfluencerRatingController],
  providers: [RatingService],
})
export class RatingModule {}
