import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Campaign } from './campaign.entity';
import { User } from '../../users/entities/user.entity';

@Entity('campaign_invited_influencers')
@Unique(['campaignId', 'influencerId'])
export class CampaignInvitedInfluencer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  campaignId: string;

  @ManyToOne(() => Campaign, (campaign) => campaign.invitedInfluencers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column()
  influencerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'influencerId' })
  influencer: User;

  @CreateDateColumn()
  createdAt: Date;
}
