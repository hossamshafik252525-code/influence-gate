import { ExpectedBudget, TargetPlatform } from '../../../common/enums';

export interface AdvertiserProfileContentTypeItem {
  id: string;
  name: string;
}

export interface AdvertiserProfileData {
  profileId: string;
  username: string;
  fullName: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  companyWebsite: string | null;
  logoUrl: string | null;
  expectedBudget: ExpectedBudget | null;
  contentTypes: AdvertiserProfileContentTypeItem[];
  targetPlatforms: TargetPlatform[] | null;
  categories: { id: string; name: string }[];
  country: { id: string; name: string } | null;
}
