import { NotificationType } from './notification-type.enum';

export enum NotificationFilter {
  ALL = 'all',
  CAMPAIGNS = 'campaigns',
  INFLUENCERS = 'influencers',
  PAYMENTS = 'payments',
  SYSTEM = 'system',
  CHAT = 'chat',
}

const CAMPAIGN_TYPES: NotificationType[] = [
  NotificationType.CAMPAIGN_SUBMITTED_FOR_REVIEW,
  NotificationType.CAMPAIGN_APPROVED,
  NotificationType.CAMPAIGN_REJECTED,
  NotificationType.CAMPAIGN_INVITATION,
  NotificationType.CAMPAIGN_PENDING_MINIMUM,
  NotificationType.CAMPAIGN_AUTO_DISCARDED,
  NotificationType.NEW_CAMPAIGN_APPLICATION,
  NotificationType.NEW_APPLICATION_OFFER,
  NotificationType.APPLICATION_OFFER_REJECTED,
  NotificationType.APPLICATION_ACCEPTED,
  NotificationType.APPLICATION_REJECTED,
  NotificationType.CAMPAIGN_STARTED,
  NotificationType.NEW_CONTENT_SUBMISSION,
  NotificationType.SUBMISSION_ACCEPTED,
  NotificationType.SUBMISSION_MODIFICATION_REQUESTED,
];

const INFLUENCER_TYPES: NotificationType[] = [
  NotificationType.NEW_INFLUENCER_REVIEW,
  NotificationType.ACCOUNT_APPROVED,
  NotificationType.ACCOUNT_REJECTED,
];

const PAYMENT_TYPES: NotificationType[] = [];

const SYSTEM_TYPES: NotificationType[] = [];

const CHAT_TYPES: NotificationType[] = [NotificationType.NEW_CHAT_MESSAGE];

export const NOTIFICATION_FILTER_MAP: Record<NotificationFilter, NotificationType[]> = {
  [NotificationFilter.ALL]: [],
  [NotificationFilter.CAMPAIGNS]: CAMPAIGN_TYPES,
  [NotificationFilter.INFLUENCERS]: INFLUENCER_TYPES,
  [NotificationFilter.PAYMENTS]: PAYMENT_TYPES,
  [NotificationFilter.SYSTEM]: SYSTEM_TYPES,
  [NotificationFilter.CHAT]: CHAT_TYPES,
};

export function getTypesForFilter(filter: NotificationFilter): NotificationType[] {
  return NOTIFICATION_FILTER_MAP[filter];
}
