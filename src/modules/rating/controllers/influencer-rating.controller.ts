import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../../common/guards/auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Statuses } from '../../../common/decorators/statuses.decorator';
import { AuthUser } from '../../../common/decorators/auth-user.decorator';
import { Role, UserStatus } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
import { RatingService } from '../services/rating.service';
import { PaginationQueryDto } from '../../../common/dto';

@Controller('ratings/influencer')
@UseGuards(JwtAuthGuard, RolesStatusGuard)
export class InfluencerRatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Get('my')
  @Roles(Role.INFLUENCER)
  @Statuses(UserStatus.CONFIRMED)
  getMyRatings(
    @AuthUser() user: User,
    @Query() query: PaginationQueryDto,
  ) {
    return this.ratingService.getRatingsForInfluencer(user.id, query);
  }
}
