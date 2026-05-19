import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../../modules/users/entities/user.entity';
import { Campaign } from '../../modules/campaign/entities/campaign.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import {
  Role,
  UserStatus,
  ImplementationType,
  ContentTypeOffer,
  TargetPlatform,
  InfluencerType,
} from '../../common/enums';
import {
  CampaignStatus,
  CampaignStep,
  CampaignVisibility,
} from '../../modules/campaign/enums';

dotenv.config();

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

interface CampaignSeed {
  name: string;
  description: string;
  implementationType: ImplementationType;
  includedPlatforms: TargetPlatform[];
  contentTypes: ContentTypeOffer[];
  contentDescription: string;
  requiredInfluencersCount: number;
  influencerType: InfluencerType;
  budget: number;
  implementationPeriodDays: number;
  deadlineOffsetDays: number;
}

const newArabicCampaigns: CampaignSeed[] = [
  {
    name: 'حملة تطبيق توصيل طلبات',
    description: 'الترويج لتطبيق توصيل جديد يقدم خصومات حصرية وتوصيل سريع',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.STORY],
    contentDescription: 'شرح كيفية استخدام التطبيق واستعراض سرعة التوصيل مع كود الخصم',
    requiredInfluencersCount: 10,
    influencerType: InfluencerType.MICRO,
    budget: 10000,
    implementationPeriodDays: 14,
    deadlineOffsetDays: 20,
  },
  {
    name: 'حملة عيادة تجميل وعناية بالبشرة',
    description: 'الترويج لخدمات وعروض عيادة تجميل متخصصة في العناية بالبشرة',
    implementationType: ImplementationType.FIELD_VISIT,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.X],
    contentTypes: [ContentTypeOffer.POST, ContentTypeOffer.STORY],
    contentDescription: 'زيارة العيادة وتجربة أحد الخدمات التجميلية مع شرح الفوائد',
    requiredInfluencersCount: 4,
    influencerType: InfluencerType.MEGA,
    budget: 15000,
    implementationPeriodDays: 20,
    deadlineOffsetDays: 30,
  },
  {
    name: 'حملة مقهى مختص جديد',
    description: 'تغطية لافتتاح مقهى يقدم قهوة مختصة وحلويات فريدة',
    implementationType: ImplementationType.FIELD_VISIT,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.STORY],
    contentDescription: 'زيارة المقهى وتصوير الديكور وتجربة المشروبات والحلويات',
    requiredInfluencersCount: 8,
    influencerType: InfluencerType.MICRO,
    budget: 4000,
    implementationPeriodDays: 7,
    deadlineOffsetDays: 10,
  },
  {
    name: 'حملة عروض أزياء رياضية',
    description: 'التسويق لتخفيضات موسمية على الملابس والأحذية الرياضية',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.FACEBOOK, TargetPlatform.INSTAGRAM],
    contentTypes: [ContentTypeOffer.POST, ContentTypeOffer.STORY, ContentTypeOffer.REEL],
    contentDescription: 'ارتداء وتنسيق الأزياء الرياضية وعرض جودتها للجمهور',
    requiredInfluencersCount: 6,
    influencerType: InfluencerType.MICRO,
    budget: 8000,
    implementationPeriodDays: 10,
    deadlineOffsetDays: 15,
  },
  {
    name: 'حملة إطلاق عطر شرقي حصري',
    description: 'الترويج لإصدار عطر جديد يدمج بين الروائح العصرية والشرقية',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.YOUTUBE, TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.YOUTUBE_VIDEO, ContentTypeOffer.REEL],
    contentDescription: 'استعراض تغليف العطر وذكر مكوناته وانطباع الاستخدام',
    requiredInfluencersCount: 3,
    influencerType: InfluencerType.MEGA,
    budget: 25000,
    implementationPeriodDays: 25,
    deadlineOffsetDays: 35,
  },
];

async function seed(): Promise<void> {
  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const campaignRepo = dataSource.getRepository(Campaign);
  const categoryRepo = dataSource.getRepository(Category);

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

  let createdCount = 0;
  let skippedCount = 0;

  for (const variant of newArabicCampaigns) {
    const exists = await campaignRepo.findOne({ where: { name: variant.name } });
    if (exists) {
      console.log(`  - Skipped (exists): ${variant.name}`);
      skippedCount += 1;
      continue;
    }

    const deadlineDate = new Date(today);
    deadlineDate.setDate(today.getDate() + variant.deadlineOffsetDays);
    const influencerPrice = (variant.budget * 0.9) / variant.requiredInfluencersCount;

    const campaign = campaignRepo.create({
      advertiserId: advertiser.id,
      name: variant.name,
      description: variant.description,
      categoryId,
      includedPlatforms: variant.includedPlatforms,
      implementationType: variant.implementationType,
      deadlineDate,
      implementationPeriodDays: variant.implementationPeriodDays,
      contentTypes: variant.contentTypes,
      contentDescription: variant.contentDescription,
      requiredInfluencersCount: variant.requiredInfluencersCount,
      influencerType: variant.influencerType,
      campaignVisibility: CampaignVisibility.PUBLIC,
      budget: variant.budget,
      influencerPrice: Math.round(influencerPrice * 100) / 100,
      status: CampaignStatus.APPROVED,
      currentStep: CampaignStep.REVIEW,
      submittedAt: new Date(),
      approvedAt: new Date(),
    });

    await campaignRepo.save(campaign);
    console.log(`  + Created: ${variant.name}`);
    createdCount += 1;
  }

  console.log(`\n✓ Done. Created: ${createdCount}, Skipped: ${skippedCount}`);
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
