import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Role } from '../../../common/enums';
import { UserStatus } from '../../../common/enums';
import { SocialPlatform } from './social-platform.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phone: string;

  @Column()
  country: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.INFLUENCER })
  role: Role;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.CONFIRMED })
  status: UserStatus;

  @Column({ nullable: true })
  category: string;

  @OneToMany(() => SocialPlatform, (sp) => sp.user, { eager: false })
  socialPlatforms: SocialPlatform[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

