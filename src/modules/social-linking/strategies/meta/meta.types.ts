export interface MetaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export interface MetaFacebookProfile {
  id: string;
  name: string;
  picture?: { data?: { url?: string } };
  fan_count?: number;
  followers_count?: number;
}

export interface MetaPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: {
    id: string;
    username?: string;
  };
}

export interface MetaPagesResponse {
  data: MetaPage[];
}

export interface MetaInstagramProfile {
  id: string;
  username: string;
  biography?: string;
  profile_picture_url?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
}

export interface PlatformStatistics {
  followersCount: number;
  followsCount?: number;
  mediaCount?: number;
  fanCount?: number;
  lastFetchedAt: string;
}
