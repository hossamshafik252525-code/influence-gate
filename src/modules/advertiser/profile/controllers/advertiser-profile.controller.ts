import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdvertiserProfileService } from '../services/advertiser-profile.service';
import { ConfirmAdvertiserProfileDto } from '../dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../../../common/guards/auth.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { AuthUser } from '../../../../common/decorators/auth-user.decorator';
import { Role } from '../../../../common/enums';
import { User } from '../../../users/entities/user.entity';

@Controller('advertiser/profile')
@UseGuards(JwtAuthGuard, RolesStatusGuard)
export class AdvertiserProfileController {
  constructor(private readonly advertiserProfileService: AdvertiserProfileService) {}

  @Post('confirm')
  @Roles(Role.ADVERTISER)
  @UseInterceptors(FileInterceptor('image'))
  confirmProfile(
    @AuthUser() user: User,
    @Body() dto: ConfirmAdvertiserProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.advertiserProfileService.confirmProfile(user.id, dto, file);
  }
}
