import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactCard } from './entities/contact-card.entity';
import { AdminContactCardsService } from './services/admin-contact-cards.service';
import { ContactCardsService } from './services/contact-cards.service';
import { AdminContactCardsController } from './controllers/admin-contact-cards.controller';
import { ContactCardsController } from './controllers/contact-cards.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ContactCard])],
  controllers: [AdminContactCardsController, ContactCardsController],
  providers: [AdminContactCardsService, ContactCardsService],
})
export class ContactUsModule {}
