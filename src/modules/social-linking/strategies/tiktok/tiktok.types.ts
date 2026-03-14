export interface TikTokTokenResponse {
  open_id: string;
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
  scope: string;
  token_type: string;
}

export interface TikTokUserData {
  open_id: string;
  union_id?: string;
  avatar_url?: string;
  avatar_url_100?: string;
  avatar_large_url?: string;
  display_name: string;
  bio_description?: string;
  profile_deep_link?: string;
  is_verified?: boolean;
  username?: string;
  follower_count?: number;
  following_count?: number;
  likes_count?: number;
  video_count?: number;
}

export interface TikTokUserInfoResponse {
  data: {
    user: TikTokUserData;
  };
  error: {
    code: string;
    message: string;
    log_id: string;
  };
}

export interface TikTokPlatformStatistics {
  followerCount: number;
  followingCount: number;
  likesCount: number;
  videoCount: number;
  isVerified: boolean;
  lastFetchedAt: string;
}
