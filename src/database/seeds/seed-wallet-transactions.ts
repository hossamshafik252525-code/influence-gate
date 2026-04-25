import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../../modules/users/entities/user.entity';
import { Wallet } from '../../modules/wallet/entities/wallet.entity';
import { WalletTransaction } from '../../modules/wallet/entities/wallet-transaction.entity';
import { TransactionType, TransactionStatus } from '../../modules/wallet/enums';
import { TargetPlatform } from '../../common/enums';

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

async function seed() {
  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const walletRepo = dataSource.getRepository(Wallet);
  const transactionRepo = dataSource.getRepository(WalletTransaction);

  const influencer = await userRepo.findOne({
    where: { email: '01113312766ae@gmail.com' },
  });

  if (!influencer) {
    console.log('Influencer not found: 01113312766ae@gmail.com');
    await dataSource.destroy();
    return;
  }

  let wallet = await walletRepo.findOne({ where: { userId: influencer.id } });

  if (!wallet) {
    wallet = walletRepo.create({ userId: influencer.id });
    wallet = await walletRepo.save(wallet);
    console.log('Created wallet for influencer');
  }

  const transactions: Partial<WalletTransaction>[] = [
    {
      walletId: wallet.id,
      type: TransactionType.REVENUE,
      status: TransactionStatus.DONE,
      amount: 1500,
      campaignId: null,
      campaignName: 'حملة إطلاق منتج العناية بالبشرة',
      includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
      description: 'أرباح من حملة منتجات العناية بالبشرة',
    },
    {
      walletId: wallet.id,
      type: TransactionType.REVENUE,
      status: TransactionStatus.DONE,
      amount: 2200,
      campaignId: null,
      campaignName: 'حملة ملابس العيد الموسمية',
      includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK, TargetPlatform.YOUTUBE],
      description: 'أرباح من حملة ملابس العيد',
    },
    {
      walletId: wallet.id,
      type: TransactionType.REVENUE,
      status: TransactionStatus.PENDING_REVIEW,
      amount: 800,
      campaignId: null,
      campaignName: 'حملة منتجات اللياقة البدنية',
      includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
      description: 'أرباح من حملة اللياقة البدنية - قيد المراجعة',
    },
    {
      walletId: wallet.id,
      type: TransactionType.REVENUE,
      status: TransactionStatus.DONE,
      amount: 3000,
      campaignId: null,
      campaignName: 'حملة وكالة السفر والسياحة',
      includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.YOUTUBE, TargetPlatform.TIKTOK],
      description: 'أرباح من حملة السياحة الصيفية',
    },
    {
      walletId: wallet.id,
      type: TransactionType.WITHDRAWAL,
      status: TransactionStatus.DONE,
      amount: 1000,
      campaignId: null,
      campaignName: null,
      includedPlatforms: null,
      description: 'سحب أرباح',
    },
    {
      walletId: wallet.id,
      type: TransactionType.REVENUE,
      status: TransactionStatus.CANCELLED,
      amount: 500,
      campaignId: null,
      campaignName: 'حملة مستحضرات التجميل الفاخرة',
      includedPlatforms: [TargetPlatform.INSTAGRAM, TargetPlatform.TIKTOK],
      description: 'ملغاة بسبب عدم استيفاء شروط المحتوى',
      adminNotes: 'المحتوى المقدم لا يستوفي متطلبات الحملة',
    },
    {
      walletId: wallet.id,
      type: TransactionType.REVENUE,
      status: TransactionStatus.PENDING_REVIEW,
      amount: 1200,
      campaignId: null,
      campaignName: 'حملة متجر الإلكترونيات والتقنية',
      includedPlatforms: [TargetPlatform.YOUTUBE, TargetPlatform.INSTAGRAM],
      description: 'أرباح من حملة السماعات اللاسلكية - قيد المراجعة',
    },
    {
      walletId: wallet.id,
      type: TransactionType.WITHDRAWAL,
      status: TransactionStatus.PENDING_REVIEW,
      amount: 600,
      campaignId: null,
      campaignName: null,
      includedPlatforms: null,
      description: 'طلب سحب أرباح - قيد المراجعة',
    },
  ];

  for (const txData of transactions) {
    const tx = transactionRepo.create(txData);
    await transactionRepo.save(tx);
    console.log(`Created transaction: ${txData.type} - ${txData.amount} SAR - ${txData.status}`);
  }

  const doneRevenue = transactions
    .filter((t) => t.type === TransactionType.REVENUE && t.status === TransactionStatus.DONE)
    .reduce((sum, t) => sum + (t.amount as number), 0);

  const doneWithdrawals = transactions
    .filter((t) => t.type === TransactionType.WITHDRAWAL && t.status === TransactionStatus.DONE)
    .reduce((sum, t) => sum + (t.amount as number), 0);

  const pendingAmount = transactions
    .filter((t) => t.status === TransactionStatus.PENDING_REVIEW)
    .reduce((sum, t) => sum + (t.amount as number), 0);

  wallet.withdrawableBalance = doneRevenue - doneWithdrawals;
  wallet.pendingBalance = pendingAmount;
  await walletRepo.save(wallet);

  console.log(`\nWallet updated:`);
  console.log(`  Withdrawable balance: ${wallet.withdrawableBalance} SAR`);
  console.log(`  Pending balance: ${wallet.pendingBalance} SAR`);
  console.log(`\n✓ Seeded ${transactions.length} transactions for influencer: ${influencer.email}`);

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
