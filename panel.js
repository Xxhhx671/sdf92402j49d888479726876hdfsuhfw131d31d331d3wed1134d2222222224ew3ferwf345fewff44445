/* ============================================================
   kawaz1k.win — панель: жалобы, новости, частный вход
   Данные хранятся в localStorage (статический сайт).
   ============================================================ */

(() => {
  'use strict';

  const KEY = {
    fb: 'kawaz_feedback',
    news: 'kawaz_news',
    admin: 'kawaz_admin'
  };
  const INVITE = 'kawaz1k1804';

  const t = k => (window.KawazI18n ? window.KawazI18n.t(k) : k);
  const lang = () => (window.KawazI18n ? window.KawazI18n.lang : 'ru');

  /* ---------- хранилище ---------- */
  const read = (k, def) => {
    try {
      const v = JSON.parse(localStorage.getItem(k));
      return Array.isArray(v) ? v : def;
    } catch (e) { return def; }
  };
  const write = (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
  };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /* ---------- стартовые новости ---------- */
  if (!localStorage.getItem(KEY.news)) {
    const day = 86400000;
    write(KEY.news, [
      {
        id: uid(), ts: Date.now() - day * 2,
        title: 'Запуск kawaz1k.win',
        desc: 'Открыт новый сайт универсального скрипта для Roblox.',
        added: 'Консоль с копированием, инструкция, форма жалоб',
        improved: 'Дизайн, скорость и мобильная версия'
      },
      {
        id: uid(), ts: Date.now() - day * 5,
        title: 'Universal v5.0.3',
        desc: 'Один скрипт работает сразу во всех играх.',
        added: 'Режим Universal для любых проектов',
        improved: 'Стабильность и анти-детект'
      },
      {
        id: uid(), ts: Date.now() - day * 9,
        title: 'Частный вход',
        desc: 'Открыта администрация сайта по инвайт-коду.',
        added: 'Панель: жалобы и публикация новостей',
        improved: 'Фильтрация входа по invite-code'
      }
    ]);
  }

  const isAdmin = () => localStorage.getItem(KEY.admin) === '1';

  /* ---------- тост (перекрывает текст main.js, восстанавливает его) ---------- */
  let toastTimer;
  const toast = msg => {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove('show');
      el.textContent = t('toast');
    }, 2400);
  };

  /* ---------- модалки ---------- */
  let lastFocus = null;
  const openModal = id => {
    const m = typeof id === 'string' ? document.getElementById(id) : id;
    if (!m) return;
    lastFocus = document.activeElement;
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    const focusable = m.querySelector('textarea, input, button:not(.modal__close)');
    setTimeout(() => focusable && focusable.focus({ preventScroll: true }), 350);
  };
  const closeModal = m => {
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.modal.open')) document.body.classList.remove('modal-open');
    if (lastFocus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
  };

  document.addEventListener('click', e => {
    const opener = e.target.closest('[data-open]');
    if (opener) { openModal(opener.dataset.open); return; }
    const closer = e.target.closest('[data-close]');
    if (closer) { const m = closer.closest('.modal'); if (m) closeModal(m); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.modal.open').forEach(closeModal);
  });

  /* ---------- жалобы / идеи ---------- */
  const fbText = document.getElementById('fbText');
  const fbError = document.getElementById('fbError');
  const fbChips = document.getElementById('fbChips');
  let fbType = 'problem';

  fbChips?.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    fbChips.querySelectorAll('.chip').forEach(c => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    fbType = chip.dataset.type;
  });

  document.getElementById('fbSend')?.addEventListener('click', () => {
    const text = (fbText.value || '').trim();
    if (!text) {
      fbError.classList.add('show', 'shake');
      fbText.classList.add('shake');
      setTimeout(() => { fbError.classList.remove('shake'); fbText.classList.remove('shake'); }, 500);
      fbText.focus();
      return;
    }
    const items = read(KEY.fb, []);
    items.unshift({ id: uid(), type: fbType, text, ts: Date.now() });
    write(KEY.fb, items);
    fbText.value = '';
    fbError.classList.remove('show');
    closeModal(document.getElementById('modalComplaint'));
    toast(t('fb.thanks'));
    renderFb();
    updateStat();
  });

  /* ---------- список жалоб (админ) ---------- */
  const fbList = document.getElementById('fbList');
  const typeLabel = type =>
    type === 'improve' ? t('fb.improve') : type === 'add' ? t('fb.add') : t('fb.problem');
  const fmtDate = ts =>
    new Date(ts).toLocaleDateString(lang() === 'ru' ? 'ru-RU' : 'en-US',
      { day: '2-digit', month: 'short', year: 'numeric' });

  const escapeHtml = s => String(s).replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function renderFb() {
    if (!fbList) return;
    const items = read(KEY.fb, []);
    if (!items.length) {
      fbList.innerHTML = `<p class="admin__empty">${escapeHtml(t('private.empty'))}</p>`;
      return;
    }
    fbList.innerHTML = items.map(it => `
      <article class="fb-item fb-item--${escapeHtml(it.type)}">
        <div class="fb-item__top">
          <span class="fb-item__type">${escapeHtml(typeLabel(it.type))}</span>
          <span class="fb-item__date">${escapeHtml(fmtDate(it.ts))}</span>
          <button class="fb-item__del" data-del-fb="${it.id}" aria-label="Delete">&times;</button>
        </div>
        <p class="fb-item__text">${escapeHtml(it.text)}</p>
      </article>`).join('');
  }

  fbList?.addEventListener('click', e => {
    const btn = e.target.closest('[data-del-fb]');
    if (!btn) return;
    write(KEY.fb, read(KEY.fb, []).filter(i => i.id !== btn.dataset.delFb));
    renderFb();
    updateStat();
  });

  /* ---------- новости ---------- */
  const newsList = document.getElementById('newsList');

  function renderNews() {
    if (!newsList) return;
    const items = read(KEY.news, []);
    if (!items.length) {
      newsList.innerHTML = `<p class="news-hint">${escapeHtml(t('news.empty'))}</p>`;
      return;
    }
    newsList.innerHTML = items.map(it => `
      <article class="news-item">
        <div class="news-item__head">
          <span class="news-item__date">${escapeHtml(fmtDate(it.ts))}</span>
          ${isAdmin() ? `<button class="news-item__del" data-del-news="${it.id}" aria-label="${escapeHtml(t('news.delete'))}">&times;</button>` : ''}
        </div>
        <h4 class="news-item__title">${escapeHtml(it.title)}</h4>
        ${it.desc ? `<p class="news-item__desc">${escapeHtml(it.desc)}</p>` : ''}
        <ul class="news-item__meta">
          ${it.added ? `<li><span class="nm-key">+</span> <b>${escapeHtml(t('news.added'))}:</b> ${escapeHtml(it.added)}</li>` : ''}
          ${it.improved ? `<li><span class="nm-key">&uarr;</span> <b>${escapeHtml(t('news.improved'))}:</b> ${escapeHtml(it.improved)}</li>` : ''}
        </ul>
      </article>`).join('');
  }

  newsList?.addEventListener('click', e => {
    const btn = e.target.closest('[data-del-news]');
    if (!btn) return;
    write(KEY.news, read(KEY.news, []).filter(i => i.id !== btn.dataset.delNews));
    renderNews();
    updateStat();
  });

  /* ---------- публикация новости (админ) ---------- */
  document.getElementById('newsForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const title = document.getElementById('nfTitle').value.trim();
    if (!title) return;
    const items = read(KEY.news, []);
    items.unshift({
      id: uid(), ts: Date.now(),
      title,
      desc: document.getElementById('nfDesc').value.trim(),
      added: document.getElementById('nfAdded').value.trim(),
      improved: document.getElementById('nfImproved').value.trim()
    });
    write(KEY.news, items);
    e.target.reset();
    renderNews();
    updateStat();
    toast(t('fb.thanks'));
  });

  /* ---------- частный вход ---------- */
  const gate = document.getElementById('gate');
  const admin = document.getElementById('admin');
  const gateMsg = document.getElementById('gateMsg');
  const inviteInput = document.getElementById('inviteInput');

  const showAdmin = () => {
    gate.hidden = true;
    admin.hidden = false;
    renderFb();
    updateStat();
  };
  const showGate = () => {
    admin.hidden = true;
    gate.hidden = false;
    gateMsg.textContent = '';
    gateMsg.className = 'gate__msg';
  };

  const updateStat = () => {
    const el = document.getElementById('adminStat');
    if (!el) return;
    el.textContent = t('private.stat')
      .replace('{n}', read(KEY.fb, []).length)
      .replace('{m}', read(KEY.news, []).length);
  };

  document.getElementById('gateForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const code = (inviteInput.value || '').trim();
    if (code === INVITE) {
      localStorage.setItem(KEY.admin, '1');
      gateMsg.textContent = t('private.ok');
      gateMsg.className = 'gate__msg ok';
      gate.classList.add('shake-ok');
      setTimeout(() => { gate.classList.remove('shake-ok'); showAdmin(); renderNews(); }, 750);
    } else {
      gateMsg.textContent = t('private.wrong');
      gateMsg.className = 'gate__msg err';
      gate.classList.add('shake');
      inviteInput.value = '';
      inviteInput.focus();
      setTimeout(() => gate.classList.remove('shake'), 550);
    }
  });

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem(KEY.admin);
    showGate();
    renderNews();
  });

  /* ---------- перерисовка при смене языка ---------- */
  if (window.KawazI18n) {
    window.KawazI18n.onChange(() => {
      renderNews();
      renderFb();
      updateStat();
      if (gateMsg.textContent) {
        if (gateMsg.classList.contains('err')) gateMsg.textContent = t('private.wrong');
        if (gateMsg.classList.contains('ok')) gateMsg.textContent = t('private.ok');
      }
    });
  }

  /* ---------- старт ---------- */
  renderNews();
  if (isAdmin()) showAdmin(); else showGate();
})();
