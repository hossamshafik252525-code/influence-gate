import { NotificationType } from '../enums';
import { Role } from '../../../common/enums';

export interface NotificationPayload {
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, string>;
}

export interface RoleNotificationPayload extends NotificationPayload {
  role: Role;
}
