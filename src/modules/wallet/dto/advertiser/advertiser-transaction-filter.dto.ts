import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { AdvertiserTransactionType, TransactionStatus } from '../../enums';

export class AdvertiserTransactionFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  @IsEnum(AdvertiserTransactionType)
  type?: AdvertiserTransactionType;

  @IsOptional()
  @IsUUID()
  campaignId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
