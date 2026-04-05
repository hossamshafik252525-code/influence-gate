import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Campaign } from './campaign.entity';
import { User } from '../../users/entities/user.entity';
import { SubmissionStatus } from '../enums/submission-status.enum';

@Entity('campaign_submissions')
@Unique(['campaignId', 'influencerId'])
export class CampaignSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  campaignId: string;

  @ManyToOne(() => Campaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column()
  influencerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'influencerId' })
  influencer: User;

  @Column({ type: 'jsonb' })
  links: string[];

  @Column({ type: 'jsonb', nullable: true })
  fileUrls: string[];

  @Column({ type: 'jsonb', nullable: true })
  filePublicIds: string[];

  @Column({ type: 'enum', enum: SubmissionStatus, default: SubmissionStatus.PENDING_REVIEW })
  status: SubmissionStatus;

  @Column({ type: 'text', nullable: true })
  modificationDetails: string;

  @Column({ type: 'jsonb', nullable: true })
  modificationFileUrls: string[];

  @Column({ type: 'jsonb', nullable: true })
  modificationFilePublicIds: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
