import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CampaignSubmission } from '../../campaign/submissions/entities/campaign-submission.entity';
import { TargetPlatform } from '../../../common/enums';

export interface CampaignSnapshot {
  title: string;
  description: string | null;
  includedPlatforms: TargetPlatform[];
}

@Entity('influencer_ratings')
@Unique(['submissionId'])
@Index('idx_rating_influencer', ['influencerId'])
export class InfluencerRating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  submissionId: string;

  @ManyToOne(() => CampaignSubmission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submissionId' })
  submission: CampaignSubmission;

  @Column()
  influencerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'influencerId' })
  influencer: User;

  /** Snapshot of the campaign at rating time */
  @Column({ type: 'jsonb' })
  campaignSnapshot: CampaignSnapshot;

  /** 1–5 */
  @Column({ type: 'smallint' })
  commitment: number;

  /** 1–5 */
  @Column({ type: 'smallint' })
  qualityOfWork: number;

  /** 1–5 */
  @Column({ type: 'smallint' })
  communication: number;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
