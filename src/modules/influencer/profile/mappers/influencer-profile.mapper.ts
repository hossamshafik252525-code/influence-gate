import { InfluencerProfile } from '../../entities/influencer-profile.entity';
import { InfluencerProfileData, InfluencerNumbers } from '../../interfaces';
import { InfluencerProfileRaw } from '../services/influencer-profile-query.service';

export class InfluencerProfileMapper {
  static toProfileData(profile: InfluencerProfile): InfluencerProfileData {
    return {
      id: profile.id,
      userId: profile.userId,
      fullName: profile.user.fullName,
      userName: profile.userName ?? null,
      email: profile.user.email,
      phone: profile.user.phone ?? null,
      countryId: profile.user.countryId ?? null,
      countryName: profile.user.country?.name ?? null,
      profileImageUrl: profile.profileImageUrl ?? null,
      portfolioLink: profile.portfolioLink ?? null,
      categories:
        profile.categories
          ?.map((ic) => ic.category)
          ?.filter(Boolean)
          ?.map((c) => ({ id: c.id, name: c.name })) ?? [],
      implementationType: profile.implementationType ?? null,
      contentType: profile.contentType ?? null,
      description: profile.description ?? null,
      price: profile.price ? Number(profile.price) : null,
      implementationPeriodDays: profile.implementationPeriodDays ?? null,
      includedPlatforms: profile.includedPlatforms ?? null,
      previousWorkLink: profile.previousWorkLink ?? null,
      joiningDate: profile.user.createdAt,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  static toNumbers(raw: InfluencerProfileRaw): InfluencerNumbers {
    return {
      totalFollowers: raw.totalFollowers,
      completedCampaignsCount: raw.profile.completedCampaignsCount,
      rating: Number(raw.profile.rating),
      ratingCount: raw.profile.ratingCount,
    };
  }
}
