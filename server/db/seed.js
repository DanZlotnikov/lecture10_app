import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const sqlPath = join(dirname(fileURLToPath(import.meta.url)), 'seed.sql');
const sql = readFileSync(sqlPath, 'utf8');

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME = 'event_map' } = process.env;

if (!DB_HOST || !DB_USER || !DB_PASSWORD) {
  console.error('Missing DB_HOST, DB_USER, or DB_PASSWORD in .env');
  process.exit(1);
}

console.log(`Connecting to MySQL at ${DB_HOST}...`);

const conn = await mysql.createConnection({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  multipleStatements: true,
});

console.log('Connected. Running seed...');

await conn.query(sql);
await conn.end();

console.log(`Done. Database "${DB_NAME}" recreated with all tables and mock data.`);
console.log('Test accounts (password: password123): alice, bob, charlie');
