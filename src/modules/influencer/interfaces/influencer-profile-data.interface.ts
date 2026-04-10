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
  joiningDate: Date;
  createdAt: Date;
  updatedAt: Date;
}
