export interface SnapchatTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface SnapchatMeData {
  externalId: string;
  displayName: string;
  bitmoji?: {
    avatar?: string;
  };
}

export interface SnapchatUserResponse {
  data: {
    me: SnapchatMeData;
  };
}

export interface SnapchatPlatformStatistics {
  displayName: string;
  bitmojiAvatarUrl: string | null;
  lastFetchedAt: string;
}
