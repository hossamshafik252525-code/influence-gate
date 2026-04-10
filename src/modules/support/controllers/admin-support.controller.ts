import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../../common/guards/auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums';
import { SupportService } from '../services/support.service';
import { GetSupportTicketsQueryDto, RespondSupportTicketDto } from '../dto';
import { SupportTicket } from '../entities/support-ticket.entity';
import { PaginatedResult } from '../../../common/interfaces';

@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.ADMIN, Role.OWNER)
@Controller('admin/support/tickets')
export class AdminSupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get()
  getAllTickets(
    @Query() query: GetSupportTicketsQueryDto,
  ): Promise<PaginatedResult<SupportTicket>> {
    return this.supportService.getAllTickets(query);
  }

  @Get(':id')
  getTicketById(@Param('id', ParseUUIDPipe) id: string): Promise<SupportTicket> {
    return this.supportService.getTicketById(id);
  }

  @Patch(':id/respond')
  respondToTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondSupportTicketDto,
  ): Promise<SupportTicket> {
    return this.supportService.respondToTicket(id, dto);
  }
}
