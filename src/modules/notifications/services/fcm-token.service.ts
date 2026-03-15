import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FcmToken } from '../entities/fcm-token.entity';
import { DeviceType } from '../enums';
import { Role } from '../../../common/enums';

@Injectable()
export class FcmTokenService {
  constructor(
    @InjectRepository(FcmToken)
    private readonly fcmTokenRepository: Repository<FcmToken>,
  ) {}

  async register(userId: string, token: string, deviceType: DeviceType): Promise<void> {
    const existing = await this.fcmTokenRepository.findOne({ where: { token } });

    if (existing) {
      await this.fcmTokenRepository.update(existing.id, { userId, deviceType });
      return;
    }

    const fcmToken = this.fcmTokenRepository.create({ userId, token, deviceType });
    await this.fcmTokenRepository.save(fcmToken);
  }

  async removeToken(token: string): Promise<void> {
    await this.fcmTokenRepository.delete({ token });
  }

  async findTokensByRole(role: Role): Promise<string[]> {
    const rows = await this.fcmTokenRepository
      .createQueryBuilder('fcmToken')
      .innerJoin('fcmToken.user', 'user')
      .where('user.role = :role', { role })
      .select('fcmToken.token')
      .getMany();

    return rows.map((r) => r.token);
  }

  async findTokensByUserId(userId: string): Promise<string[]> {
    const rows = await this.fcmTokenRepository.find({ where: { userId } });
    return rows.map((r) => r.token);
  }
}
