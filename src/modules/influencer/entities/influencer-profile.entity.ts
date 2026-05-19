import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
  JoinTable,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { SocialPlatform } from '../../social-linking/entities/social-platform.entity';
import { ImplementationType, ContentTypeOffer, TargetPlatform } from '../../../common/enums';

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

  @Column({ type: 'int', default: 0 })
  completedCampaignsCount: number;

  @Index('idx_influencer_profile_total_followers')
  @Column({ type: 'bigint', default: 0 })
  totalFollowers: number;

  @Column({ type: 'enum', enum: ImplementationType, nullable: true })
  implementationType: ImplementationType;

  @Column({ type: 'enum', enum: ContentTypeOffer, nullable: true })
  contentType: ContentTypeOffer;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ type: 'int', nullable: true })
  implementationPeriodDays: number;

  @Column({ type: 'jsonb', nullable: true })
  includedPlatforms: TargetPlatform[];

  @Column({ type: 'text', nullable: true })
  previousWorkLink: string;

  @OneToMany(() => SocialPlatform, (sp) => sp.influencerProfile)
  socialPlatforms: SocialPlatform[];

  @ManyToMany(() => Category)
  @JoinTable({
    name: 'influencer_categories',
    joinColumn: { name: 'influencerProfileId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'categoryId', referencedColumnName: 'id' },
  })
  categories: Category[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
