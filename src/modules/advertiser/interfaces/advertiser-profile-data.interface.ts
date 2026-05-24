import { ExpectedBudget } from '../../../common/enums';

export interface AdvertiserProfileContentTypeItem {
  id: string;
  name: string;
}

export interface AdvertiserProfilePlatformItem {
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
  platforms: AdvertiserProfilePlatformItem[];
  categories: { id: string; name: string }[];
  country: { id: string; name: string } | null;
}
