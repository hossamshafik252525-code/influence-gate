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

interface PublicCampaignSeed {
  baseName: string;
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

const campaignSeeds: PublicCampaignSeed[] = [
  {
    baseName: 'حملة عامة - كورس تعلم لغات',
    description: 'منصة تعلم لغات أونلاين بمدربين متخصصين وخطط مرنة',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.YOUTUBE, TargetPlatform.INSTAGRAM],
    contentTypes: [ContentTypeOffer.YOUTUBE_VIDEO, ContentTypeOffer.REEL],
    contentDescription: 'تجربة المنصة وعرض درس قصير وتقديم تجربة شخصية للمتابعين',
    requiredInfluencersCount: 4,
    influencerType: InfluencerType.MICRO,
    budget: 11200,
    implementationPeriodDays: 12,
    deadlineOffsetDays: 20,
  },
  {
    baseName: 'حملة عامة - منتج عناية بالبشرة',
    description: 'إطلاق سيروم عناية بالبشرة بمكونات طبيعية',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.STORY],
    contentDescription: 'استعراض المنتج وإبراز النتائج خلال أسبوع من الاستخدام',
    requiredInfluencersCount: 5,
    influencerType: InfluencerType.MICRO,
    budget: 12500,
    implementationPeriodDays: 10,
    deadlineOffsetDays: 18,
  },
  {
    baseName: 'حملة عامة - تطبيق توصيل طعام',
    description: 'الترويج لتطبيق توصيل طعام جديد بعروض حصرية',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [
      TargetPlatform.INSTAGRAM,
      TargetPlatform.TIKTOK,
      TargetPlatform.YOUTUBE,
    ],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.YOUTUBE_VIDEO],
    contentDescription: 'تجربة الطلب من التطبيق وتقديم كود خصم للمتابعين',
    requiredInfluencersCount: 6,
    influencerType: InfluencerType.MICRO,
    budget: 15000,
    implementationPeriodDays: 8,
    deadlineOffsetDays: 14,
  },
  {
    baseName: 'حملة عامة - أدوات مطبخ ذكية',
    description: 'مجموعة أدوات مطبخ ذكية تسهّل تحضير الوجبات اليومية',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.STORY],
    contentDescription: 'استخدام الأدوات في تحضير وصفة وإبراز سهولة الاستخدام',
    requiredInfluencersCount: 4,
    influencerType: InfluencerType.MICRO,
    budget: 9600,
    implementationPeriodDays: 9,
    deadlineOffsetDays: 16,
  },
  {
    baseName: 'حملة عامة - منصة استثمار',
    description: 'منصة استثمار ميسرة للمبتدئين بدورات تعليمية مدمجة',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.YOUTUBE, TargetPlatform.INSTAGRAM],
    contentTypes: [ContentTypeOffer.YOUTUBE_VIDEO, ContentTypeOffer.REEL],
    contentDescription: 'شرح بسيط للمنصة وكيف يبدأ المتابع باستثمار آمن',
    requiredInfluencersCount: 3,
    influencerType: InfluencerType.MICRO,
    budget: 9000,
    implementationPeriodDays: 14,
    deadlineOffsetDays: 22,
  },
];

async function loadAdvertiser(): Promise<User> {
  const userRepo = dataSource.getRepository(User);
  const advertiser = await userRepo.findOne({
    where: { role: Role.ADVERTISER, status: UserStatus.CONFIRMED },
  });
  if (!advertiser) {
    throw new Error('No confirmed advertiser found in the system');
  }
  return advertiser;
}

async function loadCategoryId(): Promise<string | null> {
  const categoryRepo = dataSource.getRepository(Category);
  const category = await categoryRepo.findOne({ where: {} });
  return category?.id ?? null;
}

async function createPublicCampaign(
  seed: PublicCampaignSeed,
  advertiserId: string,
  categoryId: string | null,
  uniqueSuffix: string,
): Promise<Campaign> {
  const campaignRepo = dataSource.getRepository(Campaign);
  const today = new Date();
  const deadlineDate = new Date(today);
  deadlineDate.setDate(today.getDate() + seed.deadlineOffsetDays);

  const influencerPrice =
    Math.round(((seed.budget * 0.9) / seed.requiredInfluencersCount) * 100) / 100;

  const campaign = campaignRepo.create({
    advertiserId,
    name: `${seed.baseName} ${uniqueSuffix}`,
    description: seed.description,
    categoryId,
    includedPlatforms: seed.includedPlatforms,
    implementationType: seed.implementationType,
    deadlineDate,
    implementationPeriodDays: seed.implementationPeriodDays,
    contentTypes: seed.contentTypes,
    contentDescription: seed.contentDescription,
    requiredInfluencersCount: seed.requiredInfluencersCount,
    influencerType: seed.influencerType,
    campaignVisibility: CampaignVisibility.PUBLIC,
    budget: seed.budget,
    influencerPrice,
    status: CampaignStatus.APPROVED,
    currentStep: CampaignStep.REVIEW,
    submittedAt: new Date(),
    approvedAt: new Date(),
  });

  const saved = await campaignRepo.save(campaign);
  console.log(`  + Public campaign created: ${saved.name}`);
  return saved;
}

async function run(): Promise<void> {
  await dataSource.initialize();

  const advertiser = await loadAdvertiser();
  const categoryId = await loadCategoryId();
  const uniqueSuffix = String(Date.now()).slice(-6);

  console.log(`\nCreating ${campaignSeeds.length} public campaigns...`);
  for (const seed of campaignSeeds) {
    await createPublicCampaign(seed, advertiser.id, categoryId, uniqueSuffix);
  }

  console.log('\nDone.');
  await dataSource.destroy();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
