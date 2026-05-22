import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class GetChatsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
}
