import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MetaStrategy } from './meta.strategy';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { AuthUser } from '../../../../common/decorators/auth-user.decorator';
import { User } from '../../../users/entities/user.entity';
import { MetaCallbackDto } from '../../dto/meta-callback.dto';

@Controller('social/meta')
@UseGuards(JwtAuthGuard)
export class MetaController {
  constructor(private readonly metaStrategy: MetaStrategy) {}

  @Get('auth-url')
  getAuthUrl() {
    return this.metaStrategy.getAuthUrl();
  }

  @Get('callback')
  handleCallback(@Query() dto: MetaCallbackDto, @AuthUser() user: User) {
    return this.metaStrategy.handleCallback(dto.code, user.id);
  }
}
