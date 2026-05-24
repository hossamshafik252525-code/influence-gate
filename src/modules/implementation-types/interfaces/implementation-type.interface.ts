import { ImplementationType } from '../entities/implementation-type.entity';
import {
  CreateImplementationTypeDto,
  UpdateImplementationTypeDto,
} from '../dto';

export interface IImplementationTypeService {
  create(dto: CreateImplementationTypeDto): Promise<ImplementationType>;
  findAll(): Promise<ImplementationType[]>;
  findAllActive(): Promise<ImplementationType[]>;
  findOne(id: string): Promise<ImplementationType>;
  findByIds(ids: string[]): Promise<ImplementationType[]>;
  update(
    id: string,
    dto: UpdateImplementationTypeDto,
  ): Promise<ImplementationType>;
  toggleActive(id: string, isActive: boolean): Promise<ImplementationType>;
  remove(id: string): Promise<{ message: string }>;
}

export interface IImplementationTypeValidationService {
  allExist(ids: string[]): Promise<boolean>;
  allActiveExist(ids: string[]): Promise<boolean>;
}
