import { BadRequestException } from '@nestjs/common';
import { Campaign } from '../entities/campaign.entity';

const PENDING_MINIMUM_GRACE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function isBeforeStart(campaign: Campaign, now: Date): boolean {
  return startOfDay(now).getTime() < startOfDay(new Date(campaign.startDate)).getTime();
}

export function isInApplicationWindow(campaign: Campaign, now: Date): boolean {
  const today = startOfDay(now).getTime();
  return (
    today >= startOfDay(new Date(campaign.startDate)).getTime() &&
    today < startOfDay(new Date(campaign.applicationDeadlineDate)).getTime()
  );
}

export function isAfterApplicationDeadline(campaign: Campaign, now: Date): boolean {
  return (
    startOfDay(now).getTime() >=
    startOfDay(new Date(campaign.applicationDeadlineDate)).getTime()
  );
}

export function computePendingMinimumDeadline(now: Date): Date {
  return new Date(now.getTime() + PENDING_MINIMUM_GRACE_DAYS * DAY_MS);
}

export function validateInitialDateOrdering(
  startDate: Date,
  applicationDeadlineDate: Date,
  endDate: Date,
): void {
  const today = startOfDay(new Date()).getTime();
  const start = startOfDay(startDate).getTime();
  const appDeadline = startOfDay(applicationDeadlineDate).getTime();
  const end = startOfDay(endDate).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || Number.isNaN(appDeadline)) {
    throw new BadRequestException('تاريخ غير صالح');
  }
  if (start <= today) {
    throw new BadRequestException('تاريخ بداية الحملة يجب أن يكون في المستقبل');
  }
  if (end <= start) {
    throw new BadRequestException('تاريخ نهاية الحملة يجب أن يكون بعد تاريخ البداية');
  }
  if (appDeadline <= start) {
    throw new BadRequestException(
      'تاريخ نهاية فترة التقديم يجب أن يكون بعد تاريخ البداية',
    );
  }
  if (appDeadline >= end) {
    throw new BadRequestException(
      'تاريخ نهاية فترة التقديم يجب أن يكون قبل تاريخ نهاية الحملة',
    );
  }
}

export function validateUpdatedDateOrdering(
  startDate: Date,
  applicationDeadlineDate: Date,
  endDate: Date,
): void {
  const start = startOfDay(startDate).getTime();
  const appDeadline = startOfDay(applicationDeadlineDate).getTime();
  const end = startOfDay(endDate).getTime();
  const today = startOfDay(new Date()).getTime();

  if (Number.isNaN(end) || Number.isNaN(appDeadline)) {
    throw new BadRequestException('تاريخ غير صالح');
  }
  if (end <= start) {
    throw new BadRequestException('تاريخ نهاية الحملة يجب أن يكون بعد تاريخ البداية');
  }
  if (appDeadline <= start) {
    throw new BadRequestException(
      'تاريخ نهاية فترة التقديم يجب أن يكون بعد تاريخ البداية',
    );
  }
  if (appDeadline >= end) {
    throw new BadRequestException(
      'تاريخ نهاية فترة التقديم يجب أن يكون قبل تاريخ نهاية الحملة',
    );
  }
  if (appDeadline <= today) {
    throw new BadRequestException(
      'تاريخ نهاية فترة التقديم يجب أن يكون في المستقبل',
    );
  }
}
