import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto';
import { NotificationFilter } from '../enums';

export class GetNotificationsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(NotificationFilter)
  type?: NotificationFilter;
}
