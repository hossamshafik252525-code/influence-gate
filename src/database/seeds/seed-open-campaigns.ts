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

const openPublicCampaignSeeds: CampaignSeed[] = [
  {
    name: 'حملة مطعم بحري جديد',
    description: 'الترويج لافتتاح مطعم متخصص في المأكولات البحرية الطازجة',
    implementationType: ImplementationType.FIELD_VISIT,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.STORY],
    contentDescription: 'زيارة المطعم وتصوير تجربة العشاء وعرض الأطباق المميزة',
    requiredInfluencersCount: 5,
    influencerType: InfluencerType.MICRO,
    budget: 6000,
    implementationPeriodDays: 10,
    deadlineOffsetDays: 16,
  },
  {
    name: 'حملة منصة تعليمية للأطفال',
    description: 'الترويج لمنصة دروس تفاعلية للأطفال بمحتوى عربي',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.YOUTUBE],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.YOUTUBE_VIDEO],
    contentDescription: 'تجربة الأطفال للمنصة وعرض المميزات التعليمية',
    requiredInfluencersCount: 6,
    influencerType: InfluencerType.MICRO,
    budget: 7800,
    implementationPeriodDays: 14,
    deadlineOffsetDays: 22,
  },
  {
    name: 'حملة متجر إكسسوارات نسائية',
    description: 'إطلاق مجموعة إكسسوارات حديثة بتصاميم عصرية',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.STORY, ContentTypeOffer.POST],
    contentDescription: 'تنسيق الإكسسوارات مع إطلالات مختلفة وتصويرها بشكل احترافي',
    requiredInfluencersCount: 7,
    influencerType: InfluencerType.MICRO,
    budget: 8400,
    implementationPeriodDays: 12,
    deadlineOffsetDays: 18,
  },
  {
    name: 'حملة منتجات منزلية ذكية',
    description: 'الترويج لأجهزة منزلية ذكية تسهّل الحياة اليومية',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.YOUTUBE, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.YOUTUBE_VIDEO, ContentTypeOffer.REEL],
    contentDescription: 'استعراض المنتج في الاستخدام اليومي مع شرح مميزاته',
    requiredInfluencersCount: 4,
    influencerType: InfluencerType.MICRO,
    budget: 6800,
    implementationPeriodDays: 14,
    deadlineOffsetDays: 21,
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

  for (const variant of openPublicCampaignSeeds) {
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
