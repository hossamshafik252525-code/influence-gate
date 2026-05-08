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

  await dataSource.query(`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inv_pending_influencer
    ON campaign_invited_influencers ("influencerId")
    WHERE status = 'pending'
  `);

  await dataSource.query(`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_app_pending_campaign
    ON campaign_applications ("campaignId")
    WHERE status = 'pending'
  `);

  await dataSource.query(`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_active_advertiser
    ON campaigns ("advertiserId")
    WHERE status IN ('implementation', 'approved', 'pending_minimum')
  `);

  console.log('Partial indexes created successfully.');

  await dataSource.destroy();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
