import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Country } from '../../modules/countries/entities/country.entity';
import { Platform } from '../../modules/platforms/entities/platform.entity';
import { ContentType } from '../../modules/content-types/entities/content-type.entity';
import { ImplementationType } from '../../modules/implementation-types/entities/implementation-type.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Role } from '../../common/enums';

// ─── Arabic Countries ─────────────────────────────────────────────────────────
const ARABIC_COUNTRIES = [
  { name: 'المملكة العربية السعودية', code: 'SA' },
  { name: 'الإمارات العربية المتحدة', code: 'AE' },
  { name: 'مصر', code: 'EG' },
  { name: 'الكويت', code: 'KW' },
  { name: 'قطر', code: 'QA' },
  { name: 'البحرين', code: 'BH' },
  { name: 'عُمان', code: 'OM' },
  { name: 'الأردن', code: 'JO' },
  { name: 'العراق', code: 'IQ' },
  { name: 'لبنان', code: 'LB' },
  { name: 'سوريا', code: 'SY' },
  { name: 'اليمن', code: 'YE' },
  { name: 'ليبيا', code: 'LY' },
  { name: 'تونس', code: 'TN' },
  { name: 'الجزائر', code: 'DZ' },
  { name: 'المغرب', code: 'MA' },
  { name: 'موريتانيا', code: 'MR' },
  { name: 'السودان', code: 'SD' },
  { name: 'الصومال', code: 'SO' },
  { name: 'جيبوتي', code: 'DJ' },
  { name: 'جزر القمر', code: 'KM' },
  { name: 'فلسطين', code: 'PS' },
];

// ─── Platforms ────────────────────────────────────────────────────────────────
const PLATFORMS = [
  { name: 'YouTube' },
  { name: 'Instagram' },
  { name: 'Facebook' },
  { name: 'X' },
  { name: 'TikTok' },
];

// ─── Implementation Types ─────────────────────────────────────────────────────
const IMPLEMENTATION_TYPES = [
  { name: 'Remote' },
  { name: 'Field Visit' },
];

// ─── Content Types ────────────────────────────────────────────────────────────
const CONTENT_TYPES = [
  { name: 'Story' },
  { name: 'Video' },
  { name: 'Live' },
  { name: 'Post' },
];

// ─── Admin Credentials ────────────────────────────────────────────────────────
const ADMIN = {
  email: 'admin@influence-gate.com',
  password: 'admin123',
  fullName: 'Admin',
};

async function bootstrap() {
  console.log('🌱 Starting seed: initial data...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const countryRepo = dataSource.getRepository(Country);
  const platformRepo = dataSource.getRepository(Platform);
  const contentTypeRepo = dataSource.getRepository(ContentType);
  const implTypeRepo = dataSource.getRepository(ImplementationType);
  const userRepo = dataSource.getRepository(User);

  // ── 1. Seed Arabic Countries ───────────────────────────────────────────────
  console.log('📍 Seeding Arabic countries...');
  let countriesCreated = 0;
  let countriesSkipped = 0;

  for (const countryData of ARABIC_COUNTRIES) {
    const exists = await countryRepo.findOne({
      where: { name: countryData.name },
    });

    if (!exists) {
      await countryRepo.save(countryRepo.create(countryData));
      console.log(`  ✅ Created: ${countryData.name} (${countryData.code})`);
      countriesCreated++;
    } else {
      console.log(`  ⏭️  Skipped (exists): ${countryData.name}`);
      countriesSkipped++;
    }
  }
  console.log(
    `\n  Countries → Created: ${countriesCreated}, Skipped: ${countriesSkipped}\n`,
  );

  // ── 2. Seed Platforms ──────────────────────────────────────────────────────
  console.log('📱 Seeding platforms...');
  let platformsCreated = 0;
  let platformsSkipped = 0;

  for (const platformData of PLATFORMS) {
    const exists = await platformRepo.findOne({
      where: { name: platformData.name },
    });

    if (!exists) {
      await platformRepo.save(
        platformRepo.create({ name: platformData.name, isActive: true }),
      );
      console.log(`  ✅ Created: ${platformData.name}`);
      platformsCreated++;
    } else {
      console.log(`  ⏭️  Skipped (exists): ${platformData.name}`);
      platformsSkipped++;
    }
  }
  console.log(
    `\n  Platforms → Created: ${platformsCreated}, Skipped: ${platformsSkipped}\n`,
  );

  // ── 3. Seed Implementation Types ───────────────────────────────────────────
  console.log('🔧 Seeding implementation types...');
  let implCreated = 0;
  let implSkipped = 0;

  for (const implData of IMPLEMENTATION_TYPES) {
    const exists = await implTypeRepo.findOne({
      where: { name: implData.name },
    });

    if (!exists) {
      await implTypeRepo.save(
        implTypeRepo.create({ name: implData.name, isActive: true }),
      );
      console.log(`  ✅ Created: ${implData.name}`);
      implCreated++;
    } else {
      console.log(`  ⏭️  Skipped (exists): ${implData.name}`);
      implSkipped++;
    }
  }
  console.log(
    `\n  Implementation Types → Created: ${implCreated}, Skipped: ${implSkipped}\n`,
  );

  // ── 4. Seed Content Types ──────────────────────────────────────────────────
  console.log('🎬 Seeding content types...');
  let contentCreated = 0;
  let contentSkipped = 0;

  for (const contentData of CONTENT_TYPES) {
    const exists = await contentTypeRepo.findOne({
      where: { name: contentData.name },
    });

    if (!exists) {
      await contentTypeRepo.save(
        contentTypeRepo.create({ name: contentData.name, isActive: true }),
      );
      console.log(`  ✅ Created: ${contentData.name}`);
      contentCreated++;
    } else {
      console.log(`  ⏭️  Skipped (exists): ${contentData.name}`);
      contentSkipped++;
    }
  }
  console.log(
    `\n  Content Types → Created: ${contentCreated}, Skipped: ${contentSkipped}\n`,
  );

  // ── 5. Seed Admin User ─────────────────────────────────────────────────────
  console.log('👤 Seeding admin user...');
  const existingAdmin = await userRepo.findOne({
    where: { email: ADMIN.email },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(ADMIN.password, 10);
    await userRepo.save(
      userRepo.create({
        fullName: ADMIN.fullName,
        email: ADMIN.email,
        password: hashedPassword,
        role: Role.ADMIN,
      }),
    );
    console.log(`  ✅ Admin created: ${ADMIN.email}`);
  } else {
    console.log(`  ⏭️  Admin already exists: ${ADMIN.email}`);
  }

  console.log('\n✨ Seed completed successfully!\n');
  await app.close();
}

bootstrap().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
