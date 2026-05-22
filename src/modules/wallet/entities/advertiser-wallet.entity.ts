import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('advertiser_wallets')
export class AdvertiserWallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  advertiserId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'advertiserId' })
  advertiser: User;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  availableBalance: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  reservedBalance: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalPaid: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
