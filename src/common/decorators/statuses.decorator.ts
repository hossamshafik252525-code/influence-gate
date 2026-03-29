import { SetMetadata } from '@nestjs/common';
import { UserStatus } from '../enums';

export const STATUSES_KEY = 'statuses';
export const Statuses = (...statuses: UserStatus[]) => SetMetadata(STATUSES_KEY, statuses);
