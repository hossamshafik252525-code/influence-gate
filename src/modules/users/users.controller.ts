import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { UserPasswordService } from './services/user-password.service';
import { ChangePasswordDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import { User } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly userPasswordService: UserPasswordService) {}

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @AuthUser() user: User,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    return this.userPasswordService.changePassword(user.id, dto);
  }
}
