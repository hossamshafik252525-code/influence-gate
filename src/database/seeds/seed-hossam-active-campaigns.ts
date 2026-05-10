import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../../modules/users/entities/user.entity';
import { Campaign } from '../../modules/campaign/entities/campaign.entity';
import { CampaignApplication } from '../../modules/campaign/applications/entities/campaign-application.entity';
import { CampaignSubmission } from '../../modules/campaign/submissions/entities/campaign-submission.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import {
  Role,
  UserStatus,
  ImplementationType,
  ContentTypeOffer,
  TargetPlatform,
} from '../../common/enums';
import {
  CampaignStatus,
  CampaignStep,
  CampaignVisibility,
  InfluencerType,
} from '../../modules/campaign/enums';
import { ApplicationStatus } from '../../modules/campaign/applications/enums';
import { SubmissionStatus } from '../../modules/campaign/submissions/enums';

dotenv.config();

const TARGET_INFLUENCER_EMAIL = 'hossamahmed1q1@gmail.com';

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'influence_gate',
  entities: [__dirname + '/../../modules/**/*.entity{.ts,.js}'],
  synchronize: false,
});

async function seed(): Promise<void> {
  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const campaignRepo = dataSource.getRepository(Campaign);
  const applicationRepo = dataSource.getRepository(CampaignApplication);
  const submissionRepo = dataSource.getRepository(CampaignSubmission);
  const categoryRepo = dataSource.getRepository(Category);

  const influencer = await userRepo.findOne({
    where: { email: TARGET_INFLUENCER_EMAIL, role: Role.INFLUENCER },
  });

  if (!influencer) {
    console.log(`Influencer not found: ${TARGET_INFLUENCER_EMAIL}`);
    await dataSource.destroy();
    return;
  }

  const advertiser = await userRepo.findOne({
    where: { role: Role.ADVERTISER, status: UserStatus.CONFIRMED },
  });

  if (!advertiser) {
    console.log('No confirmed advertiser found. Please create an advertiser first.');
    await dataSource.destroy();
    return;
  }

  const category = await categoryRepo.findOne({ where: {} });
  const categoryId = category?.id ?? null;

  const today = new Date();
  const deadlineDate = new Date(today);
  deadlineDate.setDate(today.getDate() + 10);

  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 3);

  // 1. Implementation Campaign
  const implementationCampaign = campaignRepo.create({
    advertiserId: advertiser.id,
    name: 'حملة التنفيذ الخاصة بحسام',
    description: 'حملة في مرحلة التنفيذ مخصصة لحسام',
    categoryId,
    includedPlatforms: [TargetPlatform.INSTAGRAM],
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    deadlineDate,
    implementationPeriodDays: 14,
    contentTypes: [ContentTypeOffer.REEL],
    contentDescription: 'تصوير ريلز لمنتج',
    requiredInfluencersCount: 1,
    influencerType: InfluencerType.MICRO,
    campaignVisibility: CampaignVisibility.PUBLIC,
    budget: 5000,
    influencerPrice: 4500,
    status: CampaignStatus.IMPLEMENTATION,
    currentStep: CampaignStep.REVIEW,
    submittedAt: new Date(),
    approvedAt: new Date(),
    implementationStartDate: startDate,
    implementationEndDate: new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000),
  });
  
  const savedImplementationCampaign = await campaignRepo.save(implementationCampaign);
  console.log(`+ Created implementation campaign: ${savedImplementationCampaign.name}`);

  // Application for implementation campaign
  const implementationApp = applicationRepo.create({
    campaignId: savedImplementationCampaign.id,
    influencerId: influencer.id,
    status: ApplicationStatus.ACCEPTED,
  });
  await applicationRepo.save(implementationApp);
  console.log('  + Created accepted application for implementation campaign');

  // 2. Completed Campaign
  const completedCampaign = campaignRepo.create({
    advertiserId: advertiser.id,
    name: 'حملة مكتملة لحسام',
    description: 'حملة تم الانتهاء منها مخصصة لحسام',
    categoryId,
    includedPlatforms: [TargetPlatform.TIKTOK],
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    deadlineDate,
    implementationPeriodDays: 7,
    contentTypes: [ContentTypeOffer.STORY],
    contentDescription: 'ستوري للمنتج',
    requiredInfluencersCount: 1,
    influencerType: InfluencerType.MICRO,
    campaignVisibility: CampaignVisibility.PUBLIC,
    budget: 3000,
    influencerPrice: 2700,
    status: CampaignStatus.COMPLETED,
    currentStep: CampaignStep.REVIEW,
    submittedAt: new Date(),
    approvedAt: new Date(),
    implementationStartDate: new Date(startDate.getTime() - 10 * 24 * 60 * 60 * 1000),
    implementationEndDate: new Date(startDate.getTime() - 3 * 24 * 60 * 60 * 1000),
  });

  const savedCompletedCampaign = await campaignRepo.save(completedCampaign);
  console.log(`+ Created completed campaign: ${savedCompletedCampaign.name}`);

  // Application for completed campaign
  const completedApp = applicationRepo.create({
    campaignId: savedCompletedCampaign.id,
    influencerId: influencer.id,
    status: ApplicationStatus.ACCEPTED,
  });
  await applicationRepo.save(completedApp);
  console.log('  + Created accepted application for completed campaign');

  // Submission for completed campaign
  const submissionAccepted = submissionRepo.create({
    campaignId: savedCompletedCampaign.id,
    influencerId: influencer.id,
    links: ['https://www.tiktok.com/@hossam/video/sample-001'],
    fileUrls: ['https://res.cloudinary.com/demo/image/upload/sample.jpg'],
    filePublicIds: ['sample'],
    status: SubmissionStatus.ACCEPTED,
  });
  await submissionRepo.save(submissionAccepted);
  console.log('  + Created accepted submission for completed campaign');

  console.log('\n✓ Done seeding active/completed campaigns for Hossam.');
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
