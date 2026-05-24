import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';

interface CampaignRow {
  id: string;
  includedPlatforms: string[] | null;
}

interface InfluencerProfileRow {
  id: string;
  includedPlatforms: string[] | null;
}

interface AdvertiserProfileRow {
  id: string;
  targetPlatforms: string[] | null;
}

interface CampaignReportRow {
  id: string;
  includedPlatforms: string[] | null;
}

interface SocialPlatformRow {
  id: string;
  platform: string;
}

interface NamedRow {
  id: string;
  name: string;
  isActive: boolean;
}

function resolvePlatformIds(
  values: string[] | null,
  byName: Map<string, string>,
): string[] {
  if (!values || values.length === 0) return [];
  const resolved = new Set<string>();
  for (const value of values) {
    const id = byName.get(value);
    if (id) resolved.add(id);
  }
  return Array.from(resolved);
}

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const dataSource = app.get(DataSource);

  await dataSource.transaction(async (manager) => {
    const platforms: NamedRow[] = await manager.query(
      'SELECT id, name, "isActive" FROM platforms',
    );

    const platformByName = new Map<string, string>();
    for (const row of platforms) {
      platformByName.set(row.name, row.id);
    }

    if (platformByName.size === 0) {
      throw new Error(
        'platforms table is empty. Run app once to trigger the seeder before running this migration.',
      );
    }

    let campaignInserts = 0;
    const campaigns: CampaignRow[] = await manager.query(
      'SELECT id, "includedPlatforms" FROM campaigns',
    );
    for (const campaign of campaigns) {
      const platformIds = resolvePlatformIds(
        campaign.includedPlatforms,
        platformByName,
      );
      for (const pid of platformIds) {
        await manager.query(
          'INSERT INTO campaign_platforms ("campaignId", "platformId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [campaign.id, pid],
        );
        campaignInserts += 1;
      }
    }

    let influencerInserts = 0;
    const influencerProfiles: InfluencerProfileRow[] = await manager.query(
      'SELECT id, "includedPlatforms" FROM influencer_profiles',
    );
    for (const profile of influencerProfiles) {
      const platformIds = resolvePlatformIds(
        profile.includedPlatforms,
        platformByName,
      );
      for (const pid of platformIds) {
        await manager.query(
          'INSERT INTO influencer_profile_platforms ("influencerProfileId", "platformId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [profile.id, pid],
        );
        influencerInserts += 1;
      }
    }

    let advertiserInserts = 0;
    const advertiserProfiles: AdvertiserProfileRow[] = await manager.query(
      'SELECT id, "targetPlatforms" FROM advertiser_profiles',
    );
    for (const profile of advertiserProfiles) {
      const platformIds = resolvePlatformIds(
        profile.targetPlatforms,
        platformByName,
      );
      for (const pid of platformIds) {
        await manager.query(
          'INSERT INTO advertiser_profile_platforms ("advertiserProfileId", "platformId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [profile.id, pid],
        );
        advertiserInserts += 1;
      }
    }

    let reportInserts = 0;
    const reports: CampaignReportRow[] = await manager.query(
      'SELECT id, "includedPlatforms" FROM campaign_reports',
    );
    for (const report of reports) {
      const platformIds = resolvePlatformIds(
        report.includedPlatforms,
        platformByName,
      );
      for (const pid of platformIds) {
        await manager.query(
          'INSERT INTO campaign_report_platforms ("reportId", "platformId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [report.id, pid],
        );
        reportInserts += 1;
      }
    }

    let socialPlatformUpdates = 0;
    const socialPlatforms: SocialPlatformRow[] = await manager.query(
      'SELECT id, platform FROM social_platforms WHERE "platformId" IS NULL',
    );
    for (const sp of socialPlatforms) {
      const pid = platformByName.get(sp.platform);
      if (!pid) continue;
      await manager.query(
        'UPDATE social_platforms SET "platformId" = $1 WHERE id = $2',
        [pid, sp.id],
      );
      socialPlatformUpdates += 1;
    }

    const indexStatements: readonly string[] = [
      'CREATE INDEX IF NOT EXISTS idx_campaign_platforms_campaign_id ON campaign_platforms ("campaignId")',
      'CREATE INDEX IF NOT EXISTS idx_campaign_platforms_platform_id ON campaign_platforms ("platformId")',
      'CREATE INDEX IF NOT EXISTS idx_inf_prof_platforms_profile_id ON influencer_profile_platforms ("influencerProfileId")',
      'CREATE INDEX IF NOT EXISTS idx_inf_prof_platforms_platform_id ON influencer_profile_platforms ("platformId")',
      'CREATE INDEX IF NOT EXISTS idx_adv_prof_platforms_profile_id ON advertiser_profile_platforms ("advertiserProfileId")',
      'CREATE INDEX IF NOT EXISTS idx_adv_prof_platforms_platform_id ON advertiser_profile_platforms ("platformId")',
      'CREATE INDEX IF NOT EXISTS idx_camp_report_platforms_report_id ON campaign_report_platforms ("reportId")',
      'CREATE INDEX IF NOT EXISTS idx_camp_report_platforms_platform_id ON campaign_report_platforms ("platformId")',
      'CREATE INDEX IF NOT EXISTS idx_social_platforms_platform_id ON social_platforms ("platformId")',
    ];
    for (const stmt of indexStatements) {
      await manager.query(stmt);
    }

    await manager.query('DROP TABLE IF EXISTS active_platforms');

    console.log('Platforms migration completed:');
    console.log(`  campaign_platforms inserts: ${campaignInserts}`);
    console.log(
      `  influencer_profile_platforms inserts: ${influencerInserts}`,
    );
    console.log(
      `  advertiser_profile_platforms inserts: ${advertiserInserts}`,
    );
    console.log(`  campaign_report_platforms inserts: ${reportInserts}`);
    console.log(`  social_platforms updated: ${socialPlatformUpdates}`);
    console.log('  indexes created');
    console.log('  active_platforms table dropped');
  });

  await app.close();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
