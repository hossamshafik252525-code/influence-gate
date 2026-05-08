import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportTicket } from './entities/support-ticket.entity';
import { SupportService } from './services/support.service';
import { SupportController } from './controllers/support.controller';
import { AdminSupportController } from './controllers/admin-support.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SupportTicket])],
  controllers: [SupportController, AdminSupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
