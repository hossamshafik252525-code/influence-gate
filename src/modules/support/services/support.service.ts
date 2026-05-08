import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket } from '../entities/support-ticket.entity';
import { SupportTicketStatus } from '../enums/support-ticket-status.enum';
import { PaginatedResult } from '../../../common/interfaces';
import {
  CreateSupportTicketDto,
  GetSupportTicketsQueryDto,
  RespondSupportTicketDto,
} from '../dto';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private readonly supportTicketRepo: Repository<SupportTicket>,
  ) {}

  async createTicket(
    userId: string,
    dto: CreateSupportTicketDto,
  ): Promise<SupportTicket> {
    const ticket = this.supportTicketRepo.create({
      userId,
      title: dto.title,
      description: dto.description,
      attachmentUrl: dto.attachmentUrl,
      attachmentPublicId: dto.attachmentPublicId,
      status: SupportTicketStatus.OPEN,
    });

    return this.supportTicketRepo.save(ticket);
  }

  async getMyTickets(
    userId: string,
    query: GetSupportTicketsQueryDto,
  ): Promise<PaginatedResult<SupportTicket>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [data, total] = await this.supportTicketRepo.findAndCount({
      where: {
        userId,
        ...(query.status && { status: query.status }),
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, pagination: { total, page, limit } };
  }

  async getAllTickets(
    query: GetSupportTicketsQueryDto,
  ): Promise<PaginatedResult<SupportTicket>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [data, total] = await this.supportTicketRepo.findAndCount({
      where: query.status ? { status: query.status } : {},
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, pagination: { total, page, limit } };
  }

  async getTicketById(ticketId: string): Promise<SupportTicket> {
    const ticket = await this.supportTicketRepo.findOne({
      where: { id: ticketId },
      relations: ['user'],
    });
    if (!ticket) {
      throw new NotFoundException('التذكرة غير موجودة');
    }
    return ticket;
  }

  async respondToTicket(
    ticketId: string,
    dto: RespondSupportTicketDto,
  ): Promise<SupportTicket> {
    const ticket = await this.getTicketById(ticketId);

    ticket.status = dto.status;
    if (dto.adminResponse !== undefined) {
      ticket.adminResponse = dto.adminResponse;
    }

    return this.supportTicketRepo.save(ticket);
  }

}
