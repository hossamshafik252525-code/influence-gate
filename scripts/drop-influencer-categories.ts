import { Client } from 'pg';

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:heNfkwifKqOnrhhKcOcryzgCnEzgEgGE@shuttle.proxy.rlwy.net:19459/railway',
  });

  await client.connect();
  await client.query('DROP TABLE IF EXISTS influencer_categories CASCADE;');
  console.log('Dropped influencer_categories table');
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
