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
    ALTER TYPE campaign_applications_status_enum
    ADD VALUE IF NOT EXISTS 'pending_admin_approval'
  `);

  await dataSource.query(`
    ALTER TABLE campaign_applications
    ADD COLUMN IF NOT EXISTS "offerPrice" numeric(12, 2)
  `);

  console.log('Application status enum and offerPrice column updated successfully.');

  await dataSource.destroy();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
