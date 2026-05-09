import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactCard } from '../entities/contact-card.entity';
import { CreateContactCardDto } from '../dto/create-contact-card.dto';
import { UpdateContactCardDto } from '../dto/update-contact-card.dto';

@Injectable()
export class AdminContactCardsService {
  constructor(
    @InjectRepository(ContactCard)
    private readonly contactCardRepository: Repository<ContactCard>,
  ) {}

  async create(dto: CreateContactCardDto): Promise<ContactCard> {
    const card = this.contactCardRepository.create({
      type: dto.type,
      value: dto.value,
      platform: dto.platform,
    });
    return this.contactCardRepository.save(card);
  }

  async findAll(): Promise<ContactCard[]> {
    return this.contactCardRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<ContactCard> {
    const card = await this.contactCardRepository.findOne({ where: { id } });
    if (!card) {
      throw new NotFoundException('بطاقة التواصل غير موجودة');
    }
    return card;
  }

  async update(id: string, dto: UpdateContactCardDto): Promise<ContactCard> {
    const card = await this.findOne(id);
    Object.assign(card, dto);
    return this.contactCardRepository.save(card);
  }

  async remove(id: string): Promise<void> {
    const card = await this.findOne(id);
    await this.contactCardRepository.remove(card);
  }

  async activate(id: string): Promise<ContactCard> {
    const card = await this.findOne(id);
    card.isActive = true;
    return this.contactCardRepository.save(card);
  }

  async deactivate(id: string): Promise<ContactCard> {
    const card = await this.findOne(id);
    card.isActive = false;
    return this.contactCardRepository.save(card);
  }
}
