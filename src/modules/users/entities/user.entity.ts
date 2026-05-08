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

import { AdvertiserProfile } from '../../advertiser/entities/advertiser-profile.entity';
import { InfluencerProfile } from '../../influencer/entities/influencer-profile.entity';
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

  @Column({ default: false })
  isLoggedIn: boolean;

  @OneToOne(() => AdvertiserProfile, (ap) => ap.user)
  advertiserProfile: AdvertiserProfile;

  @OneToOne(() => InfluencerProfile, (ip) => ip.user)
  influencerProfile: InfluencerProfile;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

