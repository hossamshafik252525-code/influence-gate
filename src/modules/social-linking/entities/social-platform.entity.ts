import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Platform } from '../../../common/enums';

@Entity('social_platforms')
export class SocialPlatform {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.socialPlatforms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: Platform })
  platform: Platform;

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
