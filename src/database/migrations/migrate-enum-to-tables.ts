import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';

interface CampaignRow {
  id: string;
  contentTypes: string[] | null;
  implementationType: string | null;
}

interface InfluencerProfileRow {
  id: string;
  contentType: string | null;
  implementationType: string | null;
}

interface AdvertiserProfileRow {
  id: string;
  contentTypes: string[] | null;
}

interface CampaignReportRow {
  id: string;
  contentTypes: string[] | null;
}

interface NamedRow {
  id: string;
  name: string;
  isActive: boolean;
}

const CONTENT_TYPE_SYNONYMS: Record<string, string> = {
  story: 'story',
  reel: 'reel',
  post: 'post',
  youtube_video: 'youtube_video',
  video: 'video',
  live: 'live',
  product_review: 'product_review',
};

const IMPLEMENTATION_TYPE_SYNONYMS: Record<string, string> = {
  field_visit: 'field_visit',
  remote_photography: 'remote_photography',
};

function resolveContentTypeIds(
  values: string[] | null,
  byName: Map<string, string>,
  activeIds: string[],
): string[] {
  if (!values || values.length === 0) return [];
  const resolved = new Set<string>();
  for (const value of values) {
    if (value === 'all') {
      for (const id of activeIds) resolved.add(id);
      continue;
    }
    const canonical = CONTENT_TYPE_SYNONYMS[value];
    if (!canonical) continue;
    const id = byName.get(canonical);
    if (id) resolved.add(id);
  }
  return Array.from(resolved);
}

function resolveImplementationTypeIds(
  value: string | null,
  byName: Map<string, string>,
): string[] {
  if (!value) return [];
  if (value === 'both') {
    const fieldVisit = byName.get('field_visit');
    const remote = byName.get('remote_photography');
    const ids: string[] = [];
    if (fieldVisit) ids.push(fieldVisit);
    if (remote) ids.push(remote);
    return ids;
  }
  const canonical = IMPLEMENTATION_TYPE_SYNONYMS[value];
  if (!canonical) return [];
  const id = byName.get(canonical);
  return id ? [id] : [];
}

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const dataSource = app.get(DataSource);

  await dataSource.transaction(async (manager) => {
    const contentTypes: NamedRow[] = await manager.query(
      'SELECT id, name, "isActive" FROM content_types',
    );
    const implementationTypes: NamedRow[] = await manager.query(
      'SELECT id, name, "isActive" FROM implementation_types',
    );

    const contentTypeByName = new Map<string, string>();
    const activeContentTypeIds: string[] = [];
    for (const row of contentTypes) {
      contentTypeByName.set(row.name, row.id);
      if (row.isActive) activeContentTypeIds.push(row.id);
    }

    const implementationTypeByName = new Map<string, string>();
    for (const row of implementationTypes) {
      implementationTypeByName.set(row.name, row.id);
    }

    if (contentTypeByName.size === 0) {
      throw new Error(
        'content_types table is empty. Run app once to trigger the seeder before running this migration.',
      );
    }
    if (implementationTypeByName.size === 0) {
      throw new Error(
        'implementation_types table is empty. Run app once to trigger the seeder before running this migration.',
      );
    }

    let campaignContentInserts = 0;
    let campaignImplementationInserts = 0;
    const campaigns: CampaignRow[] = await manager.query(
      'SELECT id, "contentTypes", "implementationType" FROM campaigns',
    );
    for (const campaign of campaigns) {
      const contentTypeIds = resolveContentTypeIds(
        campaign.contentTypes,
        contentTypeByName,
        activeContentTypeIds,
      );
      for (const ctId of contentTypeIds) {
        await manager.query(
          'INSERT INTO campaign_content_types ("campaignId", "contentTypeId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [campaign.id, ctId],
        );
        campaignContentInserts += 1;
      }
      const implementationTypeIds = resolveImplementationTypeIds(
        campaign.implementationType,
        implementationTypeByName,
      );
      for (const itId of implementationTypeIds) {
        await manager.query(
          'INSERT INTO campaign_implementation_types ("campaignId", "implementationTypeId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [campaign.id, itId],
        );
        campaignImplementationInserts += 1;
      }
    }

    let influencerContentInserts = 0;
    let influencerImplementationInserts = 0;
    const influencerProfiles: InfluencerProfileRow[] = await manager.query(
      'SELECT id, "contentType", "implementationType" FROM influencer_profiles',
    );
    for (const profile of influencerProfiles) {
      const contentTypeIds = resolveContentTypeIds(
        profile.contentType ? [profile.contentType] : null,
        contentTypeByName,
        activeContentTypeIds,
      );
      for (const ctId of contentTypeIds) {
        await manager.query(
          'INSERT INTO influencer_profile_content_types ("influencerProfileId", "contentTypeId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [profile.id, ctId],
        );
        influencerContentInserts += 1;
      }
      const implementationTypeIds = resolveImplementationTypeIds(
        profile.implementationType,
        implementationTypeByName,
      );
      for (const itId of implementationTypeIds) {
        await manager.query(
          'INSERT INTO influencer_profile_implementation_types ("influencerProfileId", "implementationTypeId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [profile.id, itId],
        );
        influencerImplementationInserts += 1;
      }
    }

    let advertiserContentInserts = 0;
    const advertiserProfiles: AdvertiserProfileRow[] = await manager.query(
      'SELECT id, "contentTypes" FROM advertiser_profiles',
    );
    for (const profile of advertiserProfiles) {
      const contentTypeIds = resolveContentTypeIds(
        profile.contentTypes,
        contentTypeByName,
        activeContentTypeIds,
      );
      for (const ctId of contentTypeIds) {
        await manager.query(
          'INSERT INTO advertiser_profile_content_types ("advertiserProfileId", "contentTypeId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [profile.id, ctId],
        );
        advertiserContentInserts += 1;
      }
    }

    let reportContentInserts = 0;
    const reports: CampaignReportRow[] = await manager.query(
      'SELECT id, "contentTypes" FROM campaign_reports',
    );
    for (const report of reports) {
      const contentTypeIds = resolveContentTypeIds(
        report.contentTypes,
        contentTypeByName,
        activeContentTypeIds,
      );
      for (const ctId of contentTypeIds) {
        await manager.query(
          'INSERT INTO campaign_report_content_types ("reportId", "contentTypeId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [report.id, ctId],
        );
        reportContentInserts += 1;
      }
    }

    const indexStatements: readonly string[] = [
      'CREATE INDEX IF NOT EXISTS idx_campaign_content_types_campaign_id ON campaign_content_types ("campaignId")',
      'CREATE INDEX IF NOT EXISTS idx_campaign_content_types_content_type_id ON campaign_content_types ("contentTypeId")',
      'CREATE INDEX IF NOT EXISTS idx_campaign_impl_types_campaign_id ON campaign_implementation_types ("campaignId")',
      'CREATE INDEX IF NOT EXISTS idx_campaign_impl_types_impl_type_id ON campaign_implementation_types ("implementationTypeId")',
      'CREATE INDEX IF NOT EXISTS idx_inf_prof_ct_profile_id ON influencer_profile_content_types ("influencerProfileId")',
      'CREATE INDEX IF NOT EXISTS idx_inf_prof_ct_content_type_id ON influencer_profile_content_types ("contentTypeId")',
      'CREATE INDEX IF NOT EXISTS idx_inf_prof_it_profile_id ON influencer_profile_implementation_types ("influencerProfileId")',
      'CREATE INDEX IF NOT EXISTS idx_inf_prof_it_impl_type_id ON influencer_profile_implementation_types ("implementationTypeId")',
      'CREATE INDEX IF NOT EXISTS idx_adv_prof_ct_profile_id ON advertiser_profile_content_types ("advertiserProfileId")',
      'CREATE INDEX IF NOT EXISTS idx_adv_prof_ct_content_type_id ON advertiser_profile_content_types ("contentTypeId")',
      'CREATE INDEX IF NOT EXISTS idx_camp_report_ct_report_id ON campaign_report_content_types ("reportId")',
      'CREATE INDEX IF NOT EXISTS idx_camp_report_ct_content_type_id ON campaign_report_content_types ("contentTypeId")',
    ];
    for (const stmt of indexStatements) {
      await manager.query(stmt);
    }

    await manager.query('DROP TABLE IF EXISTS active_content_types');

    console.log('Migration completed:');
    console.log(`  campaign_content_types inserts: ${campaignContentInserts}`);
    console.log(
      `  campaign_implementation_types inserts: ${campaignImplementationInserts}`,
    );
    console.log(
      `  influencer_profile_content_types inserts: ${influencerContentInserts}`,
    );
    console.log(
      `  influencer_profile_implementation_types inserts: ${influencerImplementationInserts}`,
    );
    console.log(
      `  advertiser_profile_content_types inserts: ${advertiserContentInserts}`,
    );
    console.log(
      `  campaign_report_content_types inserts: ${reportContentInserts}`,
    );
    console.log('  indexes created');
    console.log('  active_content_types table dropped');
  });

  await app.close();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
