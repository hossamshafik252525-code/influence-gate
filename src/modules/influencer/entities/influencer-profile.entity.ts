import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { InfluencerService } from './influencer-service.entity';
import { SocialPlatform } from '../../social-linking/entities/social-platform.entity';
import { InfluencerCategory } from './influencer-category.entity';

@Entity('influencer_profiles')
export class InfluencerProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ unique: true, nullable: true })
  userName: string;

  @Column({ nullable: true })
  portfolioLink: string;

  @Column({ nullable: true })
  profileImageUrl: string;

  @Column({ nullable: true })
  profileImagePublicId: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  ratingCount: number;

  @OneToMany(() => InfluencerService, (service) => service.influencerProfile)
  services: InfluencerService[];

  @OneToMany(() => SocialPlatform, (sp) => sp.influencerProfile)
  socialPlatforms: SocialPlatform[];

  @OneToMany(() => InfluencerCategory, (ic) => ic.influencerProfile)
  categories: InfluencerCategory[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
