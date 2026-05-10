import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../../modules/users/entities/user.entity';
import { Campaign } from '../../modules/campaign/entities/campaign.entity';
import { CampaignApplication } from '../../modules/campaign/applications/entities/campaign-application.entity';
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

const INFLUENCER_SERVICES = [
  {
    id: 'd3bd88ca-573a-4cc2-8e89-3f89dc73bcbf',
    price: 2500,
  },
  {
    id: 'c372160e-6f62-4993-948f-38c2483cdbf2',
    price: 2500,
  },
];

interface PublicCampaignSeed {
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

interface PrivateCampaignSeed {
  name: string;
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

const publicCampaignSeeds: PublicCampaignSeed[] = [
  {
    name: 'حملة سماعات لاسلكية جديدة',
    description: 'الترويج لإطلاق سماعات لاسلكية بعزل ضوضاء ومواصفات احترافية',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.YOUTUBE, TargetPlatform.INSTAGRAM],
    contentTypes: [ContentTypeOffer.YOUTUBE_VIDEO, ContentTypeOffer.REEL],
    contentDescription: 'مراجعة المنتج بشكل احترافي وإبراز جودة الصوت والتصميم',
    requiredInfluencersCount: 5,
    influencerType: InfluencerType.MICRO,
    budget: 12500,
    implementationPeriodDays: 10,
    deadlineOffsetDays: 18,
  },
  {
    name: 'حملة عطر صيفي جديد',
    description: 'إطلاق عطر صيفي بهوية شبابية حديثة',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.STORY],
    contentDescription: 'تجربة العطر وتقديم انطباع شخصي بطريقة جذابة',
    requiredInfluencersCount: 4,
    influencerType: InfluencerType.MICRO,
    budget: 8000,
    implementationPeriodDays: 7,
    deadlineOffsetDays: 14,
  },
  {
    name: 'حملة تطبيق رياضة منزلية',
    description: 'الترويج لتطبيق تمارين منزلية بمدربين متخصصين',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.YOUTUBE, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.YOUTUBE_VIDEO],
    contentDescription: 'تنفيذ تمرين باستخدام التطبيق وإبراز سهولة الاستخدام',
    requiredInfluencersCount: 6,
    influencerType: InfluencerType.MICRO,
    budget: 13200,
    implementationPeriodDays: 14,
    deadlineOffsetDays: 21,
  },
];

const privateCampaignSeeds: PrivateCampaignSeed[] = [
  {
    name: 'حملة خاصة لإطلاق ساعة ذكية',
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
    name: 'حملة خاصة لمنتج عناية بالشعر',
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

async function clearInfluencerData(influencerId: string): Promise<void> {
  const applicationRepo = dataSource.getRepository(CampaignApplication);
  const invitationRepo = dataSource.getRepository(CampaignInvitedInfluencer);
  const invitationServiceRepo = dataSource.getRepository(CampaignInvitationService);
  const campaignRepo = dataSource.getRepository(Campaign);

  await applicationRepo.delete({ influencerId });

  const invitations = await invitationRepo.find({ where: { influencerId } });
  const invitedCampaignIds = invitations.map((inv) => inv.campaignId);

  if (invitations.length > 0) {
    await invitationServiceRepo
      .createQueryBuilder()
      .delete()
      .where('invitationId IN (:...ids)', { ids: invitations.map((i) => i.id) })
      .execute();
    await invitationRepo.delete({ influencerId });
  }

  if (invitedCampaignIds.length > 0) {
    await campaignRepo
      .createQueryBuilder()
      .delete()
      .where('id IN (:...ids)', { ids: invitedCampaignIds })
      .andWhere('campaignVisibility = :visibility', {
        visibility: CampaignVisibility.PRIVATE,
      })
      .execute();
  }

  console.log(
    `  - Cleared ${invitations.length} invitations and removed their private campaigns for ${INFLUENCER_EMAIL}`,
  );
}

async function createPublicCampaigns(advertiserId: string, categoryId: string | null): Promise<void> {
  const campaignRepo = dataSource.getRepository(Campaign);
  const today = new Date();

  for (const seed of publicCampaignSeeds) {
    const deadlineDate = new Date(today);
    deadlineDate.setDate(today.getDate() + seed.deadlineOffsetDays);

    const influencerPrice = (seed.budget * 0.9) / seed.requiredInfluencersCount;

    const campaign = campaignRepo.create({
      advertiserId,
      name: seed.name,
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
      influencerPrice: Math.round(influencerPrice * 100) / 100,
      status: CampaignStatus.APPROVED,
      currentStep: CampaignStep.REVIEW,
      submittedAt: new Date(),
      approvedAt: new Date(),
    });

    await campaignRepo.save(campaign);
    console.log(`  + Public campaign created: ${seed.name}`);
  }
}

async function createPrivateCampaignsWithInvitations(
  advertiserId: string,
  influencerId: string,
  categoryId: string | null,
  feeMultiplier: number,
): Promise<void> {
  const campaignRepo = dataSource.getRepository(Campaign);
  const invitationRepo = dataSource.getRepository(CampaignInvitedInfluencer);
  const invitationServiceRepo = dataSource.getRepository(CampaignInvitationService);
  const today = new Date();

  for (const seed of privateCampaignSeeds) {
    const deadlineDate = new Date(today);
    deadlineDate.setDate(today.getDate() + seed.deadlineOffsetDays);

    const selectedServices = INFLUENCER_SERVICES.filter((s) =>
      seed.serviceIds.includes(s.id),
    );

    const totalBase = selectedServices.reduce((sum, s) => sum + s.price, 0);
    const totalWithFee =
      Math.round(totalBase * feeMultiplier * 100) / 100;

    const campaign = campaignRepo.create({
      advertiserId,
      name: seed.name,
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
    const savedCampaign = await campaignRepo.save(campaign);

    const invitation = invitationRepo.create({
      campaignId: savedCampaign.id,
      influencerId,
    });
    const savedInvitation = await invitationRepo.save(invitation);

    for (const service of selectedServices) {
      const priceWithFee =
        Math.round(service.price * feeMultiplier * 100) / 100;
      const row = invitationServiceRepo.create({
        invitationId: savedInvitation.id,
        serviceId: service.id,
        basePrice: service.price,
        priceWithFee,
      });
      await invitationServiceRepo.save(row);
    }

    console.log(
      `  + Private campaign + invitation created: ${seed.name} (${selectedServices.length} services)`,
    );
  }
}

async function run(): Promise<void> {
  await dataSource.initialize();

  const influencer = await loadInfluencer();
  const advertiser = await loadAdvertiser();
  const categoryId = await loadCategoryId();
  const feeMultiplier = await loadFeeMultiplier();

  console.log(`\nClearing existing data for ${INFLUENCER_EMAIL}...`);
  await clearInfluencerData(influencer.id);

  console.log('\nCreating new public campaigns...');
  await createPublicCampaigns(advertiser.id, categoryId);

  console.log('\nCreating new private campaigns with invitations...');
  await createPrivateCampaignsWithInvitations(
    advertiser.id,
    influencer.id,
    categoryId,
    feeMultiplier,
  );

  console.log('\n✓ Done.');
  await dataSource.destroy();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
