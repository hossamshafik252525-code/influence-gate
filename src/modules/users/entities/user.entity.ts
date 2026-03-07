import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Role, UserStatus } from '../../../common/enums';
import { SocialPlatform } from '../../social-linking/entities/social-platform.entity';
import { UserCategory } from '../../categories/entities/user-category.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  country: string;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

