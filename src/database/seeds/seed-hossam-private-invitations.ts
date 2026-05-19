import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../../modules/users/entities/user.entity';
import { Campaign } from '../../modules/campaign/entities/campaign.entity';
import { CampaignInvitedInfluencer } from '../../modules/campaign/invitations/entities/campaign-invited-influencer.entity';
import { PlatformSetting } from '../../modules/platform-settings/entities/platform-setting.entity';
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

const INFLUENCER_EMAIL = 'hossamahmed1q1@gmail.com';

const SERVICE_IDS = [
  'd3bd88ca-573a-4cc2-8e89-3f89dc73bcbf',
  'c372160e-6f62-4993-948f-38c2483cdbf2',
];

interface PrivateCampaignSeed {
  baseName: string;
  description: string;
  implementationType: ImplementationType;
  includedPlatforms: TargetPlatform[];
  contentTypes: ContentTypeOffer[];
  contentDescription: string;
  influencerType: InfluencerType;
  implementationPeriodDays: number;
  deadlineOffsetDays: number;
  serviceIds: string[];
}

const campaignSeeds: PrivateCampaignSeed[] = [
  {
    baseName: 'حملة خاصة - ساعة ذكية',
    description: 'تعاون حصري لإبراز مميزات ساعة ذكية جديدة',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.YOUTUBE, TargetPlatform.INSTAGRAM],
    contentTypes: [ContentTypeOffer.YOUTUBE_VIDEO, ContentTypeOffer.REEL],
    contentDescription: 'محتوى تفصيلي يعرض الميزات الصحية وتجربة الاستخدام اليومية',
    influencerType: InfluencerType.MICRO,
    implementationPeriodDays: 10,
    deadlineOffsetDays: 16,
    serviceIds: [SERVICE_IDS[0], SERVICE_IDS[1]],
  },
  {
    baseName: 'حملة خاصة - منتج عناية بالشعر',
    description: 'تعاون حصري لتجربة منتج عناية بالشعر طبيعي',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.STORY],
    contentDescription: 'تجربة المنتج وإظهار النتائج بأسلوب طبيعي وجذاب',
    influencerType: InfluencerType.MICRO,
    implementationPeriodDays: 7,
    deadlineOffsetDays: 14,
    serviceIds: [SERVICE_IDS[1]],
  },
];

async function loadInfluencer(): Promise<User> {
  const userRepo = dataSource.getRepository(User);
  const influencer = await userRepo.findOne({
    where: { email: INFLUENCER_EMAIL, role: Role.INFLUENCER },
  });
  if (!influencer) {
    throw new Error(`Influencer with email ${INFLUENCER_EMAIL} not found`);
  }
  return influencer;
}

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

async function loadFeeMultiplier(): Promise<number> {
  const settingRepo = dataSource.getRepository(PlatformSetting);
  const setting = await settingRepo.findOne({
    where: { key: 'platform_fee_percentage' },
  });
  const percentage = setting ? Number(setting.value) : 10;
  return 1 + percentage / 100;
}

async function loadServicePrices(): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  for (const id of SERVICE_IDS) {
    map.set(id, 2500);
  }
  return map;
}

async function createPrivateCampaign(
  seed: PrivateCampaignSeed,
  advertiserId: string,
  categoryId: string | null,
  feeMultiplier: number,
  servicePrices: Map<string, number>,
  uniqueSuffix: string,
): Promise<Campaign> {
  const campaignRepo = dataSource.getRepository(Campaign);
  const today = new Date();
  const deadlineDate = new Date(today);
  deadlineDate.setDate(today.getDate() + seed.deadlineOffsetDays);

  const totalBase = seed.serviceIds.reduce(
    (sum, id) => sum + (servicePrices.get(id) ?? 0),
    0,
  );
  const totalWithFee = Math.round(totalBase * feeMultiplier * 100) / 100;

  const implementationStartDate = new Date();
  const implementationEndDate = new Date(implementationStartDate);
  implementationEndDate.setDate(
    implementationStartDate.getDate() + seed.implementationPeriodDays,
  );

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
    requiredInfluencersCount: 1,
    influencerType: seed.influencerType,
    campaignVisibility: CampaignVisibility.PRIVATE,
    budget: totalWithFee,
    influencerPrice: totalWithFee,
    status: CampaignStatus.IMPLEMENTATION,
    currentStep: CampaignStep.REVIEW,
    submittedAt: new Date(),
    approvedAt: new Date(),
    implementationStartDate,
    implementationEndDate,
  });

  const saved = await campaignRepo.save(campaign);
  console.log(`  + Private campaign created: ${saved.name}`);
  return saved;
}

async function attachInvitation(
  campaign: Campaign,
  influencerId: string,
  serviceIds: string[],
  feeMultiplier: number,
  servicePrices: Map<string, number>,
): Promise<void> {
  const invitationRepo = dataSource.getRepository(CampaignInvitedInfluencer);

  const basePrice = 2500 * serviceIds.length;
  const priceWithFee = Math.round(basePrice * feeMultiplier * 100) / 100;

  const invitation = invitationRepo.create({
    campaignId: campaign.id,
    influencerId,
    basePrice,
    priceWithFee,
  });
  await invitationRepo.save(invitation);

  console.log(
    `  + Invitation sent to ${INFLUENCER_EMAIL} for: ${campaign.name} (${serviceIds.length} services)`,
  );
}

async function run(): Promise<void> {
  await dataSource.initialize();

  const influencer = await loadInfluencer();
  const advertiser = await loadAdvertiser();
  const categoryId = await loadCategoryId();
  const feeMultiplier = await loadFeeMultiplier();
  const servicePrices = await loadServicePrices();

  const uniqueSuffix = String(Date.now()).slice(-6);

  console.log(`\nCreating private campaigns and invitations for ${INFLUENCER_EMAIL}...`);

  for (const seed of campaignSeeds) {
    const campaign = await createPrivateCampaign(
      seed,
      advertiser.id,
      categoryId,
      feeMultiplier,
      servicePrices,
      uniqueSuffix,
    );
    await attachInvitation(
      campaign,
      influencer.id,
      seed.serviceIds,
      feeMultiplier,
      servicePrices,
    );
  }

  console.log('\n✓ Done.');
  await dataSource.destroy();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
