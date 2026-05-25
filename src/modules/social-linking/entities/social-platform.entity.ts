import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SocialPlatformName } from '../enums';
import { InfluencerProfile } from '../../influencer/entities/influencer-profile.entity';

@Entity('social_platforms')
export class SocialPlatform {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  influencerProfileId: string;

  @ManyToOne(() => InfluencerProfile, (ip) => ip.socialPlatforms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'influencerProfileId' })
  influencerProfile: InfluencerProfile;

  @Column({ type: 'enum', enum: SocialPlatformName })
  platform: SocialPlatformName;

  @Column()
  platformUserId: string;

  @Column({ nullable: true })
  platformUsername: string;

  @Column({ type: 'text' })
  accessToken: string;

  @Column({ nullable: true })
  pageAccessToken: string;

  @Column({ type: 'timestamp', nullable: true })
  tokenExpiresAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  profileData: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  statistics: Record<string, any>;

  @CreateDateColumn()
  connectedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
