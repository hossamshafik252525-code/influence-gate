import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TransactionStatus } from '../enums';

export class ReviewTransactionDto {
  @IsEnum([TransactionStatus.DONE, TransactionStatus.CANCELLED])
  status: TransactionStatus.DONE | TransactionStatus.CANCELLED;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}
