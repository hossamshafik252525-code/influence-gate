import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Role, UserStatus } from '../../../common/enums';
import { SocialPlatform } from '../../social-linking/entities/social-platform.entity';
import { UserCategory } from '../../categories/entities/user-category.entity';
import { AdvertiserProfile } from '../../advertiser/entities/advertiser-profile.entity';
import { Country } from '../../countries/entities/country.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, nullable: true })
  phone: string;

  @Column({ nullable: true })
  countryId: string;

  @ManyToOne(() => Country, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'countryId' })
  country: Country;

  @Column({ select: false, nullable: true })
  password: string;

  @Column({ unique: true, nullable: true })
  googleId: string;

  @Column({ type: 'enum', enum: Role, default: Role.INFLUENCER })
  role: Role;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.CONFIRMED })
  status: UserStatus;

  @OneToMany(() => SocialPlatform, (sp) => sp.user, { eager: false })
  socialPlatforms: SocialPlatform[];

  @OneToMany(() => UserCategory, (userCategory) => userCategory.user)
  userCategories: UserCategory[];

  @OneToOne(() => AdvertiserProfile, (ap) => ap.user)
  advertiserProfile: AdvertiserProfile;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

