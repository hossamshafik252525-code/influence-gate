import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../../modules/users/entities/user.entity';
import { Campaign } from '../../modules/campaign/entities/campaign.entity';
import { CampaignInvitedInfluencer } from '../../modules/campaign/invitations/entities/campaign-invited-influencer.entity';
import { CampaignInvitationService } from '../../modules/campaign/invitations/entities/campaign-invitation-service.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { PlatformSetting } from '../../modules/platform-settings/entities/platform-setting.entity';
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

interface ServiceSeed {
  id: string;
  price: number;
}

const INFLUENCER_SERVICES: ServiceSeed[] = [
  { id: 'd3bd88ca-573a-4cc2-8e89-3f89dc73bcbf', price: 2500 },
  { id: 'c372160e-6f62-4993-948f-38c2483cdbf2', price: 2500 },
];

interface PrivateInvitationSeed {
  campaignName: string;
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

const invitationSeeds: PrivateInvitationSeed[] = [
  {
    campaignName: 'حملة خاصة لإطلاق ساعة ذكية',
    description: 'تعاون حصري لإبراز مميزات ساعة ذكية جديدة',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.YOUTUBE, TargetPlatform.INSTAGRAM],
    contentTypes: [ContentTypeOffer.YOUTUBE_VIDEO, ContentTypeOffer.REEL],
    contentDescription: 'محتوى تفصيلي يعرض الميزات الصحية وتجربة الاستخدام اليومية',
    influencerType: InfluencerType.MICRO,
    implementationPeriodDays: 10,
    deadlineOffsetDays: 16,
    serviceIds: [INFLUENCER_SERVICES[0].id, INFLUENCER_SERVICES[1].id],
  },
  {
    campaignName: 'حملة خاصة لمنتج عناية بالشعر',
    description: 'تعاون حصري لتجربة منتج عناية بالشعر طبيعي',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.STORY],
    contentDescription: 'تجربة المنتج وإظهار النتائج بأسلوب طبيعي وجذاب',
    influencerType: InfluencerType.MICRO,
    implementationPeriodDays: 7,
    deadlineOffsetDays: 14,
    serviceIds: [INFLUENCER_SERVICES[1].id],
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

async function findOrCreatePrivateCampaign(
  seed: PrivateInvitationSeed,
  advertiserId: string,
  categoryId: string | null,
  feeMultiplier: number,
): Promise<Campaign> {
  const campaignRepo = dataSource.getRepository(Campaign);

  const existing = await campaignRepo.findOne({
    where: {
      name: seed.campaignName,
      campaignVisibility: CampaignVisibility.PRIVATE,
    },
  });

  if (existing) {
    console.log(`  - Reusing private campaign: ${seed.campaignName}`);
    return existing;
  }

  const today = new Date();
  const deadlineDate = new Date(today);
  deadlineDate.setDate(today.getDate() + seed.deadlineOffsetDays);

  const selected = INFLUENCER_SERVICES.filter((s) =>
    seed.serviceIds.includes(s.id),
  );
  const totalBase = selected.reduce((sum, s) => sum + s.price, 0);
  const totalWithFee = Math.round(totalBase * feeMultiplier * 100) / 100;

  const campaign = campaignRepo.create({
    advertiserId,
    name: seed.campaignName,
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
    status: CampaignStatus.APPROVED,
    currentStep: CampaignStep.REVIEW,
    submittedAt: new Date(),
    approvedAt: new Date(),
  });

  const saved = await campaignRepo.save(campaign);
  console.log(`  + Private campaign created: ${seed.campaignName}`);
  return saved;
}

async function attachInvitation(
  campaign: Campaign,
  influencerId: string,
  serviceIds: string[],
  feeMultiplier: number,
): Promise<void> {
  const invitationRepo = dataSource.getRepository(CampaignInvitedInfluencer);
  const invitationServiceRepo = dataSource.getRepository(CampaignInvitationService);

  const existing = await invitationRepo.findOne({
    where: { campaignId: campaign.id, influencerId },
  });

  if (existing) {
    console.log(`  - Invitation already exists for: ${campaign.name}`);
    return;
  }

  const invitation = invitationRepo.create({
    campaignId: campaign.id,
    influencerId,
  });
  const savedInvitation = await invitationRepo.save(invitation);

  const selected = INFLUENCER_SERVICES.filter((s) => serviceIds.includes(s.id));

  for (const service of selected) {
    const priceWithFee = Math.round(service.price * feeMultiplier * 100) / 100;
    const row = invitationServiceRepo.create({
      invitationId: savedInvitation.id,
      serviceId: service.id,
      basePrice: service.price,
      priceWithFee,
    });
    await invitationServiceRepo.save(row);
  }

  console.log(
    `  + Invitation attached to: ${campaign.name} (${selected.length} services)`,
  );
}

async function run(): Promise<void> {
  await dataSource.initialize();

  const influencer = await loadInfluencer();
  const advertiser = await loadAdvertiser();
  const categoryId = await loadCategoryId();
  const feeMultiplier = await loadFeeMultiplier();

  console.log(`\nSeeding invitations for ${INFLUENCER_EMAIL}...`);

  for (const seed of invitationSeeds) {
    const campaign = await findOrCreatePrivateCampaign(
      seed,
      advertiser.id,
      categoryId,
      feeMultiplier,
    );
    await attachInvitation(campaign, influencer.id, seed.serviceIds, feeMultiplier);
  }

  console.log('\n✓ Done.');
  await dataSource.destroy();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
