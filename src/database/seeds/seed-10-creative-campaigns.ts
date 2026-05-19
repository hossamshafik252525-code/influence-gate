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

const creativeCampaigns: CampaignSeed[] = [
  {
    name: 'حملة سياحة فضائية بالواقع الافتراضي',
    description: 'الترويج لتجربة واقع افتراضي تنقلك لمحطة الفضاء الدولية والمريخ',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.YOUTUBE, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.YOUTUBE_VIDEO, ContentTypeOffer.REEL],
    contentDescription: 'تجربة نظارة الواقع الافتراضي وتصوير ردود الأفعال المضحكة والمبهرة',
    requiredInfluencersCount: 5,
    influencerType: InfluencerType.MICRO,
    budget: 15000,
    implementationPeriodDays: 14,
    deadlineOffsetDays: 20,
  },
  {
    name: 'حملة تبني أشجار في غابات الأمازون',
    description: 'مبادرة بيئية تتيح للمستخدمين تبني شجرة باسمهم وتتبع نموها عبر تطبيق',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.X],
    contentTypes: [ContentTypeOffer.POST, ContentTypeOffer.STORY],
    contentDescription: 'شرح فكرة التطبيق وعرض الشهادة الرقمية لتبني الشجرة الخاصة بالمؤثر',
    requiredInfluencersCount: 10,
    influencerType: InfluencerType.MICRO,
    budget: 8000,
    implementationPeriodDays: 10,
    deadlineOffsetDays: 15,
  },
  {
    name: 'حملة روبوت المطبخ الذكي',
    description: 'إطلاق روبوت ذكي يطبخ أكثر من 100 وصفة عالمية تلقائياً',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.YOUTUBE, TargetPlatform.INSTAGRAM],
    contentTypes: [ContentTypeOffer.YOUTUBE_VIDEO, ContentTypeOffer.REEL],
    contentDescription: 'تصوير الروبوت أثناء إعداد وجبة معقدة وتذوق النتيجة النهائية',
    requiredInfluencersCount: 3,
    influencerType: InfluencerType.MEGA,
    budget: 35000,
    implementationPeriodDays: 20,
    deadlineOffsetDays: 30,
  },
  {
    name: 'حملة عيادة العلاج بالضحك',
    description: 'الترويج لعيادة صحة نفسية تستخدم جلسات الضحك الجماعي كعلاج للتوتر',
    implementationType: ImplementationType.FIELD_VISIT,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.STORY],
    contentDescription: 'حضور جلسة ضحك وتصوير الأجواء الإيجابية والتجربة غير المألوفة',
    requiredInfluencersCount: 6,
    influencerType: InfluencerType.MICRO,
    budget: 12000,
    implementationPeriodDays: 14,
    deadlineOffsetDays: 21,
  },
  {
    name: 'حملة فنادق الكبسولة تحت الماء',
    description: 'إطلاق فندق فاخر عبارة عن كبسولات زجاجية تحت سطح البحر',
    implementationType: ImplementationType.FIELD_VISIT,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.YOUTUBE],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.YOUTUBE_VIDEO],
    contentDescription: 'تصوير الإقامة الاستثنائية والأسماك التي تسبح بجوار السرير',
    requiredInfluencersCount: 2,
    influencerType: InfluencerType.MEGA,
    budget: 50000,
    implementationPeriodDays: 7,
    deadlineOffsetDays: 14,
  },
  {
    name: 'حملة نظارات الترجمة الفورية',
    description: 'نظارات ذكية تعرض ترجمة فورية للغات المختلفة على العدسة',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.TIKTOK, TargetPlatform.INSTAGRAM],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.STORY],
    contentDescription: 'التحدث مع أشخاص بلغات مختلفة وتوضيح كيف تعمل النظارة بسهولة',
    requiredInfluencersCount: 8,
    influencerType: InfluencerType.MICRO,
    budget: 18000,
    implementationPeriodDays: 15,
    deadlineOffsetDays: 25,
  },
  {
    name: 'حملة مقهى العزلة الرقمية',
    description: 'مقهى يقدم قهوة مجانية لمن يقفل هاتفه في صندوق لمدة ساعة',
    implementationType: ImplementationType.FIELD_VISIT,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.STORY],
    contentDescription: 'زيارة المقهى، قفل الهاتف، وتوثيق تجربة الاستمتاع باللحظة والقهوة',
    requiredInfluencersCount: 15,
    influencerType: InfluencerType.MICRO,
    budget: 6000,
    implementationPeriodDays: 10,
    deadlineOffsetDays: 15,
  },
  {
    name: 'حملة أحذية رياضية بخاصية تغيير اللون',
    description: 'أحذية ذكية يمكنك تغيير ألوانها وتصميمها عبر تطبيق على الجوال',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.TIKTOK, TargetPlatform.FACEBOOK],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.POST],
    contentDescription: 'تنسيق الحذاء مع 3 إطلالات مختلفة وتغيير لونه في ثوانٍ باستخدام التطبيق',
    requiredInfluencersCount: 7,
    influencerType: InfluencerType.MICRO,
    budget: 14000,
    implementationPeriodDays: 14,
    deadlineOffsetDays: 20,
  },
  {
    name: 'حملة اشتراك الفواكه الغريبة',
    description: 'خدمة توصيل شهرية لصندوق يحتوي على أندر الفواكه من حول العالم',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.STORY],
    contentDescription: 'فتح الصندوق وتجربة فواكه غير مألوفة ووصف طعمها للجمهور',
    requiredInfluencersCount: 12,
    influencerType: InfluencerType.MICRO,
    budget: 9500,
    implementationPeriodDays: 10,
    deadlineOffsetDays: 18,
  },
  {
    name: 'حملة تطبيق الجيم المنزلي بهولوجرام',
    description: 'تطبيق يبث مدرب رياضي بتقنية الهولوجرام في غرفة المعيشة',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.YOUTUBE, TargetPlatform.INSTAGRAM],
    contentTypes: [ContentTypeOffer.YOUTUBE_VIDEO, ContentTypeOffer.REEL],
    contentDescription: 'تشغيل الجهاز والتمرن مع المدرب الهولوجرامي وعرض التجربة المستقبلية',
    requiredInfluencersCount: 4,
    influencerType: InfluencerType.MEGA,
    budget: 28000,
    implementationPeriodDays: 20,
    deadlineOffsetDays: 28,
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

  for (const variant of creativeCampaigns) {
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
