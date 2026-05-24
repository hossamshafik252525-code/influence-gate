import { Platform } from '../entities/platform.entity';
import { CreatePlatformDto, UpdatePlatformDto } from '../dto';

export interface IPlatformService {
  create(dto: CreatePlatformDto): Promise<Platform>;
  findAll(): Promise<Platform[]>;
  findAllActive(): Promise<Platform[]>;
  findOne(id: string): Promise<Platform>;
  findByIds(ids: string[]): Promise<Platform[]>;
  findByName(name: string): Promise<Platform | null>;
  update(id: string, dto: UpdatePlatformDto): Promise<Platform>;
  toggleActive(id: string, isActive: boolean): Promise<Platform>;
  remove(id: string): Promise<{ message: string }>;
}

export interface IPlatformValidationService {
  allExist(ids: string[]): Promise<boolean>;
  allActiveExist(ids: string[]): Promise<boolean>;
}
