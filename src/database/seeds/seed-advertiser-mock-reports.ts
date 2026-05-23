import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../../modules/users/entities/user.entity';
import { Campaign } from '../../modules/campaign/entities/campaign.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { CampaignReport } from '../../modules/reports/entities/campaign-report.entity';
import {
  Role,
  UserStatus,
  ContentTypeOffer,
  TargetPlatform,
  ImplementationType,
  InfluencerType,
} from '../../common/enums';
import {
  CampaignStatus,
  CampaignStep,
  CampaignVisibility,
} from '../../modules/campaign/enums';
import { ReportStatus } from '../../modules/reports/enums';

dotenv.config();

const ADVERTISER_EMAIL = '01113312766ae@gmail.com';

interface MockReportSeed {
  campaignName: string;
  status: ReportStatus;
  campaignVisibility: CampaignVisibility;
  includedPlatforms: TargetPlatform[];
  contentTypes: ContentTypeOffer[];
  acceptedSubmissionsInfluencersCount: number;
  actualPaid: number;
  startOffsetDays: number;
  endOffsetDays: number;
  deadlineOffsetDays: number;
  submittedOffsetDays: number;
  approvedOffsetDays: number;
}

const mockReportSeeds: MockReportSeed[] = [
  {
    campaignName: 'حملة سماعات لاسلكية احترافية',
    status: ReportStatus.COMPLETED,
    campaignVisibility: CampaignVisibility.PUBLIC,
    includedPlatforms: [TargetPlatform.YOUTUBE, TargetPlatform.INSTAGRAM],
    contentTypes: [ContentTypeOffer.YOUTUBE_VIDEO, ContentTypeOffer.REEL],
    acceptedSubmissionsInfluencersCount: 5,
    actualPaid: 12500.0,
    startOffsetDays: -60,
    endOffsetDays: -45,
    deadlineOffsetDays: -65,
    submittedOffsetDays: -70,
    approvedOffsetDays: -68,
  },
  {
    campaignName: 'حملة عطر صيفي',
    status: ReportStatus.COMPLETED,
    campaignVisibility: CampaignVisibility.PUBLIC,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.STORY],
    acceptedSubmissionsInfluencersCount: 4,
    actualPaid: 8000.0,
    startOffsetDays: -50,
    endOffsetDays: -38,
    deadlineOffsetDays: -55,
    submittedOffsetDays: -58,
    approvedOffsetDays: -57,
  },
  {
    campaignName: 'حملة تطبيق رياضة منزلية',
    status: ReportStatus.COMPLETED,
    campaignVisibility: CampaignVisibility.PUBLIC,
    includedPlatforms: [
      TargetPlatform.INSTAGRAM,
      TargetPlatform.YOUTUBE,
      TargetPlatform.TIKTOK,
    ],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.YOUTUBE_VIDEO],
    acceptedSubmissionsInfluencersCount: 6,
    actualPaid: 13200.0,
    startOffsetDays: -40,
    endOffsetDays: -22,
    deadlineOffsetDays: -45,
    submittedOffsetDays: -48,
    approvedOffsetDays: -46,
  },
  {
    campaignName: 'حملة ساعة ذكية حصرية',
    status: ReportStatus.COMPLETED,
    campaignVisibility: CampaignVisibility.PRIVATE,
    includedPlatforms: [TargetPlatform.YOUTUBE, TargetPlatform.INSTAGRAM],
    contentTypes: [ContentTypeOffer.YOUTUBE_VIDEO, ContentTypeOffer.REEL],
    acceptedSubmissionsInfluencersCount: 1,
    actualPaid: 5500.0,
    startOffsetDays: -35,
    endOffsetDays: -20,
    deadlineOffsetDays: -38,
    submittedOffsetDays: -42,
    approvedOffsetDays: -40,
  },
  {
    campaignName: 'حملة منتج عناية بالشعر',
    status: ReportStatus.COMPLETED,
    campaignVisibility: CampaignVisibility.PRIVATE,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.STORY],
    acceptedSubmissionsInfluencersCount: 1,
    actualPaid: 2750.0,
    startOffsetDays: -28,
    endOffsetDays: -18,
    deadlineOffsetDays: -32,
    submittedOffsetDays: -34,
    approvedOffsetDays: -33,
  },
  {
    campaignName: 'حملة قهوة مختصة',
    status: ReportStatus.DISCARDED,
    campaignVisibility: CampaignVisibility.PUBLIC,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.STORY],
    acceptedSubmissionsInfluencersCount: 0,
    actualPaid: 0,
    startOffsetDays: -25,
    endOffsetDays: -10,
    deadlineOffsetDays: -27,
    submittedOffsetDays: -30,
    approvedOffsetDays: -29,
  },
  {
    campaignName: 'حملة إطلاق متجر إلكتروني',
    status: ReportStatus.DISCARDED,
    campaignVisibility: CampaignVisibility.PUBLIC,
    includedPlatforms: [TargetPlatform.FACEBOOK, TargetPlatform.INSTAGRAM],
    contentTypes: [ContentTypeOffer.POST, ContentTypeOffer.REEL],
    acceptedSubmissionsInfluencersCount: 0,
    actualPaid: 0,
    startOffsetDays: -20,
    endOffsetDays: -7,
    deadlineOffsetDays: -22,
    submittedOffsetDays: -25,
    approvedOffsetDays: -23,
  },
  {
    campaignName: 'حملة كورس تعليم اللغة الإنجليزية',
    status: ReportStatus.COMPLETED,
    campaignVisibility: CampaignVisibility.PUBLIC,
    includedPlatforms: [TargetPlatform.YOUTUBE, TargetPlatform.X],
    contentTypes: [ContentTypeOffer.YOUTUBE_VIDEO, ContentTypeOffer.POST],
    acceptedSubmissionsInfluencersCount: 3,
    actualPaid: 9600.0,
    startOffsetDays: -15,
    endOffsetDays: -3,
    deadlineOffsetDays: -18,
    submittedOffsetDays: -20,
    approvedOffsetDays: -19,
  },
];

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

async function loadAdvertiser(): Promise<User> {
  const userRepo = dataSource.getRepository(User);
  const advertiser = await userRepo.findOne({
    where: { email: ADVERTISER_EMAIL, role: Role.ADVERTISER },
  });
  if (!advertiser) {
    throw new Error(
      `Advertiser with email ${ADVERTISER_EMAIL} not found (role must be ADVERTISER)`,
    );
  }
  if (advertiser.status !== UserStatus.CONFIRMED) {
    console.warn(
      `  ! Advertiser status is ${advertiser.status}, expected CONFIRMED`,
    );
  }
  return advertiser;
}

async function loadSampleCategories(): Promise<Category[]> {
  const categoryRepo = dataSource.getRepository(Category);
  const categories = await categoryRepo.find({ take: 3 });
  return categories;
}

async function clearExistingReports(advertiserId: string): Promise<void> {
  const reportRepo = dataSource.getRepository(CampaignReport);
  const existing = await reportRepo.find({ where: { advertiserId } });
  if (existing.length === 0) {
    console.log('  - No existing mock reports to clear');
    return;
  }
  const campaignIds = existing.map((r) => r.campaignId);
  await reportRepo.delete({ advertiserId });
  console.log(`  - Cleared ${existing.length} existing reports`);

  const campaignRepo = dataSource.getRepository(Campaign);
  await campaignRepo
    .createQueryBuilder()
    .delete()
    .where('id IN (:...ids)', { ids: campaignIds })
    .andWhere('advertiserId = :advertiserId', { advertiserId })
    .andWhere('name LIKE :prefix', { prefix: '[MOCK] %' })
    .execute();
  console.log('  - Removed previous placeholder campaigns');
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function createMockReports(
  advertiserId: string,
  categories: Category[],
): Promise<void> {
  const campaignRepo = dataSource.getRepository(Campaign);
  const reportRepo = dataSource.getRepository(CampaignReport);
  const today = new Date();

  for (const seed of mockReportSeeds) {
    const startDate = addDays(today, seed.startOffsetDays);
    const endDate = addDays(today, seed.endOffsetDays);
    const applicationDeadlineDate = addDays(today, seed.deadlineOffsetDays);
    const submittedAt = addDays(today, seed.submittedOffsetDays);
    const approvedAt = addDays(today, seed.approvedOffsetDays);

    const placeholderCampaign = campaignRepo.create({
      advertiserId,
      name: `[MOCK] ${seed.campaignName}`,
      description: `Mock placeholder campaign for report seeding: ${seed.campaignName}`,
      includedPlatforms: seed.includedPlatforms,
      implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
      startDate,
      endDate,
      applicationDeadlineDate,
      contentTypes: seed.contentTypes,
      contentDescription: 'Mock content description for reports demo',
      requiredInfluencersCount: Math.max(
        seed.acceptedSubmissionsInfluencersCount,
        1,
      ),
      influencerType: InfluencerType.MICRO,
      campaignVisibility: seed.campaignVisibility,
      budget: seed.actualPaid > 0 ? seed.actualPaid : 5000,
      status:
        seed.status === ReportStatus.COMPLETED
          ? CampaignStatus.COMPLETED
          : CampaignStatus.DISCARDED,
      currentStep: CampaignStep.REVIEW,
      submittedAt,
      approvedAt,
    });
    const savedCampaign = await campaignRepo.save(placeholderCampaign);

    const reportCategories = categories.slice(0, 2);

    const report = reportRepo.create({
      advertiserId,
      campaignId: savedCampaign.id,
      campaignNumber: savedCampaign.campaignNumber,
      campaignName: savedCampaign.name,
      status: seed.status,
      campaignVisibility: seed.campaignVisibility,
      categories: reportCategories,
      includedPlatforms: seed.includedPlatforms,
      contentTypes: seed.contentTypes,
      acceptedSubmissionsInfluencersCount:
        seed.acceptedSubmissionsInfluencersCount,
      actualPaid: seed.actualPaid,
      startDate,
      endDate,
      applicationDeadlineDate,
      submittedAt,
      approvedAt,
    });
    await reportRepo.save(report);

    console.log(
      `  + Report created: ${seed.campaignName} (${seed.status}, ${seed.campaignVisibility}, paid=${seed.actualPaid})`,
    );
  }
}

async function run(): Promise<void> {
  await dataSource.initialize();

  const advertiser = await loadAdvertiser();
  console.log(`Advertiser: ${advertiser.email} (id=${advertiser.id})`);

  const categories = await loadSampleCategories();
  console.log(`Loaded ${categories.length} categories for attachment`);

  console.log(`\nClearing existing mock data for ${ADVERTISER_EMAIL}...`);
  await clearExistingReports(advertiser.id);

  console.log('\nCreating mock reports + placeholder campaigns...');
  await createMockReports(advertiser.id, categories);

  console.log(`\n✓ Done. Seeded ${mockReportSeeds.length} reports.`);
  await dataSource.destroy();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
