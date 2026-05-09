import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ContactType } from '../enums/contact-type.enum';
import { ContactPlatform } from '../enums/contact-platform.enum';

@Entity('contact_cards')
export class ContactCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ContactType })
  type: ContactType;

  @Column()
  value: string;

  @Column({ type: 'enum', enum: ContactPlatform })
  platform: ContactPlatform;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
