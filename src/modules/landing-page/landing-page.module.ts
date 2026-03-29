import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { LandingPageService } from './services/landing-page.service';
import { LandingPageController } from './controllers/landing-page.controller';
import { LandingPageApiKeyGuard } from './guards/landing-page-api-key.guard';

@Module({
  imports: [MailModule],
  providers: [LandingPageService, LandingPageApiKeyGuard],
  controllers: [LandingPageController],
})
export class LandingPageModule {}
