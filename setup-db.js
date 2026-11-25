import 'dotenv/config';
import pg from 'pg';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in .env first');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined });
try { await pool.query(await fs.readFile(path.join(here, 'schema.sql'), 'utf8')); console.log('Database schema and starter navigation are ready.'); }
finally { await pool.end(); }
