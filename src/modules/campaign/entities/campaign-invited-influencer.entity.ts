import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Campaign } from './campaign.entity';
import { User } from '../../users/entities/user.entity';
import { CampaignInvitationService } from './campaign-invitation-service.entity';
import { InvitationStatus } from '../enums/invitation-status.enum';

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

  @Column({ type: 'enum', enum: InvitationStatus, default: InvitationStatus.PENDING })
  status: InvitationStatus;

  @OneToMany(
    () => CampaignInvitationService,
    (invitationService) => invitationService.invitation,
    { cascade: true },
  )
  orderedServices: CampaignInvitationService[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
