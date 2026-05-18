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

interface CountrySeed {
  name: string;
  code: string;
}

const COUNTRIES: CountrySeed[] = [
  { name: 'المملكة العربية السعودية', code: 'SA' },
  { name: 'الإمارات العربية المتحدة', code: 'AE' },
  { name: 'الكويت', code: 'KW' },
  { name: 'قطر', code: 'QA' },
  { name: 'البحرين', code: 'BH' },
  { name: 'عُمان', code: 'OM' },
  { name: 'اليمن', code: 'YE' },
  { name: 'العراق', code: 'IQ' },
  { name: 'الأردن', code: 'JO' },
  { name: 'سوريا', code: 'SY' },
  { name: 'لبنان', code: 'LB' },
  { name: 'فلسطين', code: 'PS' },
  { name: 'مصر', code: 'EG' },
  { name: 'السودان', code: 'SD' },
  { name: 'ليبيا', code: 'LY' },
  { name: 'تونس', code: 'TN' },
  { name: 'الجزائر', code: 'DZ' },
  { name: 'المغرب', code: 'MA' },
  { name: 'موريتانيا', code: 'MR' },
  { name: 'الصومال', code: 'SO' },
  { name: 'جيبوتي', code: 'DJ' },
  { name: 'جزر القمر', code: 'KM' },
  { name: 'تركيا', code: 'TR' },
  { name: 'إيران', code: 'IR' },
  { name: 'باكستان', code: 'PK' },
  { name: 'الهند', code: 'IN' },
  { name: 'إندونيسيا', code: 'ID' },
  { name: 'ماليزيا', code: 'MY' },
  { name: 'الصين', code: 'CN' },
  { name: 'اليابان', code: 'JP' },
  { name: 'كوريا الجنوبية', code: 'KR' },
  { name: 'المملكة المتحدة', code: 'GB' },
  { name: 'الولايات المتحدة', code: 'US' },
  { name: 'كندا', code: 'CA' },
  { name: 'ألمانيا', code: 'DE' },
  { name: 'فرنسا', code: 'FR' },
  { name: 'إسبانيا', code: 'ES' },
  { name: 'إيطاليا', code: 'IT' },
  { name: 'هولندا', code: 'NL' },
  { name: 'السويد', code: 'SE' },
  { name: 'سويسرا', code: 'CH' },
  { name: 'أستراليا', code: 'AU' },
  { name: 'نيوزيلندا', code: 'NZ' },
  { name: 'البرازيل', code: 'BR' },
  { name: 'الأرجنتين', code: 'AR' },
  { name: 'المكسيك', code: 'MX' },
  { name: 'جنوب أفريقيا', code: 'ZA' },
  { name: 'نيجيريا', code: 'NG' },
  { name: 'كينيا', code: 'KE' },
  { name: 'إثيوبيا', code: 'ET' },
];

async function seed(): Promise<void> {
  await dataSource.initialize();

  const repo = dataSource.getRepository(Country);

  let inserted = 0;
  let skipped = 0;

  for (const country of COUNTRIES) {
    const exists = await repo.findOne({ where: { code: country.code } });
    if (exists) {
      skipped += 1;
      continue;
    }
    await repo.insert(country);
    inserted += 1;
  }

  console.log(`Countries seed finished. Inserted: ${inserted}, Skipped: ${skipped}.`);

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
