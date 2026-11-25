const tg = window.Telegram?.WebApp;
tg?.ready(); tg?.expand();
const root = document.querySelector('#categories');
const input = document.querySelector('#search');
let data = [];
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function render() {
  const q = input.value.trim().toLocaleLowerCase('uk');
  const shown = data.map(cat => ({...cat, branches: cat.branches.filter(b => `${b.name} ${b.description || ''} ${cat.name}`.toLocaleLowerCase('uk').includes(q))})).filter(cat => cat.branches.length);
  if (!shown.length) { root.innerHTML = `<div class="empty">Нічого не знайшлося. Спробуй інший запит ✨</div>`; return; }
  root.innerHTML = shown.map((cat, i) => `<article class="category ${q || i === 0 ? 'open' : ''}">
    <button class="category-head" aria-expanded="${q || i === 0 ? 'true' : 'false'}"><span class="icon">${escapeHtml(cat.icon)}</span><span class="cat-title">${escapeHtml(cat.name)}</span><span class="count">${cat.branches.length}</span><span class="chevron">⌄</span></button>
    <div class="branch-list">${cat.branches.map(b => b.url ? `<a class="branch" href="${escapeHtml(b.url)}" target="_blank" rel="noopener"><span class="branch-name">${escapeHtml(b.name)}</span><span class="arrow">↗</span></a>` : `<div class="branch no-link" title="Посилання ще не додано"><span class="branch-name">${escapeHtml(b.name)}</span><span class="arrow">· · ·</span></div>`).join('')}</div>
  </article>`).join('');
  root.querySelectorAll('.category-head').forEach(button => button.addEventListener('click', () => { const card = button.closest('.category'); card.classList.toggle('open'); button.setAttribute('aria-expanded', card.classList.contains('open')); }));
}

async function init() {
  try {
    const response = await fetch('/api/navigation');
    if (!response.ok) throw new Error('navigation unavailable');
    data = await response.json(); render();
  } catch { root.innerHTML = `<div class="error">Не вдалося завантажити навігацію. Спробуй оновити сторінку.</div>`; }
}
input.addEventListener('input', render);
document.addEventListener('keydown', event => { if (event.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) { event.preventDefault(); input.focus(); } });
init();
