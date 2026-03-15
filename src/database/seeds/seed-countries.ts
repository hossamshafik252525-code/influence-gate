import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Country } from '../../modules/countries/entities/country.entity';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'influence_gate',
  entities: [Country],
  synchronize: false,
});

async function seed() {
  await dataSource.initialize();

  const repo = dataSource.getRepository(Country);

  const exists = await repo.findOne({ where: { code: 'SA' } });
  if (exists) {
    console.log('Saudi Arabia already exists — skipping.');
    await dataSource.destroy();
    return;
  }

  await repo.insert({ name: 'المملكة العربية السعودية', code: 'SA' });
  console.log('Saudi Arabia inserted successfully.');

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
