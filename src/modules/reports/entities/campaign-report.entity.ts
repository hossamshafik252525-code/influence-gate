import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Campaign } from '../../campaign/entities/campaign.entity';
import { Category } from '../../categories/entities/category.entity';
import { CampaignVisibility } from '../../campaign/enums';
import { ContentTypeOffer, TargetPlatform } from '../../../common/enums';
import { ReportStatus } from '../enums';

@Entity('campaign_reports')
@Unique(['campaignId'])
@Index('idx_campaign_report_advertiser', ['advertiserId'])
@Index('idx_campaign_report_status', ['status'])
export class CampaignReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  advertiserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'advertiserId' })
  advertiser: User;

  @Column()
  campaignId: string;

  @ManyToOne(() => Campaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column({ type: 'int' })
  campaignNumber: number;

  @Column({ type: 'varchar', nullable: true })
  campaignName: string | null;

  @Column({ type: 'enum', enum: ReportStatus })
  status: ReportStatus;

  @Column({ type: 'enum', enum: CampaignVisibility, nullable: true })
  campaignVisibility: CampaignVisibility | null;

  @ManyToMany(() => Category)
  @JoinTable({
    name: 'campaign_report_categories',
    joinColumn: { name: 'reportId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'categoryId', referencedColumnName: 'id' },
  })
  categories: Category[];

  @Column({ type: 'jsonb', nullable: true })
  includedPlatforms: TargetPlatform[] | null;

  @Column({ type: 'jsonb', nullable: true })
  contentTypes: ContentTypeOffer[] | null;

  @Column({ type: 'int', default: 0 })
  acceptedSubmissionsInfluencersCount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  actualPaid: number;

  @Column({ type: 'date', nullable: true })
  startDate: Date | null;

  @Column({ type: 'date', nullable: true })
  endDate: Date | null;

  @Column({ type: 'date', nullable: true })
  applicationDeadlineDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
