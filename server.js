import 'dotenv/config';
import express from 'express';
import pg from 'pg';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 3000);
const here = path.dirname(fileURLToPath(import.meta.url));
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined });
app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(here, 'public')));

function verifyInitData(initData) {
  if (!process.env.BOT_TOKEN || !initData) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');
  const check = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(process.env.BOT_TOKEN).digest();
  const expected = crypto.createHmac('sha256', secret).update(check).digest('hex');
  if (hash.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expected))) return null;
  const authDate = Number(params.get('auth_date'));
  if (!Number.isFinite(authDate) || Date.now() / 1000 - authDate > 86400) return null;
  try { return JSON.parse(params.get('user') || 'null'); } catch { return null; }
}

function currentUser(req) { return verifyInitData(req.get('X-Telegram-Init-Data') || ''); }
function isAdmin(user) {
  const ids = (process.env.ADMIN_IDS || '').split(',').map(x => x.trim()).filter(Boolean);
  return !!user && ids.includes(String(user.id));
}

app.get('/api/navigation', async (_req, res) => {
  try {
    const { rows } = await pool.query(`SELECT c.id AS category_id, c.name AS category, c.icon, c.sort_order AS category_order,
      b.id, b.name, b.description, b.telegram_url, b.sort_order
      FROM categories c LEFT JOIN branches b ON b.category_id=c.id
      WHERE c.is_visible=true AND (b.is_visible=true OR b.id IS NULL)
      ORDER BY c.sort_order, b.sort_order, b.name`);
    const result = [];
    for (const row of rows) {
      let category = result.find(x => x.id === row.category_id);
      if (!category) { category = { id: row.category_id, name: row.category, icon: row.icon, branches: [] }; result.push(category); }
      if (row.id) category.branches.push({ id: row.id, name: row.name, description: row.description, url: row.telegram_url });
    }
    res.json(result);
  } catch (error) { console.error('navigation query failed:', error.message); res.status(503).json({ error: 'Навігація тимчасово недоступна' }); }
});

app.get('/api/admin/branches', async (req, res) => {
  if (!isAdmin(currentUser(req))) return res.status(403).json({ error: 'Доступ лише для адміністраторів' });
  try { const { rows } = await pool.query('SELECT id,name,description,telegram_url,category_id,sort_order,is_visible FROM branches ORDER BY category_id,sort_order'); res.json(rows); }
  catch (error) { console.error('admin query failed:', error.message); res.status(503).json({ error: 'Не вдалося завантажити гілки' }); }
});

app.patch('/api/admin/branches/:id', async (req, res) => {
  if (!isAdmin(currentUser(req))) return res.status(403).json({ error: 'Доступ лише для адміністраторів' });
  const { name, description, telegram_url, category_id, sort_order, is_visible } = req.body || {};
  if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'Назва обов’язкова' });
  if (telegram_url && !/^https:\/\/(t\.me|telegram\.me)\//i.test(telegram_url)) return res.status(400).json({ error: 'Посилання має вести на t.me' });
  try {
    const { rows } = await pool.query(`UPDATE branches SET name=$1, description=$2, telegram_url=$3, category_id=$4,
      sort_order=$5, is_visible=$6, updated_at=now() WHERE id=$7 RETURNING *`,
      [name.trim(), description || '', telegram_url || null, category_id, Number(sort_order) || 0, is_visible !== false, req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Гілку не знайдено' });
    res.json(rows[0]);
  } catch (error) { console.error('branch update failed:', error.message); res.status(400).json({ error: 'Не вдалося зберегти зміни' }); }
});

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('*', (_req, res) => res.sendFile(path.join(here, 'public', 'index.html')));
app.listen(port, () => console.log(`Magiia Linii Navigator listening on ${port}`));
