import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../../common/guards/auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums';
import { AdminContactCardsService } from '../services/admin-contact-cards.service';
import { ContactCard } from '../entities/contact-card.entity';
import { CreateContactCardDto } from '../dto/create-contact-card.dto';
import { UpdateContactCardDto } from '../dto/update-contact-card.dto';

@UseGuards(JwtAuthGuard, RolesStatusGuard)
@Roles(Role.ADMIN, Role.OWNER)
@Controller('admin/contact-us')
export class AdminContactCardsController {
  constructor(private readonly adminContactCardsService: AdminContactCardsService) {}

  @Post()
  create(@Body() dto: CreateContactCardDto): Promise<ContactCard> {
    return this.adminContactCardsService.create(dto);
  }

  @Get()
  findAll(): Promise<ContactCard[]> {
    return this.adminContactCardsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ContactCard> {
    return this.adminContactCardsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateContactCardDto): Promise<ContactCard> {
    return this.adminContactCardsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.adminContactCardsService.remove(id);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string): Promise<ContactCard> {
    return this.adminContactCardsService.activate(id);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string): Promise<ContactCard> {
    return this.adminContactCardsService.deactivate(id);
  }
}
