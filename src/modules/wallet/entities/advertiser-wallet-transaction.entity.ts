import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdvertiserWallet } from './advertiser-wallet.entity';
import { User } from '../../users/entities/user.entity';
import { Campaign } from '../../campaign/entities/campaign.entity';
import { CampaignSubmission } from '../../campaign/submissions/entities/campaign-submission.entity';
import { AdvertiserTransactionType, TransactionStatus } from '../enums';

@Entity('advertiser_wallet_transactions')
export class AdvertiserWalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  walletId: string;

  @ManyToOne(() => AdvertiserWallet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'walletId' })
  wallet: AdvertiserWallet;

  @Column({ type: 'enum', enum: AdvertiserTransactionType })
  type: AdvertiserTransactionType;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING_REVIEW })
  status: TransactionStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  campaignId: string | null;

  @ManyToOne(() => Campaign, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign | null;

  @Column({ nullable: true })
  influencerId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'influencerId' })
  influencer: User | null;

  @Column({ nullable: true })
  submissionId: string | null;

  @ManyToOne(() => CampaignSubmission, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'submissionId' })
  submission: CampaignSubmission | null;

  @Column({ nullable: true })
  invoiceImageUrl: string | null;

  @Column({ nullable: true })
  invoiceImagePublicId: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  adminNotes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
