import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ContentType, TargetPlatform, ExpectedBudget } from '../../../common/enums';

@Entity('advertiser_profiles')
export class AdvertiserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.advertiserProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ unique: true })
  username: string;

  @Column({ nullable: true })
  companyName: string;

  @Column({ type: 'jsonb', nullable: true })
  categoryIds: string[];

  @Column({ nullable: true })
  companyWebsite: string;

  @Column({ type: 'jsonb', nullable: true })
  contentTypes: ContentType[];

  @Column({ type: 'jsonb', nullable: true })
  targetPlatforms: TargetPlatform[];

  @Column({ type: 'enum', enum: ExpectedBudget, nullable: true })
  expectedBudget: ExpectedBudget;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  logoPublicId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
