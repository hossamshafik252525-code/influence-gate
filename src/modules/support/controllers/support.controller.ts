import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AuthUser } from '../../../common/decorators/auth-user.decorator';
import { User } from '../../users/entities/user.entity';
import { SupportService } from '../services/support.service';
import { CreateSupportTicketDto, GetSupportTicketsQueryDto } from '../dto';
import { SupportTicket } from '../entities/support-ticket.entity';
import { PaginatedResult } from '../../../common/interfaces';

@UseGuards(JwtAuthGuard)
@Controller('support/tickets')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  createTicket(
    @AuthUser() user: User,
    @Body() dto: CreateSupportTicketDto,
  ): Promise<SupportTicket> {
    return this.supportService.createTicket(user.id, dto);
  }

  @Get()
  getMyTickets(
    @AuthUser() user: User,
    @Query() query: GetSupportTicketsQueryDto,
  ): Promise<PaginatedResult<SupportTicket>> {
    return this.supportService.getMyTickets(user.id, query);
  }

}
