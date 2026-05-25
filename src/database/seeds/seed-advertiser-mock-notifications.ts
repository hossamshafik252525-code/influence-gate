import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { Notification } from '../../modules/notifications/entities/notification.entity';
import { NotificationType } from '../../modules/notifications/enums';
import { Role, UserStatus } from '../../common/enums';

// ─── Target Advertiser ────────────────────────────────────────────────────────
const ADVERTISER_EMAIL = 'mostafakaram345678@gmail.com';

// ─── Mock Notification Definitions ────────────────────────────────────────────
interface MockNotification {
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, string>;
  isRead: boolean;
  daysAgo: number;
}

const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    title: 'تم اعتماد حسابك',
    body: 'تهانينا! تم اعتماد حسابك كمعلن. يمكنك الآن إنشاء حملاتك الإعلانية',
    type: NotificationType.ACCOUNT_APPROVED,
    data: { action: 'OPEN_DASHBOARD' },
    isRead: true,
    daysAgo: 30,
  },
  {
    title: 'تم استلام حملتك للمراجعة',
    body: 'تم إرسال حملة "إطلاق تطبيق جديد - تقنية" للمراجعة من قِبل فريقنا',
    type: NotificationType.CAMPAIGN_SUBMITTED_FOR_REVIEW,
    data: { campaignName: 'إطلاق تطبيق جديد - تقنية' },
    isRead: true,
    daysAgo: 20,
  },
  {
    title: 'تم اعتماد حملتك',
    body: 'تم اعتماد حملة "إطلاق تطبيق جديد - تقنية" وأصبحت متاحة للمؤثرين',
    type: NotificationType.CAMPAIGN_APPROVED,
    data: { campaignName: 'إطلاق تطبيق جديد - تقنية' },
    isRead: true,
    daysAgo: 18,
  },
  {
    title: 'طلب تقديم جديد على حملتك',
    body: 'قدم المؤثر "أحمد محمد" طلب انضمام لحملة "إطلاق تطبيق جديد - تقنية"',
    type: NotificationType.NEW_CAMPAIGN_APPLICATION,
    data: {
      campaignName: 'إطلاق تطبيق جديد - تقنية',
      influencerName: 'أحمد محمد',
    },
    isRead: true,
    daysAgo: 15,
  },
  {
    title: 'طلب تقديم جديد على حملتك',
    body: 'قدمت المؤثرة "سارة علي" طلب انضمام لحملة "إطلاق تطبيق جديد - تقنية"',
    type: NotificationType.NEW_CAMPAIGN_APPLICATION,
    data: {
      campaignName: 'إطلاق تطبيق جديد - تقنية',
      influencerName: 'سارة علي',
    },
    isRead: true,
    daysAgo: 14,
  },
  {
    title: 'بدأت حملتك',
    body: 'حملة "إطلاق تطبيق جديد - تقنية" بدأت رسمياً وتم تفعيلها للمؤثرين المعتمدين',
    type: NotificationType.CAMPAIGN_STARTED,
    data: { campaignName: 'إطلاق تطبيق جديد - تقنية' },
    isRead: true,
    daysAgo: 10,
  },
  {
    title: 'إرسال محتوى جديد للمراجعة',
    body: 'قام المؤثر "أحمد محمد" بإرسال محتوى جديد لمراجعتك',
    type: NotificationType.NEW_CONTENT_SUBMISSION,
    data: {
      campaignName: 'إطلاق تطبيق جديد - تقنية',
      influencerName: 'أحمد محمد',
    },
    isRead: true,
    daysAgo: 7,
  },
  {
    title: 'تم رفض حملتك',
    body: 'لم يتم اعتماد حملة "حملة الألعاب الإلكترونية" بسبب عدم اكتمال البيانات',
    type: NotificationType.CAMPAIGN_REJECTED,
    data: {
      campaignName: 'حملة الألعاب الإلكترونية',
      reason: 'بيانات غير مكتملة',
    },
    isRead: false,
    daysAgo: 5,
  },
  {
    title: 'حملتك على وشك الإلغاء التلقائي',
    body: 'حملة "حملة العودة للمدارس" لم تصل للحد الأدنى من المؤثرين وستُلغى قريباً',
    type: NotificationType.CAMPAIGN_PENDING_MINIMUM,
    data: { campaignName: 'حملة العودة للمدارس' },
    isRead: false,
    daysAgo: 4,
  },
  {
    title: 'تم إلغاء حملتك تلقائياً',
    body: 'تم إلغاء حملة "حملة العودة للمدارس" لعدم اكتمال الحد الأدنى من المؤثرين خلال الوقت المحدد',
    type: NotificationType.CAMPAIGN_AUTO_DISCARDED,
    data: { campaignName: 'حملة العودة للمدارس' },
    isRead: false,
    daysAgo: 3,
  },
  {
    title: 'إرسال محتوى جديد للمراجعة',
    body: 'قامت المؤثرة "سارة علي" بإرسال محتوى جديد لمراجعتك',
    type: NotificationType.NEW_CONTENT_SUBMISSION,
    data: {
      campaignName: 'منتجات العناية بالبشرة - خريف 2025',
      influencerName: 'سارة علي',
    },
    isRead: false,
    daysAgo: 2,
  },
  {
    title: 'عرض جديد على طلبك',
    body: 'وصلك عرض جديد من المؤثر "خالد إبراهيم" بقيمة 3500 ر.س',
    type: NotificationType.NEW_APPLICATION_OFFER,
    data: {
      influencerName: 'خالد إبراهيم',
      offerAmount: '3500',
    },
    isRead: false,
    daysAgo: 1,
  },
  {
    title: 'رسالة جديدة',
    body: 'لديك رسالة جديدة من المؤثر "خالد إبراهيم" بخصوص حملة "حملة الجمعة البيضاء 2025"',
    type: NotificationType.NEW_CHAT_MESSAGE,
    data: {
      senderName: 'خالد إبراهيم',
      campaignName: 'حملة الجمعة البيضاء 2025',
    },
    isRead: false,
    daysAgo: 0,
  },
];

async function bootstrap() {
  console.log('🔔 Starting seed: advertiser mock notifications...\n');
  console.log(`🎯 Target advertiser: ${ADVERTISER_EMAIL}\n`);

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const userRepo = dataSource.getRepository(User);
  const notificationRepo = dataSource.getRepository(Notification);

  // ── 1. Find advertiser ────────────────────────────────────────────────────
  console.log('👤 Looking up advertiser...');
  let advertiser = await userRepo.findOne({
    where: { email: ADVERTISER_EMAIL },
  });

  if (!advertiser) {
    console.log(`  ⚠️  Advertiser not found. Creating new advertiser account...`);
    advertiser = await userRepo.save(
      userRepo.create({
        email: ADVERTISER_EMAIL,
        fullName: 'مصطفى كرم',
        password: '$2b$10$dummyhashforseeding1234567890ab', // placeholder hash
        role: Role.ADVERTISER,
        status: UserStatus.CONFIRMED,
      }),
    );
    console.log(`  ✅ Advertiser created: ${advertiser.email} (id: ${advertiser.id})`);
  } else {
    console.log(`  ✅ Advertiser found: ${advertiser.email} (id: ${advertiser.id})`);
  }

  // ── 2. Create notifications ──────────────────────────────────────────────
  console.log('\n📨 Creating mock notifications...\n');

  let notificationsCreated = 0;
  const now = Date.now();
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  for (const mock of MOCK_NOTIFICATIONS) {
    const createdAt = new Date(now - mock.daysAgo * MS_PER_DAY);

    const saved = await notificationRepo.save(
      notificationRepo.create({
        recipientId: advertiser.id,
        title: mock.title,
        body: mock.body,
        type: mock.type,
        data: mock.data ?? null,
        isRead: mock.isRead,
      }),
    );

    // Override createdAt (TypeORM @CreateDateColumn auto-sets it to now)
    await notificationRepo.update(
      { id: saved.id },
      { createdAt },
    );

    const readEmoji = mock.isRead ? '✓' : '●';
    console.log(`  ${readEmoji} [${mock.type}] "${mock.title}"`);
    console.log(`      ${mock.daysAgo}d ago | read: ${mock.isRead}`);
    notificationsCreated++;
  }

  // ── 3. Summary ────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────────────────────');
  console.log(`📈 Notifications Summary for ${ADVERTISER_EMAIL}:`);
  console.log(`   Created : ${notificationsCreated}`);

  const readCount = MOCK_NOTIFICATIONS.filter((n) => n.isRead).length;
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length;

  console.log(`\n   ✓ Read   : ${readCount}`);
  console.log(`   ● Unread : ${unreadCount}`);
  console.log('─────────────────────────────────────────────────────────');
  console.log('\n✨ Seed completed successfully!\n');

  await app.close();
}

bootstrap().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
