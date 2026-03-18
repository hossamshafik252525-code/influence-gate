import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserStatus } from '../enums';

@Injectable()
export class ConfirmedUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();

    if (!user || user.status !== UserStatus.CONFIRMED) {
      throw new ForbiddenException('يجب تأكيد حسابك أولاً');
    }

    return true;
  }
}
