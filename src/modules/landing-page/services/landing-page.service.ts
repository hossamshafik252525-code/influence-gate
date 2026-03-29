import { Injectable } from '@nestjs/common';
import { MailService } from '../../mail/mail.service';
import { ContactAdminDto } from '../dto';

@Injectable()
export class LandingPageService {
  constructor(private readonly mailService: MailService) {}

  async contactAdmin(dto: ContactAdminDto): Promise<void> {
    await this.mailService.sendToAdmin(dto.subject, dto.body);
  }
}
