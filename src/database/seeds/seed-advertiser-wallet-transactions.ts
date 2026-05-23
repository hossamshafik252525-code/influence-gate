import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../../modules/users/entities/user.entity';
import { AdvertiserWallet } from '../../modules/wallet/entities/advertiser-wallet.entity';
import { AdvertiserWalletTransaction } from '../../modules/wallet/entities/advertiser-wallet-transaction.entity';
import {
  AdvertiserTransactionType,
  TransactionStatus,
} from '../../modules/wallet/enums';

dotenv.config();

const ADVERTISER_EMAIL = '01113312766ae@gmail.com';
const INFLUENCER_ID = '81625c6b-add8-41b6-bb30-711111a52d5c';
const CAMPAIGN_ID = '85041119-b648-436e-81d3-26f74eb23605';

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

async function seed(): Promise<void> {
  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const walletRepo = dataSource.getRepository(AdvertiserWallet);
  const transactionRepo = dataSource.getRepository(AdvertiserWalletTransaction);

  const advertiser = await userRepo.findOne({ where: { email: ADVERTISER_EMAIL } });
  if (!advertiser) {
    console.log(`Advertiser not found: ${ADVERTISER_EMAIL}`);
    await dataSource.destroy();
    return;
  }

  let wallet = await walletRepo.findOne({ where: { advertiserId: advertiser.id } });
  if (!wallet) {
    wallet = walletRepo.create({ advertiserId: advertiser.id });
    wallet = await walletRepo.save(wallet);
    console.log('Created advertiser wallet');
  }

  const transactions: Array<Partial<AdvertiserWalletTransaction>> = [
    {
      walletId: wallet.id,
      type: AdvertiserTransactionType.CHARGE,
      status: TransactionStatus.DONE,
      amount: 10000,
      invoiceImageUrl: 'https://res.cloudinary.com/demo/image/upload/v1700000000/invoices/charge-done.jpg',
      invoiceImagePublicId: 'invoices/charge-done',
      description: 'شحن المحفظة عبر تحويل بنكي - تمت الموافقة',
      adminNotes: 'تم التحقق من الفاتورة',
    },
    {
      walletId: wallet.id,
      type: AdvertiserTransactionType.CHARGE,
      status: TransactionStatus.PENDING_REVIEW,
      amount: 2500,
      invoiceImageUrl: 'https://res.cloudinary.com/demo/image/upload/v1700000000/invoices/charge-pending.jpg',
      invoiceImagePublicId: 'invoices/charge-pending',
      description: 'شحن المحفظة - بانتظار مراجعة الإدارة',
    },
    {
      walletId: wallet.id,
      type: AdvertiserTransactionType.RESERVE,
      status: TransactionStatus.DONE,
      amount: 3000,
      campaignId: CAMPAIGN_ID,
      influencerId: null,
      description: 'حجز ميزانية الحملة عند الإنشاء',
    },
    {
      walletId: wallet.id,
      type: AdvertiserTransactionType.RESERVE,
      status: TransactionStatus.DONE,
      amount: 1200,
      campaignId: CAMPAIGN_ID,
      influencerId: INFLUENCER_ID,
      description: 'حجز مبلغ لدعوة المؤثر بعد إنشاء الحملة',
    },
    {
      walletId: wallet.id,
      type: AdvertiserTransactionType.RELEASE_RESERVED,
      status: TransactionStatus.DONE,
      amount: 500,
      campaignId: CAMPAIGN_ID,
      influencerId: null,
      description: 'تحرير جزء من الميزانية المحجوزة بعد تعديل الحملة',
    },
    {
      walletId: wallet.id,
      type: AdvertiserTransactionType.RELEASE_RESERVED,
      status: TransactionStatus.DONE,
      amount: 400,
      campaignId: CAMPAIGN_ID,
      influencerId: INFLUENCER_ID,
      description: 'تحرير المبلغ المحجوز للمؤثر بعد إلغاء الدعوة',
    },
    {
      walletId: wallet.id,
      type: AdvertiserTransactionType.PAY_INFLUENCER,
      status: TransactionStatus.DONE,
      amount: 800,
      campaignId: CAMPAIGN_ID,
      influencerId: INFLUENCER_ID,
      description: 'دفع للمؤثر بعد قبول المحتوى المقدم',
    },
    {
      walletId: wallet.id,
      type: AdvertiserTransactionType.WITHDRAW,
      status: TransactionStatus.DONE,
      amount: 1500,
      description: 'سحب جزء من الرصيد المتاح - تمت الموافقة',
      adminNotes: 'تم تحويل المبلغ على الحساب البنكي',
    },
    {
      walletId: wallet.id,
      type: AdvertiserTransactionType.WITHDRAW,
      status: TransactionStatus.PENDING_REVIEW,
      amount: 600,
      description: 'طلب سحب جديد - بانتظار مراجعة الإدارة',
    },
  ];

  for (const txData of transactions) {
    const tx = transactionRepo.create(txData);
    await transactionRepo.save(tx);
    console.log(
      `Created transaction: ${txData.type} - ${txData.amount} SAR - ${txData.status}`,
    );
  }

  let availableBalance = 0;
  let reservedBalance = 0;
  let totalPaid = 0;

  for (const tx of transactions) {
    const amount = tx.amount as number;
    const status = tx.status as TransactionStatus;
    const type = tx.type as AdvertiserTransactionType;

    if (type === AdvertiserTransactionType.CHARGE && status === TransactionStatus.DONE) {
      availableBalance += amount;
    } else if (
      type === AdvertiserTransactionType.WITHDRAW &&
      (status === TransactionStatus.DONE || status === TransactionStatus.PENDING_REVIEW)
    ) {
      availableBalance -= amount;
    } else if (type === AdvertiserTransactionType.RESERVE && status === TransactionStatus.DONE) {
      availableBalance -= amount;
      reservedBalance += amount;
    } else if (
      type === AdvertiserTransactionType.RELEASE_RESERVED &&
      status === TransactionStatus.DONE
    ) {
      reservedBalance -= amount;
      availableBalance += amount;
    } else if (
      type === AdvertiserTransactionType.PAY_INFLUENCER &&
      status === TransactionStatus.DONE
    ) {
      reservedBalance -= amount;
      totalPaid += amount;
    }
  }

  wallet.availableBalance = availableBalance;
  wallet.reservedBalance = reservedBalance;
  wallet.totalPaid = totalPaid;
  await walletRepo.save(wallet);

  console.log(`\nAdvertiser wallet updated:`);
  console.log(`  Available balance: ${availableBalance} SAR`);
  console.log(`  Reserved balance: ${reservedBalance} SAR`);
  console.log(`  Total paid:       ${totalPaid} SAR`);
  console.log(
    `\n✓ Seeded ${transactions.length} transactions for advertiser: ${advertiser.email}`,
  );

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
