import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Platform } from '../../../common/enums/platform.enum';

@Entity('active_platforms')
export class ActivePlatform {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: Platform, unique: true })
  name: Platform;

  @Column({ default: true })
  isActive: boolean;
}
