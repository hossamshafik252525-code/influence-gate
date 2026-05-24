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
import { ImplementationTypesService } from './implementation-types.service';
import {
  CreateImplementationTypeDto,
  ToggleImplementationTypeDto,
  UpdateImplementationTypeDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../common/guards/auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums';

@Controller('implementation-types')
export class ImplementationTypesController {
  constructor(
    private readonly implementationTypesService: ImplementationTypesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesStatusGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  create(@Body() dto: CreateImplementationTypeDto) {
    return this.implementationTypesService.create(dto);
  }

  @Get()
  findAllActive() {
    return this.implementationTypesService.findAllActive();
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesStatusGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  findAll() {
    return this.implementationTypesService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesStatusGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  findOne(@Param('id') id: string) {
    return this.implementationTypesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesStatusGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateImplementationTypeDto,
  ) {
    return this.implementationTypesService.update(id, dto);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesStatusGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  toggleActive(
    @Param('id') id: string,
    @Body() dto: ToggleImplementationTypeDto,
  ) {
    return this.implementationTypesService.toggleActive(id, dto.isActive);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesStatusGuard)
  @Roles(Role.ADMIN, Role.OWNER)
  remove(@Param('id') id: string) {
    return this.implementationTypesService.remove(id);
  }
}
