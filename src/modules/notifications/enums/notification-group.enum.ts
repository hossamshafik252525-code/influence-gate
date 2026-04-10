import { NotificationType } from './notification-type.enum';

export enum NotificationGroup {
  CAMPAIGNS = 'CAMPAIGNS',
  MESSAGES = 'MESSAGES',
  PAYMENTS = 'PAYMENTS',
  SYSTEM = 'SYSTEM',
}

export function getNotificationGroup(type: NotificationType): NotificationGroup {
  switch (type) {
    case NotificationType.CAMPAIGN_SUBMITTED_FOR_REVIEW:
    case NotificationType.CAMPAIGN_APPROVED:
    case NotificationType.CAMPAIGN_REJECTED:
    case NotificationType.CAMPAIGN_INVITATION:
    case NotificationType.CAMPAIGN_PENDING_MINIMUM:
    case NotificationType.CAMPAIGN_AUTO_DISCARDED:
    case NotificationType.NEW_CAMPAIGN_APPLICATION:
    case NotificationType.APPLICATION_ACCEPTED:
    case NotificationType.APPLICATION_REJECTED:
    case NotificationType.CAMPAIGN_STARTED:
    case NotificationType.NEW_CONTENT_SUBMISSION:
    case NotificationType.SUBMISSION_ACCEPTED:
    case NotificationType.SUBMISSION_MODIFICATION_REQUESTED:
      return NotificationGroup.CAMPAIGNS;

    case NotificationType.NEW_INFLUENCER_REVIEW:
    case NotificationType.ACCOUNT_APPROVED:
    case NotificationType.ACCOUNT_REJECTED:
      return NotificationGroup.SYSTEM;

    default:
      // Fallback for new unmapped types
      return NotificationGroup.SYSTEM;
  }
}
