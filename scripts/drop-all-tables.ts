import { Client } from 'pg';

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:heNfkwifKqOnrhhKcOcryzgCnEzgEgGE@shuttle.proxy.rlwy.net:19459/railway',
  });
  await client.connect();

  const res = await client.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
  );
  const tables = res.rows.map((r) => r.tablename);
  if (tables.length > 0) {
    const list = tables.map((t) => `"${t}"`).join(', ');
    await client.query(`DROP TABLE IF EXISTS ${list} CASCADE`);
    console.log(`Dropped: ${list}`);
  } else {
    console.log('No tables found');
  }

  await client.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
