import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { CampaignInvitedInfluencer } from './campaign-invited-influencer.entity';
import { InfluencerService } from '../../influencer/entities/influencer-service.entity';

@Entity('campaign_invitation_services')
@Unique(['invitationId', 'serviceId'])
export class CampaignInvitationService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  invitationId: string;

  @ManyToOne(
    () => CampaignInvitedInfluencer,
    (invitation) => invitation.orderedServices,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'invitationId' })
  invitation: CampaignInvitedInfluencer;

  @Column()
  serviceId: string;

  @ManyToOne(() => InfluencerService, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serviceId' })
  service: InfluencerService;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceWithFee: number;

  @CreateDateColumn()
  createdAt: Date;
}
