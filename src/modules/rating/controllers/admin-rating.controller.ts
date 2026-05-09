import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesStatusGuard } from '../../../common/guards/auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums';
import { RatingService } from '../services/rating.service';
import { CreateRatingDto } from '../dto/create-rating.dto';

@Controller('ratings/admin')
@UseGuards(JwtAuthGuard, RolesStatusGuard)
export class AdminRatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post()
  @Roles(Role.ADMIN)
  createRating(@Body() dto: CreateRatingDto) {
    return this.ratingService.createRating(dto);
  }
}
