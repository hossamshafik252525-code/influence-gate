import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { Campaign } from '../../modules/campaign/entities/campaign.entity';
import { CampaignReport } from '../../modules/reports/entities/campaign-report.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { Platform } from '../../modules/platforms/entities/platform.entity';
import { ContentType } from '../../modules/content-types/entities/content-type.entity';
import { CampaignStatus, CampaignVisibility } from '../../modules/campaign/enums';
import { ReportStatus } from '../../modules/reports/enums';
import { Role, UserStatus } from '../../common/enums';

// ─── Target Advertiser ────────────────────────────────────────────────────────
const ADVERTISER_EMAIL = 'mostafakaram345678@gmail.com';

// ─── Mock Campaign Definitions ────────────────────────────────────────────────
const MOCK_CAMPAIGNS = [
  {
    name: 'حملة سماعات لاسلكية احترافية',
    description: 'الترويج لإطلاق سماعات لاسلكية بعزل ضوضاء ومواصفات احترافية',
    visibility: CampaignVisibility.PUBLIC,
    requiredInfluencersCount: 5,
    budget: 12500,
    startDate: new Date('2025-02-01'),
    endDate: new Date('2025-02-28'),
    applicationDeadlineDate: new Date('2025-01-22'),
    reportStatus: ReportStatus.COMPLETED,
    acceptedInfluencers: 5,
    actualPaid: 12500,
    categoryNames: ['Technology'],
    platformNames: ['YouTube', 'Instagram'],
    contentTypeNames: ['Video', 'Reel'],
  },
  {
    name: 'حملة عطر صيفي جديد',
    description: 'إطلاق عطر صيفي بهوية شبابية حديثة',
    visibility: CampaignVisibility.PUBLIC,
    requiredInfluencersCount: 4,
    budget: 8000,
    startDate: new Date('2025-03-15'),
    endDate: new Date('2025-04-05'),
    applicationDeadlineDate: new Date('2025-03-05'),
    reportStatus: ReportStatus.COMPLETED,
    acceptedInfluencers: 4,
    actualPaid: 8000,
    categoryNames: ['Beauty & Skincare'],
    platformNames: ['Instagram', 'TikTok'],
    contentTypeNames: ['Reel', 'Story'],
  },
  {
    name: 'حملة تطبيق رياضة منزلية',
    description: 'الترويج لتطبيق تمارين منزلية بمدربين متخصصين',
    visibility: CampaignVisibility.PUBLIC,
    requiredInfluencersCount: 6,
    budget: 13200,
    startDate: new Date('2025-05-01'),
    endDate: new Date('2025-05-21'),
    applicationDeadlineDate: new Date('2025-04-20'),
    reportStatus: ReportStatus.COMPLETED,
    acceptedInfluencers: 6,
    actualPaid: 13200,
    categoryNames: ['Lifestyle'],
    platformNames: ['Instagram', 'YouTube', 'TikTok'],
    contentTypeNames: ['Reel', 'Video'],
  },
  {
    name: 'حملة ساعة ذكية حصرية',
    description: 'تعاون حصري لإبراز مميزات ساعة ذكية جديدة',
    visibility: CampaignVisibility.PRIVATE,
    requiredInfluencersCount: 1,
    budget: 5500,
    startDate: new Date('2025-06-10'),
    endDate: new Date('2025-06-25'),
    applicationDeadlineDate: new Date('2025-06-01'),
    reportStatus: ReportStatus.COMPLETED,
    acceptedInfluencers: 1,
    actualPaid: 5500,
    categoryNames: ['Technology'],
    platformNames: ['YouTube', 'Instagram'],
    contentTypeNames: ['Video', 'Reel'],
  },
  {
    name: 'حملة منتج عناية بالشعر',
    description: 'تعاون حصري لتجربة منتج عناية بالشعر طبيعي',
    visibility: CampaignVisibility.PRIVATE,
    requiredInfluencersCount: 1,
    budget: 2750,
    startDate: new Date('2025-07-05'),
    endDate: new Date('2025-07-15'),
    applicationDeadlineDate: new Date('2025-06-28'),
    reportStatus: ReportStatus.COMPLETED,
    acceptedInfluencers: 1,
    actualPaid: 2750,
    categoryNames: ['Beauty & Skincare'],
    platformNames: ['Instagram', 'TikTok'],
    contentTypeNames: ['Reel', 'Story'],
  },
  {
    name: 'حملة قهوة مختصة',
    description: 'الترويج لمحمصة قهوة مختصة بحبوب من مصادر مختارة',
    visibility: CampaignVisibility.PUBLIC,
    requiredInfluencersCount: 5,
    budget: 9000,
    startDate: new Date('2025-08-01'),
    endDate: new Date('2025-08-20'),
    applicationDeadlineDate: new Date('2025-07-22'),
    reportStatus: ReportStatus.DISCARDED,
    acceptedInfluencers: 0,
    actualPaid: 0,
    categoryNames: ['Food & Beverage'],
    platformNames: ['Instagram', 'TikTok'],
    contentTypeNames: ['Reel', 'Story'],
  },
  {
    name: 'حملة إطلاق متجر إلكتروني',
    description: 'حملة تعريفية بإطلاق متجر إلكتروني جديد للأزياء',
    visibility: CampaignVisibility.PUBLIC,
    requiredInfluencersCount: 8,
    budget: 16000,
    startDate: new Date('2025-09-10'),
    endDate: new Date('2025-09-30'),
    applicationDeadlineDate: new Date('2025-09-01'),
    reportStatus: ReportStatus.DISCARDED,
    acceptedInfluencers: 0,
    actualPaid: 0,
    categoryNames: ['E-Commerce', 'Fashion'],
    platformNames: ['Facebook', 'Instagram'],
    contentTypeNames: ['Post', 'Reel'],
  },
  {
    name: 'حملة كورس تعليم اللغة الإنجليزية',
    description: 'الترويج لكورس تعليم اللغة الإنجليزية أونلاين للمبتدئين',
    visibility: CampaignVisibility.PUBLIC,
    requiredInfluencersCount: 3,
    budget: 9600,
    startDate: new Date('2025-10-15'),
    endDate: new Date('2025-11-05'),
    applicationDeadlineDate: new Date('2025-10-05'),
    reportStatus: ReportStatus.COMPLETED,
    acceptedInfluencers: 3,
    actualPaid: 9600,
    categoryNames: ['Education'],
    platformNames: ['YouTube', 'X'],
    contentTypeNames: ['Video', 'Post'],
  },
];

// ─── Default Category Names (fallback if DB has none) ─────────────────────────
const DEFAULT_CATEGORIES = [
  'Food & Beverage',
  'Technology',
  'Fashion',
  'Education',
  'Beauty & Skincare',
  'Lifestyle',
  'E-Commerce',
  'Gaming',
];

async function bootstrap() {
  console.log('🌱 Starting seed: advertiser mock reports...\n');
  console.log(`🎯 Target advertiser: ${ADVERTISER_EMAIL}\n`);

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const userRepo = dataSource.getRepository(User);
  const campaignRepo = dataSource.getRepository(Campaign);
  const reportRepo = dataSource.getRepository(CampaignReport);
  const categoryRepo = dataSource.getRepository(Category);
  const platformRepo = dataSource.getRepository(Platform);
  const contentTypeRepo = dataSource.getRepository(ContentType);

  // ── 1. Find advertiser ────────────────────────────────────────────────────
  console.log('👤 Looking up advertiser...');
  let advertiser = await userRepo.findOne({
    where: { email: ADVERTISER_EMAIL },
  });

  if (!advertiser) {
    console.log(`  ⚠️  Advertiser not found. Creating new advertiser account...`);
    advertiser = await userRepo.save(
      userRepo.create({
        email: ADVERTISER_EMAIL,
        fullName: 'مصطفى كرم',
        password: '$2b$10$dummyhashforseeding1234567890ab', // placeholder hash
        role: Role.ADVERTISER,
        status: UserStatus.CONFIRMED,
      }),
    );
    console.log(`  ✅ Advertiser created: ${advertiser.email} (id: ${advertiser.id})`);
  } else {
    console.log(`  ✅ Advertiser found: ${advertiser.email} (id: ${advertiser.id})`);
  }

  // ── 2. Ensure reference data exists ──────────────────────────────────────
  console.log('\n📦 Ensuring reference data exists...');

  // Platforms (from seed-initial-data)
  const platformsMap = new Map<string, Platform>();
  const allPlatforms = await platformRepo.find();
  for (const p of allPlatforms) platformsMap.set(p.name, p);

  // Content types
  const contentTypesMap = new Map<string, ContentType>();
  const allContentTypes = await contentTypeRepo.find();
  for (const ct of allContentTypes) contentTypesMap.set(ct.name, ct);

  // Categories - create default ones if missing
  const categoriesMap = new Map<string, Category>();
  const allCategories = await categoryRepo.find();
  for (const c of allCategories) categoriesMap.set(c.name, c);

  for (const catName of DEFAULT_CATEGORIES) {
    if (!categoriesMap.has(catName)) {
      const created = await categoryRepo.save(categoryRepo.create({ name: catName }));
      categoriesMap.set(catName, created);
      console.log(`  ✅ Created category: ${catName}`);
    }
  }

  // ── 3. Create campaigns + reports ─────────────────────────────────────────
  console.log('\n📊 Creating mock campaigns and reports...\n');

  let reportsCreated = 0;
  let reportsSkipped = 0;

  for (const mock of MOCK_CAMPAIGNS) {
    // ── Create campaign ──────────────────────────────────────────────────
    const campaign = await campaignRepo.save(
      campaignRepo.create({
        advertiserId: advertiser.id,
        name: mock.name,
        description: mock.description,
        status:
          mock.reportStatus === ReportStatus.COMPLETED
            ? CampaignStatus.COMPLETED
            : CampaignStatus.DISCARDED,
        campaignVisibility: mock.visibility,
        requiredInfluencersCount: mock.requiredInfluencersCount,
        budget: mock.budget,
        startDate: mock.startDate,
        endDate: mock.endDate,
        applicationDeadlineDate: mock.applicationDeadlineDate,
        submittedAt: new Date(mock.startDate.getTime() - 10 * 24 * 60 * 60 * 1000),
        approvedAt: new Date(mock.startDate.getTime() - 8 * 24 * 60 * 60 * 1000),
        categories: mock.categoryNames
          .map((n) => categoriesMap.get(n))
          .filter(Boolean) as Category[],
        platforms: mock.platformNames
          .map((n) => platformsMap.get(n))
          .filter(Boolean) as Platform[],
        contentTypes: mock.contentTypeNames
          .map((n) => contentTypesMap.get(n))
          .filter(Boolean) as ContentType[],
      }),
    );

    // ── Check if report already exists ───────────────────────────────────
    const existingReport = await reportRepo.findOne({
      where: { campaignId: campaign.id },
    });

    if (existingReport) {
      console.log(`  ⏭️  Skipped (report exists): ${mock.name}`);
      reportsSkipped++;
      continue;
    }

    // ── Create campaign report ────────────────────────────────────────────
    await reportRepo.save(
      reportRepo.create({
        advertiserId: advertiser.id,
        campaignId: campaign.id,
        campaignNumber: campaign.campaignNumber,
        campaignName: mock.name,
        status: mock.reportStatus,
        campaignVisibility: mock.visibility,
        acceptedSubmissionsInfluencersCount: mock.acceptedInfluencers,
        actualPaid: mock.actualPaid,
        startDate: mock.startDate,
        endDate: mock.endDate,
        applicationDeadlineDate: mock.applicationDeadlineDate,
        submittedAt: new Date(mock.startDate.getTime() - 10 * 24 * 60 * 60 * 1000),
        approvedAt:
          mock.reportStatus === ReportStatus.COMPLETED
            ? new Date(mock.startDate.getTime() - 8 * 24 * 60 * 60 * 1000)
            : null,
        categories: mock.categoryNames
          .map((n) => categoriesMap.get(n))
          .filter(Boolean) as Category[],
        platforms: mock.platformNames
          .map((n) => platformsMap.get(n))
          .filter(Boolean) as Platform[],
        contentTypes: mock.contentTypeNames
          .map((n) => contentTypesMap.get(n))
          .filter(Boolean) as ContentType[],
      }),
    );

    const statusEmoji = mock.reportStatus === ReportStatus.COMPLETED ? '✅' : '🗑️';
    console.log(`  ${statusEmoji} Created report: "${mock.name}"`);
    console.log(
      `      Status: ${mock.reportStatus} | Influencers: ${mock.acceptedInfluencers} | Paid: ${mock.actualPaid} SAR`,
    );
    reportsCreated++;
  }

  // ── 4. Summary ────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────────────────────');
  console.log(`📈 Reports Summary for ${ADVERTISER_EMAIL}:`);
  console.log(`   Created : ${reportsCreated}`);
  console.log(`   Skipped : ${reportsSkipped}`);
  console.log(`   Total   : ${MOCK_CAMPAIGNS.length}`);

  const completedCount = MOCK_CAMPAIGNS.filter(
    (m) => m.reportStatus === ReportStatus.COMPLETED,
  ).length;
  const discardedCount = MOCK_CAMPAIGNS.filter(
    (m) => m.reportStatus === ReportStatus.DISCARDED,
  ).length;
  const totalPaid = MOCK_CAMPAIGNS.reduce((sum, m) => sum + m.actualPaid, 0);

  console.log(`\n   ✅ Completed campaigns : ${completedCount}`);
  console.log(`   🗑️  Discarded campaigns : ${discardedCount}`);
  console.log(`   💰 Total actual paid   : ${totalPaid.toLocaleString()} SAR`);
  console.log('─────────────────────────────────────────────────────────');
  console.log('\n✨ Seed completed successfully!\n');

  await app.close();
}

bootstrap().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
