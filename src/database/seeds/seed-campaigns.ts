import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../../modules/users/entities/user.entity';
import { Campaign } from '../../modules/campaign/entities/campaign.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { Role, UserStatus, ImplementationType, ContentTypeOffer, TargetPlatform } from '../../common/enums';
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

const campaignVariants: Array<{
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
}> = [
  {
    name: 'حملة إطلاق منتج العناية بالبشرة',
    description: 'نبحث عن مؤثرين لتسليط الضوء على خط منتجات العناية بالبشرة الطبيعية الجديد لدينا',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.STORY],
    contentDescription: 'مطلوب تصوير مقاطع قصيرة تعرض المنتج في استخدامه اليومي مع إبراز فوائده',
    requiredInfluencersCount: 5,
    influencerType: InfluencerType.MICRO,
    budget: 5000,
    implementationPeriodDays: 14,
    deadlineOffsetDays: 20,
  },
  {
    name: 'حملة مطعم الوجبات السريعة',
    description: 'تسويق لقائمة الطعام الجديدة لدينا عبر وسائل التواصل الاجتماعي',
    implementationType: ImplementationType.FIELD_VISIT,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.YOUTUBE],
    contentTypes: [ContentTypeOffer.POST, ContentTypeOffer.YOUTUBE_VIDEO],
    contentDescription: 'زيارة المطعم وتصوير تجربة تناول الطعام والمحتوى يجب أن يكون حقيقياً وتلقائياً',
    requiredInfluencersCount: 3,
    influencerType: InfluencerType.MEGA,
    budget: 15000,
    implementationPeriodDays: 10,
    deadlineOffsetDays: 15,
  },
  {
    name: 'حملة تطبيق التوصيل الجديد',
    description: 'إطلاق تطبيق توصيل الطعام والحاجة إلى نشر واسع عبر منصات متعددة',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK, TargetPlatform.X],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.POST],
    contentDescription: 'إنشاء محتوى يوضح سهولة استخدام التطبيق ومميزاته مع رمز خصم خاص',
    requiredInfluencersCount: 8,
    influencerType: InfluencerType.MICRO,
    budget: 8000,
    implementationPeriodDays: 21,
    deadlineOffsetDays: 30,
  },
  {
    name: 'حملة ملابس العيد الموسمية',
    description: 'ترويج لمجموعة الملابس الموسمية الجديدة قبيل العيد',
    implementationType: ImplementationType.BOTH,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK, TargetPlatform.YOUTUBE],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.STORY, ContentTypeOffer.POST],
    contentDescription: 'تصوير ملابس العيد بأسلوب إبداعي يبرز التصاميم والألوان مع التوصية الشخصية',
    requiredInfluencersCount: 10,
    influencerType: InfluencerType.BOTH,
    budget: 20000,
    implementationPeriodDays: 7,
    deadlineOffsetDays: 10,
  },
  {
    name: 'حملة أكاديمية التعليم الإلكتروني',
    description: 'التسويق لدورات تدريبية متخصصة في التقنية والبرمجة',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.YOUTUBE, TargetPlatform.INSTAGRAM],
    contentTypes: [ContentTypeOffer.YOUTUBE_VIDEO, ContentTypeOffer.POST],
    contentDescription: 'مراجعة صادقة لإحدى الدورات مع إبراز القيمة التعليمية والفائدة العملية',
    requiredInfluencersCount: 4,
    influencerType: InfluencerType.MEGA,
    budget: 12000,
    implementationPeriodDays: 30,
    deadlineOffsetDays: 45,
  },
  {
    name: 'حملة منتجات اللياقة البدنية',
    description: 'ترويج لمعدات الجيم المنزلية والمكملات الغذائية الرياضية',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.STORY],
    contentDescription: 'تصوير تمارين باستخدام المنتج مع إبراز النتائج والتجربة الشخصية',
    requiredInfluencersCount: 6,
    influencerType: InfluencerType.MICRO,
    budget: 6000,
    implementationPeriodDays: 14,
    deadlineOffsetDays: 20,
  },
  {
    name: 'حملة وكالة السفر والسياحة',
    description: 'الترويج لباقات سياحية صيفية بأسعار تنافسية لوجهات عالمية',
    implementationType: ImplementationType.FIELD_VISIT,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.YOUTUBE, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.YOUTUBE_VIDEO, ContentTypeOffer.REEL, ContentTypeOffer.POST],
    contentDescription: 'توثيق رحلة سياحية كاملة وتصوير أبرز المعالم مع ذكر تفاصيل الباقة',
    requiredInfluencersCount: 3,
    influencerType: InfluencerType.MEGA,
    budget: 25000,
    implementationPeriodDays: 21,
    deadlineOffsetDays: 35,
  },
  {
    name: 'حملة متجر الإلكترونيات والتقنية',
    description: 'إطلاق جيل جديد من السماعات اللاسلكية بمواصفات متميزة',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.YOUTUBE, TargetPlatform.INSTAGRAM, TargetPlatform.X],
    contentTypes: [ContentTypeOffer.YOUTUBE_VIDEO, ContentTypeOffer.POST],
    contentDescription: 'مراجعة تقنية شاملة للمنتج تغطي جودة الصوت والتصميم والعمر الافتراضي للبطارية',
    requiredInfluencersCount: 5,
    influencerType: InfluencerType.BOTH,
    budget: 18000,
    implementationPeriodDays: 14,
    deadlineOffsetDays: 20,
  },
  {
    name: 'حملة مستحضرات التجميل الفاخرة',
    description: 'إطلاق خط تجميل جديد بمكونات طبيعية فاخرة للمرأة العربية',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK, TargetPlatform.YOUTUBE],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.STORY, ContentTypeOffer.POST],
    contentDescription: 'محتوى تطبيقي يوضح طريقة استخدام المنتج ويبرز النتائج الفورية بشكل احترافي',
    requiredInfluencersCount: 7,
    influencerType: InfluencerType.MICRO,
    budget: 9000,
    implementationPeriodDays: 10,
    deadlineOffsetDays: 18,
  },
  {
    name: 'حملة عقارات المشاريع الجديدة',
    description: 'التسويق لمشروع سكني متكامل في موقع استراتيجي بأسعار تنافسية',
    implementationType: ImplementationType.FIELD_VISIT,
    includedPlatforms: [TargetPlatform.YOUTUBE, TargetPlatform.INSTAGRAM, TargetPlatform.FACEBOOK],
    contentTypes: [ContentTypeOffer.YOUTUBE_VIDEO, ContentTypeOffer.POST],
    contentDescription: 'جولة مصورة في المشروع تبرز المرافق والموقع والتصاميم الداخلية',
    requiredInfluencersCount: 4,
    influencerType: InfluencerType.MEGA,
    budget: 30000,
    implementationPeriodDays: 30,
    deadlineOffsetDays: 45,
  },
];

async function seed() {
  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const campaignRepo = dataSource.getRepository(Campaign);
  const categoryRepo = dataSource.getRepository(Category);

  const advertiser = await userRepo.findOne({
    where: { role: Role.ADVERTISER, status: UserStatus.CONFIRMED },
  });

  if (!advertiser) {
    console.log('No confirmed advertiser found. Please create an advertiser account first.');
    await dataSource.destroy();
    return;
  }

  const category = await categoryRepo.findOne({ where: {} });

  const today = new Date();

  for (const variant of campaignVariants) {
    const deadlineDate = new Date(today);
    deadlineDate.setDate(today.getDate() + variant.deadlineOffsetDays);

    const influencerPrice =
      (variant.budget * 0.9) / variant.requiredInfluencersCount;

    const campaign = campaignRepo.create({
      advertiserId: advertiser.id,
      name: variant.name,
      description: variant.description,
      categoryId: category?.id ?? null,
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
    console.log(`Created: ${variant.name}`);
  }

  console.log(`\n✓ Seeded ${campaignVariants.length} public campaigns for advertiser: ${advertiser.email}`);

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
