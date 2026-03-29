import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, UserStatus } from '../enums';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { STATUSES_KEY } from '../decorators/statuses.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredStatuses = this.reflector.getAllAndOverride<UserStatus[]>(STATUSES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length && !requiredStatuses?.length) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('غير مصرح لك بالوصول');
    }

    if (requiredRoles?.length && !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('غير مصرح لك بالوصول');
    }

    if (requiredStatuses?.length && !requiredStatuses.includes(user.status)) {
      throw new ForbiddenException('غير مصرح لك بالوصول');
    }

    return true;
  }
}
