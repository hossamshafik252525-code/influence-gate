import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { ActivePlatform } from '../../modules/platform-settings/entities/active-platform.entity';
import { ActiveContentType } from '../../modules/platform-settings/entities/active-content-type.entity';
import { Platform } from '../../common/enums/platform.enum';
import { ContentTypeOffer } from '../../common/enums/content-type-offer.enum';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'influence_gate',
  entities: [__dirname + '/../../modules/**/*.entity{.ts,.js}'],
  synchronize: true,
});

async function seed(): Promise<void> {
  await dataSource.initialize();

  const platformRepo = dataSource.getRepository(ActivePlatform);
  const contentTypeRepo = dataSource.getRepository(ActiveContentType);

  for (const platform of Object.values(Platform)) {
    const existing = await platformRepo.findOne({ where: { name: platform } });
    if (!existing) {
      await platformRepo.save(platformRepo.create({ name: platform, isActive: true }));
      console.log(`Inserted platform: ${platform}`);
    } else {
      console.log(`Platform already exists: ${platform}`);
    }
  }

  for (const contentType of Object.values(ContentTypeOffer)) {
    const existing = await contentTypeRepo.findOne({ where: { name: contentType } });
    if (!existing) {
      await contentTypeRepo.save(contentTypeRepo.create({ name: contentType, isActive: true }));
      console.log(`Inserted content type: ${contentType}`);
    } else {
      console.log(`Content type already exists: ${contentType}`);
    }
  }

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
