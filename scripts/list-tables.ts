import { Client } from 'pg';

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:heNfkwifKqOnrhhKcOcryzgCnEzgEgGE@shuttle.proxy.rlwy.net:19459/railway',
  });
  await client.connect();
  const res = await client.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
  );
  console.log(res.rows.map((r) => r.tablename).join('\n'));
  await client.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
