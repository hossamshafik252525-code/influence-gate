export interface InfluencerProfileNamedItem {
  id: string;
  name: string;
}

export interface InfluencerProfileData {
  id: string;
  userId: string;
  fullName: string;
  userName: string | null;
  email: string;
  phone: string | null;
  countryId: string | null;
  countryName: string | null;
  profileImageUrl: string | null;
  portfolioLink: string | null;
  categories: { id: string; name: string }[];
  implementationTypes: InfluencerProfileNamedItem[];
  contentTypes: InfluencerProfileNamedItem[];
  description?: string | null;
  price?: number | null;
  implementationPeriodDays?: number | null;
  platforms: InfluencerProfileNamedItem[];
  previousWorkLink?: string | null;
  joiningDate: Date;
  createdAt: Date;
  updatedAt: Date;
}
