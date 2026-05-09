import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Campaign } from './campaign.entity';
import { User } from '../../users/entities/user.entity';
import { ApplicationStatus } from '../enums/application-status.enum';

@Entity('campaign_applications')
@Unique(['campaignId', 'influencerId'])
@Index('idx_app_influencer_status', ['influencerId', 'status'])
@Index('idx_app_campaign_status', ['campaignId', 'status'])
export class CampaignApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  campaignId: string;

  @ManyToOne(() => Campaign, (campaign) => campaign.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column()
  influencerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'influencerId' })
  influencer: User;

  @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.PENDING })
  status: ApplicationStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  offerPrice: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
