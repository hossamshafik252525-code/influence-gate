import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { User } from '../../modules/users/entities/user.entity';
import { Role, UserStatus } from '../../common/enums';

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
  synchronize: false,
});

async function seed() {
  await dataSource.initialize();

  const repo = dataSource.getRepository(User);

  const existing = await repo.findOne({ where: { email: 'admin@influence-gate.com' } });
  if (existing) {
    console.log('Admin user already exists — skipping.');
    await dataSource.destroy();
    return;
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);

  await repo.save(
    repo.create({
      fullName: 'Admin',
      email: 'admin@influence-gate.com',
      password: hashedPassword,
      role: Role.ADMIN,
      status: UserStatus.CONFIRMED,
    }),
  );

  console.log('Admin user created: admin@influence-gate.com');

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
