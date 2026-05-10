import { PaginatedResult } from '../../../../common/interfaces';
import { SubmissionStatus } from '../enums/submission-status.enum';

export interface SubmissionInfluencerSummary {
  fullName: string;
  profileImageUrl: string | null;
}

export interface SubmissionListItem {
  id: string;
  influencerId: string;
  status: SubmissionStatus;
  links: string[];
  fileUrls: string[] | null;
  modificationDetails: string | null;
  modificationFileUrls: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  influencer: SubmissionInfluencerSummary;
}

export type SubmissionsResult = PaginatedResult<SubmissionListItem>;
