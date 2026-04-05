import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto';
import { NotificationType } from '../enums';

export class GetNotificationsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}
