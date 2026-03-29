import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { LandingPageService } from '../services/landing-page.service';
import { ContactAdminDto } from '../dto';
import { LandingPageApiKeyGuard } from '../guards/landing-page-api-key.guard';

@Controller('landing-page')
export class LandingPageController {
  constructor(private readonly landingPageService: LandingPageService) {}

  @Post('contact-admin')
  @UseGuards(LandingPageApiKeyGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async contactAdmin(@Body() dto: ContactAdminDto): Promise<void> {
    await this.landingPageService.contactAdmin(dto);
  }
}
