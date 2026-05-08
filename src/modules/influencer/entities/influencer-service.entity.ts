import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ImplementationType, ContentTypeOffer, TargetPlatform } from '../../../common/enums';
import { InfluencerProfile } from './influencer-profile.entity';

@Entity('influencer_services')
export class InfluencerService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  influencerProfileId: string;

  @ManyToOne(() => InfluencerProfile, (profile) => profile.services, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'influencerProfileId' })
  influencerProfile: InfluencerProfile;

  @Column({ type: 'enum', enum: ImplementationType })
  implementationType: ImplementationType;

  @Column({ type: 'enum', enum: ContentTypeOffer })
  contentType: ContentTypeOffer;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int' })
  implementationPeriodDays: number;

  @Column({ type: 'jsonb' })
  includedPlatforms: TargetPlatform[];

  @Column({ type: 'text', nullable: true })
  previousWorkLink: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
