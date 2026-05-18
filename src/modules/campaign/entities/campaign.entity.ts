import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinColumn,
  JoinTable,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { CampaignInvitedInfluencer } from '../invitations/entities/campaign-invited-influencer.entity';
import { CampaignApplication } from '../applications/entities/campaign-application.entity';
import { ImplementationType, ContentTypeOffer } from '../../../common/enums';
import { CampaignStatus, CampaignStep, InfluencerType, CampaignVisibility } from '../enums';
import { TargetPlatform } from '../../../common/enums';

@Entity('campaigns')
@Index('idx_campaign_status', ['status'])
@Index('idx_campaign_advertiser_status', ['advertiserId', 'status'])
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

  @ManyToMany(() => Category)
  @JoinTable({
    name: 'campaign_categories',
    joinColumn: { name: 'campaignId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'categoryId', referencedColumnName: 'id' },
  })
  categories: Category[];

  @Column({ type: 'jsonb', nullable: true })
  includedPlatforms: TargetPlatform[];

  @Column({ type: 'enum', enum: ImplementationType, nullable: true })
  implementationType: ImplementationType;

  @Column({ type: 'date', nullable: true })
  deadlineDate: Date;

  @Column({ type: 'int', nullable: true })
  implementationPeriodDays: number;

  @Column({ type: 'jsonb', nullable: true })
  contentTypes: ContentTypeOffer[];

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
