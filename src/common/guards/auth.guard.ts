import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { Role, UserStatus } from '../enums';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { STATUSES_KEY } from '../decorators/statuses.decorator';
import { SocialLinkingService } from '../../modules/social-linking/social-linking.service';
import { InfluencerProfileQueryService } from '../../modules/influencer/profile/services/influencer-profile-query.service';
import { InfluencerProfileMapper } from '../../modules/influencer/profile/mappers/influencer-profile.mapper';

@Injectable()
export class RolesStatusGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly moduleRef: ModuleRef,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    if (requiredStatuses?.length) {
      if (requiredStatuses.includes(UserStatus.ACTIVE)) {
        await this.checkActiveRequirements(user.id, user.status, user.role);
      } else {
        const nonActiveStatuses = requiredStatuses.filter((s) => s !== UserStatus.ACTIVE);
        if (nonActiveStatuses.length && !nonActiveStatuses.includes(user.status)) {
          throw new ForbiddenException('غير مصرح لك بالوصول');
        }
      }
    }

    return true;
  }

  private async checkActiveRequirements(
    userId: string,
    userStatus: UserStatus,
    userRole: Role,
  ): Promise<void> {
    if (userRole !== Role.INFLUENCER) {
      throw new ForbiddenException('غير مصرح لك بالوصول');
    }

    if (userStatus !== UserStatus.CONFIRMED) {
      throw new ForbiddenException('يجب أن يكون حسابك مؤكداً للقيام بهذا الإجراء');
    }

    const socialLinkingService = this.moduleRef.get(SocialLinkingService, { strict: false });
    const hasLinked = await socialLinkingService.hasLinkedPlatforms(userId);

    if (!hasLinked) {
      throw new ForbiddenException('يجب ربط منصة واحدة على الأقل');
    }

    const profileQueryService = this.moduleRef.get(InfluencerProfileQueryService, {
      strict: false,
    });
    const rawProfile = await profileQueryService.getProfile(userId);
    const profile = InfluencerProfileMapper.toProfileData(rawProfile);

    if (!profile.implementationType || !profile.price) {
      throw new ForbiddenException('يجب إكمال الملف الشخصي وإضافة تفاصيل الخدمة أولاً');
    }
  }
}
