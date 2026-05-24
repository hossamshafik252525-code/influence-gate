import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ContentTypesService } from './content-types.service';
import {
  CreateContentTypeDto,
  ToggleContentTypeDto,
  UpdateContentTypeDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../common/guards/auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums';

@Controller('content-types')
export class ContentTypesController {
  constructor(private readonly contentTypesService: ContentTypesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesStatusGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  create(@Body() dto: CreateContentTypeDto) {
    return this.contentTypesService.create(dto);
  }

  @Get()
  findAllActive() {
    return this.contentTypesService.findAllActive();
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesStatusGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  findAll() {
    return this.contentTypesService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesStatusGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  findOne(@Param('id') id: string) {
    return this.contentTypesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesStatusGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  update(@Param('id') id: string, @Body() dto: UpdateContentTypeDto) {
    return this.contentTypesService.update(id, dto);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesStatusGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  toggleActive(@Param('id') id: string, @Body() dto: ToggleContentTypeDto) {
    return this.contentTypesService.toggleActive(id, dto.isActive);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesStatusGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  remove(@Param('id') id: string) {
    return this.contentTypesService.remove(id);
  }
}
