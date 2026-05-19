import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../../modules/users/entities/user.entity';
import { Campaign } from '../../modules/campaign/entities/campaign.entity';
import { CampaignApplication } from '../../modules/campaign/applications/entities/campaign-application.entity';
import { CampaignInvitedInfluencer } from '../../modules/campaign/invitations/entities/campaign-invited-influencer.entity';
import { CampaignSubmission } from '../../modules/campaign/submissions/entities/campaign-submission.entity';
import { Wallet } from '../../modules/wallet/entities/wallet.entity';
import { WalletTransaction } from '../../modules/wallet/entities/wallet-transaction.entity';
import { Notification } from '../../modules/notifications/entities/notification.entity';
import { InfluencerProfile } from '../../modules/influencer/entities/influencer-profile.entity';
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
import { ApplicationStatus } from '../../modules/campaign/applications/enums';
import { SubmissionStatus } from '../../modules/campaign/submissions/enums';
import { InvitationStatus } from '../../modules/campaign/invitations/enums';
import { TransactionType, TransactionStatus } from '../../modules/wallet/enums';
import { NotificationType } from '../../modules/notifications/enums';

dotenv.config();

const TARGET_INFLUENCER_EMAIL = 'hossamahmed1q1@gmail.com';

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
  visibility: CampaignVisibility;
  status: CampaignStatus;
  currentStep: CampaignStep;
}

const publicCampaignSeeds: CampaignSeed[] = [
  {
    name: 'حملة عطور الصيف الجديدة',
    description: 'الترويج لمجموعة عطور صيفية فاخرة بنفحات منعشة',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.STORY],
    contentDescription: 'تصوير ريلز يبرز ثبات العطر ورائحته في مناسبات مختلفة',
    requiredInfluencersCount: 6,
    influencerType: InfluencerType.MICRO,
    budget: 7200,
    implementationPeriodDays: 14,
    deadlineOffsetDays: 18,
    visibility: CampaignVisibility.PUBLIC,
    status: CampaignStatus.APPROVED,
    currentStep: CampaignStep.REVIEW,
  },
  {
    name: 'حملة قهوة المختصة',
    description: 'تجربة محل قهوة مختصة وعرض القائمة الجديدة',
    implementationType: ImplementationType.FIELD_VISIT,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.POST],
    contentDescription: 'زيارة الفرع الرئيسي وتصوير تجربة المشروبات الجديدة',
    requiredInfluencersCount: 4,
    influencerType: InfluencerType.MICRO,
    budget: 4800,
    implementationPeriodDays: 10,
    deadlineOffsetDays: 14,
    visibility: CampaignVisibility.PUBLIC,
    status: CampaignStatus.APPROVED,
    currentStep: CampaignStep.REVIEW,
  },
  {
    name: 'حملة تطبيق التمارين المنزلية',
    description: 'الترويج لتطبيق تمارين رياضية منزلية للمبتدئين',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.YOUTUBE],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.YOUTUBE_VIDEO],
    contentDescription: 'تجربة التطبيق وتسجيل تمرين كامل مع شرح للمميزات',
    requiredInfluencersCount: 5,
    influencerType: InfluencerType.MICRO,
    budget: 6500,
    implementationPeriodDays: 21,
    deadlineOffsetDays: 28,
    visibility: CampaignVisibility.PUBLIC,
    status: CampaignStatus.APPROVED,
    currentStep: CampaignStep.REVIEW,
  },
  {
    name: 'حملة منتجات الأطفال الآمنة',
    description: 'إطلاق خط منتجات عناية بالأطفال خالية من المواد الضارة',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.STORY, ContentTypeOffer.POST],
    contentDescription: 'استعراض المنتجات وفوائدها في الروتين اليومي للأم والطفل',
    requiredInfluencersCount: 8,
    influencerType: InfluencerType.MICRO,
    budget: 9600,
    implementationPeriodDays: 14,
    deadlineOffsetDays: 20,
    visibility: CampaignVisibility.PUBLIC,
    status: CampaignStatus.APPROVED,
    currentStep: CampaignStep.REVIEW,
  },
];

const privateCampaignSeeds: CampaignSeed[] = [
  {
    name: 'حملة إطلاق ساعة ذكية فاخرة',
    description: 'حملة خاصة لإطلاق ساعة ذكية بمواصفات متطورة لشريحة محدودة',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.YOUTUBE],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.YOUTUBE_VIDEO],
    contentDescription: 'مراجعة تقنية تفصيلية للساعة وميزاتها الذكية',
    requiredInfluencersCount: 3,
    influencerType: InfluencerType.MEGA,
    budget: 18000,
    implementationPeriodDays: 14,
    deadlineOffsetDays: 21,
    visibility: CampaignVisibility.PRIVATE,
    status: CampaignStatus.APPROVED,
    currentStep: CampaignStep.REVIEW,
  },
  {
    name: 'حملة سيارات كهربائية حصرية',
    description: 'دعوة خاصة لتجربة سيارة كهربائية جديدة في السوق',
    implementationType: ImplementationType.FIELD_VISIT,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.YOUTUBE, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.YOUTUBE_VIDEO, ContentTypeOffer.REEL],
    contentDescription: 'تجربة قيادة السيارة وتقديم انطباع شامل عن الأداء والتصميم',
    requiredInfluencersCount: 2,
    influencerType: InfluencerType.MEGA,
    budget: 25000,
    implementationPeriodDays: 21,
    deadlineOffsetDays: 30,
    visibility: CampaignVisibility.PRIVATE,
    status: CampaignStatus.APPROVED,
    currentStep: CampaignStep.REVIEW,
  },
  {
    name: 'حملة فندق فاخر - دعوة خاصة',
    description: 'الإقامة في جناح فاخر وتوثيق تجربة الضيافة',
    implementationType: ImplementationType.FIELD_VISIT,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.STORY, ContentTypeOffer.POST],
    contentDescription: 'تصوير تجربة الإقامة والمرافق والمطاعم داخل الفندق',
    requiredInfluencersCount: 3,
    influencerType: InfluencerType.MEGA,
    budget: 21000,
    implementationPeriodDays: 7,
    deadlineOffsetDays: 12,
    visibility: CampaignVisibility.PRIVATE,
    status: CampaignStatus.APPROVED,
    currentStep: CampaignStep.REVIEW,
  },
];

const implementationCampaignSeeds: CampaignSeed[] = [
  {
    name: 'حملة عبايات رمضان',
    description: 'مجموعة عبايات حصرية بمناسبة شهر رمضان',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.STORY],
    contentDescription: 'تصوير العبايات في إضاءات وأماكن مختلفة مع وصف الخامات',
    requiredInfluencersCount: 5,
    influencerType: InfluencerType.MICRO,
    budget: 7500,
    implementationPeriodDays: 14,
    deadlineOffsetDays: 20,
    visibility: CampaignVisibility.PUBLIC,
    status: CampaignStatus.IMPLEMENTATION,
    currentStep: CampaignStep.REVIEW,
  },
  {
    name: 'حملة مكملات غذائية رياضية',
    description: 'الترويج لمكملات بروتين عالية الجودة للرياضيين',
    implementationType: ImplementationType.REMOTE_PHOTOGRAPHY,
    includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.YOUTUBE],
    contentTypes: [ContentTypeOffer.REEL, ContentTypeOffer.YOUTUBE_VIDEO],
    contentDescription: 'استخدام المنتج في الروتين الرياضي وتقديم رأي صادق',
    requiredInfluencersCount: 4,
    influencerType: InfluencerType.MICRO,
    budget: 8000,
    implementationPeriodDays: 18,
    deadlineOffsetDays: 25,
    visibility: CampaignVisibility.PRIVATE,
    status: CampaignStatus.IMPLEMENTATION,
    currentStep: CampaignStep.REVIEW,
  },
];

function buildCampaign(
  advertiserId: string,
  categoryId: string | null,
  variant: CampaignSeed,
): Partial<Campaign> {
  const today = new Date();
  const deadlineDate = new Date(today);
  deadlineDate.setDate(today.getDate() + variant.deadlineOffsetDays);

  const influencerPrice = (variant.budget * 0.9) / variant.requiredInfluencersCount;

  const campaign: Partial<Campaign> = {
    advertiserId,
    name: variant.name,
    description: variant.description,
    categoryId: categoryId ?? null,
    includedPlatforms: variant.includedPlatforms,
    implementationType: variant.implementationType,
    deadlineDate,
    implementationPeriodDays: variant.implementationPeriodDays,
    contentTypes: variant.contentTypes,
    contentDescription: variant.contentDescription,
    requiredInfluencersCount: variant.requiredInfluencersCount,
    influencerType: variant.influencerType,
    campaignVisibility: variant.visibility,
    budget: variant.budget,
    influencerPrice: Math.round(influencerPrice * 100) / 100,
    status: variant.status,
    currentStep: variant.currentStep,
    submittedAt: new Date(),
    approvedAt: new Date(),
  };

  if (variant.status === CampaignStatus.IMPLEMENTATION) {
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 3);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + variant.implementationPeriodDays);
    campaign.implementationStartDate = startDate;
    campaign.implementationEndDate = endDate;
  }

  return campaign;
}

async function seed(): Promise<void> {
  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const campaignRepo = dataSource.getRepository(Campaign);
  const applicationRepo = dataSource.getRepository(CampaignApplication);
  const invitationRepo = dataSource.getRepository(CampaignInvitedInfluencer);
  const notificationRepo = dataSource.getRepository(Notification);
  const submissionRepo = dataSource.getRepository(CampaignSubmission);
  const walletRepo = dataSource.getRepository(Wallet);
  const transactionRepo = dataSource.getRepository(WalletTransaction);
  const influencerProfileRepo = dataSource.getRepository(InfluencerProfile);
  const categoryRepo = dataSource.getRepository(Category);

  const influencer = await userRepo.findOne({
    where: { email: TARGET_INFLUENCER_EMAIL, role: Role.INFLUENCER },
  });

  if (!influencer) {
    console.log(`Influencer not found: ${TARGET_INFLUENCER_EMAIL}`);
    await dataSource.destroy();
    return;
  }

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

  const influencerProfile = await influencerProfileRepo.findOne({
    where: { userId: influencer.id },
  });



  const createdPublicCampaigns: Campaign[] = [];
  for (const variant of publicCampaignSeeds) {
    const campaign = campaignRepo.create(buildCampaign(advertiser.id, categoryId, variant));
    const saved = await campaignRepo.save(campaign);
    createdPublicCampaigns.push(saved);
    console.log(`  + Public campaign: ${variant.name}`);
  }

  const createdPrivateCampaigns: Campaign[] = [];
  for (const variant of privateCampaignSeeds) {
    const campaign = campaignRepo.create(buildCampaign(advertiser.id, categoryId, variant));
    const saved = await campaignRepo.save(campaign);
    createdPrivateCampaigns.push(saved);
    console.log(`  + Private campaign: ${variant.name}`);
  }

  const createdImplementationCampaigns: Campaign[] = [];
  for (const variant of implementationCampaignSeeds) {
    const campaign = campaignRepo.create(buildCampaign(advertiser.id, categoryId, variant));
    const saved = await campaignRepo.save(campaign);
    createdImplementationCampaigns.push(saved);
    console.log(`  + Implementation campaign: ${variant.name}`);
  }

  console.log('\n--- Applications (influencer applied to public campaigns) ---');
  const applicationStatuses = [
    ApplicationStatus.ACCEPTED,
    ApplicationStatus.PENDING,
    ApplicationStatus.REJECTED,
    ApplicationStatus.PENDING,
  ];
  for (let i = 0; i < createdPublicCampaigns.length; i += 1) {
    const campaign = createdPublicCampaigns[i];
    const status = applicationStatuses[i % applicationStatuses.length];
    const application = applicationRepo.create({
      campaignId: campaign.id,
      influencerId: influencer.id,
      status,
    });
    await applicationRepo.save(application);
    console.log(`  + Application: ${campaign.name} → ${status}`);
  }

  console.log('\n--- Invitations (influencer invited to private campaigns) ---');
  const invitationStatuses = [
    InvitationStatus.PENDING,
    InvitationStatus.ACCEPTED,
    InvitationStatus.REJECTED,
  ];
  for (let i = 0; i < createdPrivateCampaigns.length; i += 1) {
    const campaign = createdPrivateCampaigns[i];
    const status = invitationStatuses[i % invitationStatuses.length];
    const basePrice = influencerProfile?.price ? Number(influencerProfile.price) : 500;
    const priceWithFee = Math.round(basePrice * 1.1 * 100) / 100;
    
    const invitation = invitationRepo.create({
      campaignId: campaign.id,
      influencerId: influencer.id,
      status,
      basePrice,
      priceWithFee,
    });
    await invitationRepo.save(invitation);

    console.log(`  + Invitation: ${campaign.name} → ${status}`);
  }

  console.log('\n--- Implementation campaigns: invitations + applications + submissions ---');

  if (createdImplementationCampaigns.length > 0) {
    const impCampaign = createdImplementationCampaigns[0];
    const basePrice = influencerProfile?.price ? Number(influencerProfile.price) : 500;
    const priceWithFee = Math.round(basePrice * 1.1 * 100) / 100;

    const impInvitation = invitationRepo.create({
      campaignId: impCampaign.id,
      influencerId: influencer.id,
      status: InvitationStatus.ACCEPTED,
      basePrice,
      priceWithFee,
    });
    await invitationRepo.save(impInvitation);

    const submissionAccepted = submissionRepo.create({
      campaignId: impCampaign.id,
      influencerId: influencer.id,
      links: [
        'https://www.instagram.com/p/sample-post-001',
        'https://www.tiktok.com/@influencer/video/sample-001',
      ],
      fileUrls: [
        'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      ],
      filePublicIds: ['sample'],
      status: SubmissionStatus.ACCEPTED,
    });
    await submissionRepo.save(submissionAccepted);
    console.log(`  + Submission (accepted): ${impCampaign.name}`);
  }

  if (createdImplementationCampaigns.length > 1) {
    const impCampaign2 = createdImplementationCampaigns[1];
    const impApplication = applicationRepo.create({
      campaignId: impCampaign2.id,
      influencerId: influencer.id,
      status: ApplicationStatus.ACCEPTED,
    });
    await applicationRepo.save(impApplication);

    const submissionPending = submissionRepo.create({
      campaignId: impCampaign2.id,
      influencerId: influencer.id,
      links: ['https://www.instagram.com/p/sample-post-002'],
      fileUrls: ['https://res.cloudinary.com/demo/image/upload/sample2.jpg'],
      filePublicIds: ['sample2'],
      status: SubmissionStatus.PENDING_REVIEW,
    });
    await submissionRepo.save(submissionPending);
    console.log(`  + Submission (pending review): ${impCampaign2.name}`);
  }

  console.log('\n--- Wallet & Transactions ---');
  let wallet = await walletRepo.findOne({ where: { userId: influencer.id } });
  if (!wallet) {
    wallet = await walletRepo.save(walletRepo.create({ userId: influencer.id }));
    console.log('  + Wallet created');
  } else {
    console.log('  ✓ Wallet exists');
  }

  const acceptedPublicCampaign = createdPublicCampaigns[0];
  const acceptedPrivateCampaign = createdPrivateCampaigns[1];
  const implementationCampaign = createdImplementationCampaigns[0];

  const transactionsData: Partial<WalletTransaction>[] = [
    {
      walletId: wallet.id,
      type: TransactionType.REVENUE,
      status: TransactionStatus.DONE,
      amount: 1080,
      campaignId: acceptedPublicCampaign?.id ?? null,
      campaignName: acceptedPublicCampaign?.name ?? 'حملة عطور الصيف الجديدة',
      includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
      description: 'أرباح من حملة عطور الصيف',
    },
    {
      walletId: wallet.id,
      type: TransactionType.REVENUE,
      status: TransactionStatus.DONE,
      amount: 5400,
      campaignId: acceptedPrivateCampaign?.id ?? null,
      campaignName: acceptedPrivateCampaign?.name ?? 'حملة سيارات كهربائية حصرية',
      includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.YOUTUBE],
      description: 'أرباح من حملة السيارات الكهربائية',
    },
    {
      walletId: wallet.id,
      type: TransactionType.REVENUE,
      status: TransactionStatus.PENDING_REVIEW,
      amount: 1500,
      campaignId: implementationCampaign?.id ?? null,
      campaignName: implementationCampaign?.name ?? 'حملة عبايات رمضان',
      includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
      description: 'أرباح حملة عبايات رمضان - قيد المراجعة',
    },
    {
      walletId: wallet.id,
      type: TransactionType.WITHDRAWAL,
      status: TransactionStatus.DONE,
      amount: 2000,
      campaignId: null,
      campaignName: null,
      includedPlatforms: null,
      description: 'سحب أرباح إلى الحساب البنكي',
    },
    {
      walletId: wallet.id,
      type: TransactionType.WITHDRAWAL,
      status: TransactionStatus.PENDING_REVIEW,
      amount: 800,
      campaignId: null,
      campaignName: null,
      includedPlatforms: null,
      description: 'طلب سحب أرباح - قيد المراجعة',
    },
    {
      walletId: wallet.id,
      type: TransactionType.REVENUE,
      status: TransactionStatus.CANCELLED,
      amount: 600,
      campaignId: null,
      campaignName: 'حملة سابقة ملغاة',
      includedPlatforms: [TargetPlatform.INSTAGRAM],
      description: 'ألغيت بسبب مخالفة شروط المحتوى',
      adminNotes: 'المحتوى المقدم لم يستوف متطلبات الحملة',
    },
  ];

  for (const tx of transactionsData) {
    await transactionRepo.save(transactionRepo.create(tx));
    console.log(`  + Transaction: ${tx.type} ${tx.amount} (${tx.status})`);
  }

  const doneRevenue = transactionsData
    .filter((t) => t.type === TransactionType.REVENUE && t.status === TransactionStatus.DONE)
    .reduce((sum, t) => sum + (t.amount as number), 0);
  const doneWithdrawals = transactionsData
    .filter((t) => t.type === TransactionType.WITHDRAWAL && t.status === TransactionStatus.DONE)
    .reduce((sum, t) => sum + (t.amount as number), 0);
  const pendingRevenue = transactionsData
    .filter((t) => t.type === TransactionType.REVENUE && t.status === TransactionStatus.PENDING_REVIEW)
    .reduce((sum, t) => sum + (t.amount as number), 0);

  wallet.withdrawableBalance = doneRevenue - doneWithdrawals;
  wallet.pendingBalance = pendingRevenue;
  await walletRepo.save(wallet);
  console.log(`  ✓ Wallet balances updated (withdrawable=${wallet.withdrawableBalance}, pending=${wallet.pendingBalance})`);

  console.log('\n--- Notifications ---');
  const notificationsData: Array<Partial<Notification>> = [
    {
      recipientId: influencer.id,
      title: 'دعوة جديدة لحملة خاصة',
      body: `تم دعوتك للمشاركة في حملة: ${createdPrivateCampaigns[0]?.name ?? 'حملة خاصة'}`,
      type: NotificationType.CAMPAIGN_INVITATION,
      data: { campaignId: createdPrivateCampaigns[0]?.id ?? '' },
      isRead: false,
    },
    {
      recipientId: influencer.id,
      title: 'تم قبول طلب مشاركتك',
      body: `تمت الموافقة على طلبك للمشاركة في حملة: ${createdPublicCampaigns[0]?.name ?? ''}`,
      type: NotificationType.APPLICATION_ACCEPTED,
      data: { campaignId: createdPublicCampaigns[0]?.id ?? '' },
      isRead: false,
    },
    {
      recipientId: influencer.id,
      title: 'تم رفض طلب مشاركتك',
      body: `للأسف لم يتم قبول طلبك في حملة: ${createdPublicCampaigns[2]?.name ?? ''}`,
      type: NotificationType.APPLICATION_REJECTED,
      data: { campaignId: createdPublicCampaigns[2]?.id ?? '' },
      isRead: true,
    },
    {
      recipientId: influencer.id,
      title: 'بدأت حملة جديدة',
      body: `بدأت مرحلة التنفيذ في حملة: ${createdImplementationCampaigns[0]?.name ?? ''}`,
      type: NotificationType.CAMPAIGN_STARTED,
      data: { campaignId: createdImplementationCampaigns[0]?.id ?? '' },
      isRead: false,
    },
    {
      recipientId: influencer.id,
      title: 'تم قبول المحتوى المقدم',
      body: `تم قبول المحتوى الذي قدمته في حملة: ${createdImplementationCampaigns[0]?.name ?? ''}`,
      type: NotificationType.SUBMISSION_ACCEPTED,
      data: { campaignId: createdImplementationCampaigns[0]?.id ?? '' },
      isRead: false,
    },
    {
      recipientId: influencer.id,
      title: 'مطلوب تعديل على المحتوى',
      body: 'يرجى مراجعة الملاحظات وتعديل المحتوى المقدم',
      type: NotificationType.SUBMISSION_MODIFICATION_REQUESTED,
      data: { campaignId: createdImplementationCampaigns[1]?.id ?? '' },
      isRead: false,
    },
    {
      recipientId: influencer.id,
      title: 'تمت الموافقة على حسابك',
      body: 'مرحبًا بك! تمت الموافقة على ملفك ويمكنك الآن استلام الحملات',
      type: NotificationType.ACCOUNT_APPROVED,
      data: null,
      isRead: true,
    },
  ];

  for (const n of notificationsData) {
    await notificationRepo.save(notificationRepo.create(n));
    console.log(`  + Notification: ${n.type}`);
  }

  console.log('\n========================================');
  console.log(`✓ Seeded mock data for ${influencer.email}`);
  console.log(`  Public campaigns:         ${createdPublicCampaigns.length}`);
  console.log(`  Private campaigns:        ${createdPrivateCampaigns.length}`);
  console.log(`  Implementation campaigns: ${createdImplementationCampaigns.length}`);
  console.log(`  Applications:             ${createdPublicCampaigns.length + 1}`);
  console.log(`  Invitations:              ${createdPrivateCampaigns.length + 1}`);
  console.log(`  Submissions:              2`);
  console.log(`  Transactions:             ${transactionsData.length}`);
  console.log(`  Notifications:            ${notificationsData.length}`);
  console.log('========================================');

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
