import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ContentTypeOffer } from '../../../common/enums/content-type-offer.enum';

@Entity('active_content_types')
export class ActiveContentType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ContentTypeOffer, unique: true })
  name: ContentTypeOffer;

  @Column({ default: true })
  isActive: boolean;
}
