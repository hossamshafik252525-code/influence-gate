import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'influence_gate',
  entities: [],
  synchronize: false,
});

async function run() {
  await dataSource.initialize();

  const result = await dataSource.query(`
    UPDATE influencer_profiles ip
    SET "totalFollowers" = COALESCE(sub.total, 0)
    FROM (
      SELECT
        sp."influencerProfileId" AS profile_id,
        SUM(
          COALESCE(
            (sp.statistics->>'followersCount')::numeric,
            (sp.statistics->>'followerCount')::numeric,
            (sp.statistics->>'fanCount')::numeric,
            0
          )
        ) AS total
      FROM social_platforms sp
      GROUP BY sp."influencerProfileId"
    ) AS sub
    WHERE ip.id = sub.profile_id
  `);

  console.log('Backfilled totalFollowers for influencer profiles.', result);

  await dataSource.destroy();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
