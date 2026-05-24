import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { User } from './modules/users/entities/user.entity';
import { Campaign } from './modules/campaign/entities/campaign.entity';
import { CampaignSubmission } from './modules/campaign/submissions/entities/campaign-submission.entity';
import { RatingService } from './modules/rating/services/rating.service';
import { CampaignStatus, CampaignStep } from './modules/campaign/enums';
import { SubmissionStatus } from './modules/campaign/submissions/enums';
import { Role } from './common/enums';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  const userRepo = dataSource.getRepository(User);
  const campaignRepo = dataSource.getRepository(Campaign);
  const submissionRepo = dataSource.getRepository(CampaignSubmission);
  const ratingService = app.get(RatingService);

  const email = 'hossamahmed1q1@gmail.com';
  const influencer = await userRepo.findOne({ where: { email } });

  if (!influencer) {
    console.log(`Influencer with email ${email} not found.`);
    await app.close();
    process.exit(1);
  }

  // Find an advertiser to be the creator of the campaigns
  let mockAdvertiser = await userRepo.findOne({ where: { role: Role.ADVERTISER } });
  const advertiserId = mockAdvertiser ? mockAdvertiser.id : influencer.id;

  for (let i = 1; i <= 3; i++) {
    // 1. Create Mock Campaign
    const campaign = await campaignRepo.save({
      advertiserId,
      name: `Mock Campaign ${i}`,
      description: `This is mock campaign ${i} for testing rating response.`,
      status: CampaignStatus.IMPLEMENTATION,
      currentStep: CampaignStep.INFORMATION,
      includedPlatforms: ['instagram', 'tiktok'],
    });

    // 2. Create Mock Submission
    const submission = await submissionRepo.save({
      campaignId: campaign.id,
      influencerId: influencer.id,
      links: [`https://instagram.com/p/mock${i}`],
      status: SubmissionStatus.ACCEPTED,
    });

    // 3. Add Rating
    try {
      await ratingService.createRating({
        submissionId: submission.id,
        commitment: 4 + (i % 2), // 4 or 5
        qualityOfWork: 5,
        communication: 4,
        note: `Awesome job on campaign ${i}! highly recommended.`,
      });
      console.log(`Successfully added rating for campaign ${i}`);
    } catch (e) {
      console.error(`Error adding rating for campaign ${i}:`, e.message);
    }
  }

  console.log('Finished seeding ratings!');
  await app.close();
}

bootstrap();
