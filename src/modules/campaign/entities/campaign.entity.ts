import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { CampaignInvitedInfluencer } from './campaign-invited-influencer.entity';
import { CampaignApplication } from './campaign-application.entity';
import { CampaignStatus, CampaignStep, ImplementationType, InfluencerType, CampaignVisibility, CampaignContentType } from '../enums';
import { TargetPlatform } from '../../../common/enums';

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  advertiserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'advertiserId' })
  advertiser: User;

  @Column({ type: 'int', generated: 'increment', unique: true })
  campaignNumber: number;

  @Column({ type: 'enum', enum: CampaignStatus, default: CampaignStatus.DRAFT })
  status: CampaignStatus;

  @Column({ type: 'enum', enum: CampaignStep, default: CampaignStep.INFORMATION })
  currentStep: CampaignStep;

  @Column({ nullable: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  categoryId: string;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ type: 'jsonb', nullable: true })
  includedPlatforms: TargetPlatform[];

  @Column({ type: 'enum', enum: ImplementationType, nullable: true })
  implementationType: ImplementationType;

  @Column({ type: 'date', nullable: true })
  deadlineDate: Date;

  @Column({ type: 'int', nullable: true })
  implementationPeriodDays: number;

  @Column({ type: 'jsonb', nullable: true })
  contentTypes: CampaignContentType[];

  @Column({ type: 'text', nullable: true })
  contentDescription: string;

  @Column({ nullable: true })
  contentPdfUrl: string;

  @Column({ nullable: true })
  contentPdfPublicId: string;

  @Column({ type: 'int', nullable: true })
  requiredInfluencersCount: number;

  @Column({ type: 'enum', enum: InfluencerType, nullable: true })
  influencerType: InfluencerType;

  @Column({ type: 'enum', enum: CampaignVisibility, nullable: true })
  campaignVisibility: CampaignVisibility;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  budget: number;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'date', nullable: true })
  implementationStartDate: Date;

  @Column({ type: 'date', nullable: true })
  implementationEndDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  pendingMinimumDeadline: Date;

  @OneToMany(() => CampaignInvitedInfluencer, (invited) => invited.campaign)
  invitedInfluencers: CampaignInvitedInfluencer[];

  @OneToMany(() => CampaignApplication, (application) => application.campaign)
  applications: CampaignApplication[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
