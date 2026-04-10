import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, JoinColumn, Column } from 'typeorm';
import { InfluencerProfile } from './influencer-profile.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity('influencer_categories')
export class InfluencerCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  influencerProfileId: string;

  @ManyToOne(() => InfluencerProfile, (profile) => profile.categories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'influencerProfileId' })
  influencerProfile: InfluencerProfile;

  @Column()
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.influencerCategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @CreateDateColumn()
  createdAt: Date;
}
