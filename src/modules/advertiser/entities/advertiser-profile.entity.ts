import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
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

  @ManyToMany(() => Category)
  @JoinTable({
    name: 'advertiser_profile_categories',
    joinColumn: { name: 'advertiserProfileId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'categoryId', referencedColumnName: 'id' },
  })
  categories: Category[];

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
