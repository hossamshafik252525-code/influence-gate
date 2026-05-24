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
import { PlatformsService } from './platforms.service';
import {
  CreatePlatformDto,
  TogglePlatformDto,
  UpdatePlatformDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../common/guards/auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums';

@Controller('platforms')
export class PlatformsController {
  constructor(private readonly platformsService: PlatformsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesStatusGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  create(@Body() dto: CreatePlatformDto) {
    return this.platformsService.create(dto);
  }

  @Get()
  findAllActive() {
    return this.platformsService.findAllActive();
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesStatusGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  findAll() {
    return this.platformsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesStatusGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  findOne(@Param('id') id: string) {
    return this.platformsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesStatusGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  update(@Param('id') id: string, @Body() dto: UpdatePlatformDto) {
    return this.platformsService.update(id, dto);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesStatusGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  toggleActive(@Param('id') id: string, @Body() dto: TogglePlatformDto) {
    return this.platformsService.toggleActive(id, dto.isActive);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesStatusGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  remove(@Param('id') id: string) {
    return this.platformsService.remove(id);
  }
}
