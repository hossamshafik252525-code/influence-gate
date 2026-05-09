import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../../common/guards/auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums';
import { ContactCardsService } from '../services/contact-cards.service';
import { ContactCard } from '../entities/contact-card.entity';

@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.INFLUENCER, Role.ADVERTISER)
@Controller('contact-us')
export class ContactCardsController {
  constructor(private readonly contactCardsService: ContactCardsService) {}

  @Get()
  findAll(): Promise<ContactCard[]> {
    return this.contactCardsService.findAllActive();
  }
}
