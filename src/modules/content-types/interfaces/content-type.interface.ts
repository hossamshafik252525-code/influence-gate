import { ContentType } from '../entities/content-type.entity';
import { CreateContentTypeDto, UpdateContentTypeDto } from '../dto';

export interface IContentTypeService {
  create(dto: CreateContentTypeDto): Promise<ContentType>;
  findAll(): Promise<ContentType[]>;
  findAllActive(): Promise<ContentType[]>;
  findOne(id: string): Promise<ContentType>;
  findByIds(ids: string[]): Promise<ContentType[]>;
  update(id: string, dto: UpdateContentTypeDto): Promise<ContentType>;
  toggleActive(id: string, isActive: boolean): Promise<ContentType>;
  remove(id: string): Promise<{ message: string }>;
}

export interface IContentTypeValidationService {
  allExist(ids: string[]): Promise<boolean>;
  allActiveExist(ids: string[]): Promise<boolean>;
}
