import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { ContactCard } from '../../modules/contact-us/entities/contact-card.entity';
import { ContactType } from '../../modules/contact-us/enums/contact-type.enum';
import { ContactPlatform } from '../../modules/contact-us/enums/contact-platform.enum';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'influence_gate',
  entities: [ContactCard],
  synchronize: false,
});

const cards: Partial<ContactCard>[] = [
  {
    platform: ContactPlatform.WHATSAPP,
    type: ContactType.NUMBER,
    value: '+966500000001',
    isActive: true,
  },
  {
    platform: ContactPlatform.PHONE,
    type: ContactType.NUMBER,
    value: '+966112345678',
    isActive: true,
  },
  {
    platform: ContactPlatform.INSTAGRAM,
    type: ContactType.LINK,
    value: 'https://www.instagram.com/influencegate',
    isActive: true,
  },
  {
    platform: ContactPlatform.TWITTER,
    type: ContactType.LINK,
    value: 'https://www.twitter.com/influencegate',
    isActive: true,
  },
  {
    platform: ContactPlatform.TELEGRAM,
    type: ContactType.LINK,
    value: 'https://t.me/influencegate_support',
    isActive: true,
  },
  {
    platform: ContactPlatform.EMAIL,
    type: ContactType.LINK,
    value: 'mailto:support@influencegate.com',
    isActive: true,
  },
  {
    platform: ContactPlatform.FACEBOOK,
    type: ContactType.LINK,
    value: 'https://www.facebook.com/influencegate',
    isActive: true,
  },
  {
    platform: ContactPlatform.TIKTOK,
    type: ContactType.LINK,
    value: 'https://www.tiktok.com/@influencegate',
    isActive: true,
  },
  {
    platform: ContactPlatform.YOUTUBE,
    type: ContactType.LINK,
    value: 'https://www.youtube.com/@influencegate',
    isActive: true,
  },
  {
    platform: ContactPlatform.WEBSITE,
    type: ContactType.LINK,
    value: 'https://www.influencegate.com',
    isActive: true,
  },
];

async function seed() {
  await dataSource.initialize();

  const repo = dataSource.getRepository(ContactCard);

  const entities = cards.map((card) => repo.create(card));
  await repo.save(entities);

  console.log(`Inserted ${entities.length} contact cards successfully.`);
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
