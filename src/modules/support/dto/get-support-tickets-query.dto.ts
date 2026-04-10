import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { SupportTicketStatus } from '../enums/support-ticket-status.enum';

export class GetSupportTicketsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(SupportTicketStatus)
  status?: SupportTicketStatus;
}
