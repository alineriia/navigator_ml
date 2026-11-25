import 'dotenv/config';
const token = process.env.BOT_TOKEN;
const url = process.env.WEBAPP_URL;
if (!token || !url) throw new Error('Set BOT_TOKEN and WEBAPP_URL before running this script.');
const response = await fetch(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ menu_button: { type: 'web_app', text: '🧭 Навігація', web_app: { url } } })
});
const result = await response.json();
if (!response.ok || !result.ok) throw new Error(`Telegram API rejected the menu button: ${result.description || response.status}`);
console.log('Menu button configured.');
