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

const campaignSeeds: CampaignSeed[] = [
  {
    name: 'نوفا للعناية بالشعر — إطلاق تشكيلة الأرجان',
    description:
      'علامة نوفا تُطلق تشكيلة جديدة مدعّمة بزيت الأرجان المغربي لعلاج التلف وتغذية الشعر. الهدف بناء وعي حقيقي بالمنتج من خلال تجارب قبل وبعد أصيلة.',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.STORY],
    contentDescription:
      'مقاطع "قبل وبعد" حقيقية بعد أسبوعين من الاستخدام، مع ذكر المكونات الرئيسية وتجربة الملمس والرائحة. يُرفق كود خصم خاص بكل مؤثر.',
    requiredInfluencersCount: 6,
    influencerType: InfluencerType.MICRO,
    budget: 18000,
    implementationPeriodDays: 14,
    deadlineOffsetDays: 21,
  },
  {
    name: 'تطبيق صحّتي — تتبّع الوجبات والتمارين',
    description:
      'تطبيق صحّتي يوفّر خطط غذائية مخصّصة وتتبّعاً يومياً للتمارين مع تغذية راجعة فورية من الذكاء الاصطناعي. يستهدف الشريحة العمرية 22-35 سنة.',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.YOUTUBE, TargetPlatform.INSTAGRAM],
    contentTypes: [ContentTypeOffer.YOUTUBE_VIDEO, ContentTypeOffer.REEL],
    contentDescription:
      'تجربة التطبيق لأسبوع كامل مع عرض لوحة التحكم، الخطة الغذائية، وتقدّم اللياقة. تُدمَج القصة الشخصية للمؤثر مع عرض الميزات الفعلية.',
    requiredInfluencersCount: 5,
    influencerType: InfluencerType.MICRO,
    budget: 22500,
    implementationPeriodDays: 10,
    deadlineOffsetDays: 18,
  },
  {
    name: 'ليلى للأزياء — كولكشن الربيع 2026',
    description:
      'تُطلق ليلى للأزياء كولكشن الربيع بـ40 قطعة مستوحاة من الأسواق المتوسطية. التركيز على الألوان الترابية والقماش المستدام بأسعار متوسطة.',
    implementationType: ImplementationType.FIELD_VISIT,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.STORY],
    contentDescription:
      'ستايل لوك بوك بثلاثة تنسيقات مختلفة للقطع الجديدة، مع توجيه المتابعين لرابط الشراء وذكر عرض الشحن المجاني للطلبات الأولى.',
    requiredInfluencersCount: 8,
    influencerType: InfluencerType.MICRO,
    budget: 24000,
    implementationPeriodDays: 12,
    deadlineOffsetDays: 20,
  },
  {
    name: 'مطعم البيت الكبير — توسّع الفروع',
    description:
      'سلسلة مطاعم البيت الكبير تفتتح 4 فروع جديدة في السعودية والإمارات. الحملة لبناء ضجّة حول الافتتاح وجذب عائلات في دائرة 10 كم من كل فرع.',
    implementationType: ImplementationType.FIELD_VISIT,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.STORY],
    contentDescription:
      'جولة داخل المطعم تعرض الأجواء والأطباق المميزة، مع دعوة صريحة للمتابعين لحجز طاولة أو تجربة منيو الافتتاح بسعر خاص.',
    requiredInfluencersCount: 10,
    influencerType: InfluencerType.MICRO,
    budget: 30000,
    implementationPeriodDays: 8,
    deadlineOffsetDays: 14,
  },
  {
    name: 'أكاديمية كود — دورة تطوير التطبيقات بالذكاء الاصطناعي',
    description:
      'أكاديمية كود تُطلق دورة متخصّصة لتعليم بناء تطبيقات الجوال باستخدام أدوات الذكاء الاصطناعي. مدّتها 8 أسابيع وتنتهي بمشروع تخرّج حقيقي.',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.YOUTUBE, TargetPlatform.INSTAGRAM],
    contentTypes: [ContentTypeOffer.YOUTUBE_VIDEO, ContentTypeOffer.REEL],
    contentDescription:
      'عرض منهج الدورة وإبراز مشروع تخرّج سبق للمؤثر بناؤه، مع مقارنة مستواه قبل وبعد الدورة. إضافة لينك تسجيل بخصم حصري 30%.',
    requiredInfluencersCount: 4,
    influencerType: InfluencerType.MICRO,
    budget: 16000,
    implementationPeriodDays: 15,
    deadlineOffsetDays: 25,
  },
  {
    name: 'ووتر بلس — ترمس ذكي مع مستشعر الترطيب',
    description:
      'ووتر بلس تُطلق ترمساً ذكياً يتتبّع كميات الماء المشروبة ويرسل تنبيهات على الهاتف. التصميم أنيق بـ6 ألوان ويناسب بيئة العمل والرياضة.',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.STORY],
    contentDescription:
      'فيديو يومي يعرض الترمس خلال الروتين الصباحي والعمل والتمرين، مع إظهار التطبيق المصاحب وعدد أكواب الماء المحققة. يُذكر الكود بقصص اليوم.',
    requiredInfluencersCount: 7,
    influencerType: InfluencerType.MICRO,
    budget: 19600,
    implementationPeriodDays: 10,
    deadlineOffsetDays: 18,
  },
  {
    name: 'شركة تك فيوتشر — استضافة سحابية للشركات الناشئة',
    description:
      'تك فيوتشر تُقدّم خطة استضافة سحابية موجّهة للشركات الناشئة بسعر تنافسي مع دعم فني 24/7 وقاعدة بيانات موزّعة وأدوات CI/CD جاهزة.',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.YOUTUBE, TargetPlatform.INSTAGRAM],
    contentTypes: [ContentTypeOffer.YOUTUBE_VIDEO, ContentTypeOffer.REEL],
    contentDescription:
      'مقارنة عملية بين الخطة وخدمات مشابهة مع عرض لوحة التحكم وسرعة نشر تطبيق فعلي. الفيديو موجّه لمطوّرين ومؤسّسي شركات ناشئة.',
    requiredInfluencersCount: 3,
    influencerType: InfluencerType.MEGA,
    budget: 21000,
    implementationPeriodDays: 14,
    deadlineOffsetDays: 22,
  },
  {
    name: 'كيدز ورلد — مجموعة ألعاب STEM للأطفال',
    description:
      'كيدز ورلد تُطلق مجموعة ألعاب تعليمية STEM للأطفال 5-12 سنة، مصنوعة من مواد آمنة ومعتمدة دولياً، تنمّي مهارات البرمجة والهندسة بطريقة ممتعة.',
    implementationType: ImplementationType.FIELD_VISIT,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.YOUTUBE],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.YOUTUBE_VIDEO],
    contentDescription:
      'فيديو تفاعلي للأطفال وهم يستخدمون الألعاب ويبنون نماذجها، مع ردّ فعل حقيقي وإظهار مدى تعلّمهم. يُوجَّه المحتوى للآباء والأمهات.',
    requiredInfluencersCount: 5,
    influencerType: InfluencerType.MICRO,
    budget: 17500,
    implementationPeriodDays: 12,
    deadlineOffsetDays: 20,
  },
  {
    name: 'سفر بلا حدود — باقات سياحية صيف 2026',
    description:
      'وكالة سفر بلا حدود تُقدّم باقات صيفية إلى جورجيا وتركيا والمغرب بأسعار شاملة تبدأ من 2500 ريال. الباقة تشمل الفندق والتنقلات والجولات الميدانية.',
    implementationType: ImplementationType.FIELD_VISIT,
    includedPlatforms: [
      TargetPlatform.INSTAGRAM,
      TargetPlatform.TIKTOK,
      TargetPlatform.YOUTUBE,
    ],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.YOUTUBE_VIDEO, ContentTypeOffer.STORY],
    contentDescription:
      'فيديو سياحي أصيل من داخل الرحلة يعرض الفندق والجولات والمطاعم المحلية، مع رأي صادق عن تجربة السفر مع الوكالة ومعلومات الحجز.',
    requiredInfluencersCount: 6,
    influencerType: InfluencerType.MICRO,
    budget: 27000,
    implementationPeriodDays: 16,
    deadlineOffsetDays: 28,
  },
  {
    name: 'بيتنا — منصة بيع وإيجار العقارات بالذكاء الاصطناعي',
    description:
      'منصة بيتنا تستخدم الذكاء الاصطناعي لمطابقة المشترين والمستأجرين مع العقارات المناسبة في ثوانٍ. تغطّي السعودية والإمارات وقطر وتضمّ 50,000 إعلان.',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.YOUTUBE, TargetPlatform.INSTAGRAM],
    contentTypes: [ContentTypeOffer.YOUTUBE_VIDEO, ContentTypeOffer.REEL],
    contentDescription:
      'جولة داخل المنصة تعرض كيف يبحث المستخدم عن شقة بمعايير محددة وتظهر له نتائج ذكية خلال ثوانٍ. يُقارَن ذلك مع البحث التقليدي ويُبرَز الفرق.',
    requiredInfluencersCount: 5,
    influencerType: InfluencerType.MEGA,
    budget: 32500,
    implementationPeriodDays: 12,
    deadlineOffsetDays: 20,
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

async function createCampaign(
  seed: CampaignSeed,
  advertiserId: string,
  categoryId: string | null,
): Promise<Campaign> {
  const campaignRepo = dataSource.getRepository(Campaign);
  const today = new Date();
  const deadlineDate = new Date(today);
  deadlineDate.setDate(today.getDate() + seed.deadlineOffsetDays);

  const influencerPrice =
    Math.round(((seed.budget * 0.9) / seed.requiredInfluencersCount) * 100) / 100;

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
    influencerPrice,
    status: CampaignStatus.APPROVED,
    currentStep: CampaignStep.REVIEW,
    submittedAt: new Date(),
    approvedAt: new Date(),
  });

  const saved = await campaignRepo.save(campaign);
  console.log(`  + ${saved.name}`);
  return saved;
}

async function run(): Promise<void> {
  await dataSource.initialize();

  const advertiser = await loadAdvertiser();
  const categoryId = await loadCategoryId();

  console.log(`\nCreating ${campaignSeeds.length} professional campaigns...\n`);
  for (const seed of campaignSeeds) {
    await createCampaign(seed, advertiser.id, categoryId);
  }

  console.log('\nDone.');
  await dataSource.destroy();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
