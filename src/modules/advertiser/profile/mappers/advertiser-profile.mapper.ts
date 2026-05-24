import { AdvertiserProfile } from '../../entities/advertiser-profile.entity';
import { AdvertiserProfileData } from '../../interfaces';

export class AdvertiserProfileMapper {
  static toProfileData(profile: AdvertiserProfile): AdvertiserProfileData {
    return {
      profileId: profile.id,
      username: profile.username,
      fullName: profile.user.fullName,
      email: profile.user.email,
      phone: profile.user.phone ?? null,
      companyName: profile.companyName ?? null,
      companyWebsite: profile.companyWebsite ?? null,
      logoUrl: profile.logoUrl ?? null,
      expectedBudget: profile.expectedBudget ?? null,
      contentTypes: (profile.contentTypes ?? []).map((c) => ({
        id: c.id,
        name: c.name,
      })),
      platforms: (profile.platforms ?? []).map((p) => ({
        id: p.id,
        name: p.name,
      })),
      categories: (profile.categories ?? []).map((c) => ({ id: c.id, name: c.name })),
      country: profile.user.country
        ? { id: profile.user.country.id, name: profile.user.country.name }
        : null,
    };
  }
}
