import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { SupportTicketStatus } from '../enums/support-ticket-status.enum';

export class RespondSupportTicketDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  adminResponse?: string;

  @IsEnum(SupportTicketStatus)
  status: SupportTicketStatus;
}
