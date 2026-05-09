import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactCard } from '../entities/contact-card.entity';

@Injectable()
export class ContactCardsService {
  constructor(
    @InjectRepository(ContactCard)
    private readonly contactCardRepository: Repository<ContactCard>,
  ) {}

  async findAllActive(): Promise<ContactCard[]> {
    return this.contactCardRepository.find({
      where: { isActive: true },
      order: { createdAt: 'ASC' },
      select: ['id', 'type', 'value', 'platform'],
    });
  }
}
