const BRAIN_BUILD = 'THE-brain-v1';
const STORAGE_KEY = 'THE-brain-v1';

const defaultState = () => {
  const t = today();
  return {
    build: BRAIN_BUILD,
    tab: 'home',
    selectedDate: t,
    checkin: {
      [t]: {
        date: t,
        whoopRecovery: 72,
        whoopStrain: 8.4,
        whoopSleepPerformance: 84,
        hrv: 68,
        restingHr: 52,
      },
    },
    settings: { whoop: { connected: false, lastSyncAt: null, email: null } },
    coachHistory: [],
    published: seedPublished(),
    goals: [],
    fabOpen: false,
    notifications: 5,
    chatUnread: 14,
  };
};

function seedPublished() {
  const t = today();
  const d = (offset) => addDays(t, offset);
  return {
    [d(-6)]: [{ id: '1', type: 'strength', title: 'Upper Push' }],
    [d(-2)]: [{ id: '2', type: 'engine', title: 'Aerobic Row 20:00' }],
    [d(0)]: [
      { id: '3', type: 'strength', title: 'Lower Strength' },
      { id: '4', type: 'recovery', title: 'Recovery Breathing' },
    ],
  };
}

let S = load();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.build !== BRAIN_BUILD) return defaultState();
    return {
      ...defaultState(),
      ...parsed,
      published: parsed.published || seedPublished(),
      settings: { ...defaultState().settings, ...parsed.settings },
    };
  } catch {
    return defaultState();
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(S));
  window.S = S;
}

function today() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

function addDays(iso, n) {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function parseDate(iso) {
  return new Date(iso + 'T12:00:00');
}

function monthLabel(iso) {
  const d = parseDate(iso);
  const mon = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const yr = String(d.getFullYear()).slice(-2);
  return `${mon} '${yr}`;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function metricsFromCheckin(c = {}) {
  return {
    recovery: num(c.whoopRecovery) || null,
    strain: num(c.whoopStrain) || null,
    sleepScore: num(c.whoopSleepPerformance) || null,
    hrvMs: num(c.hrv) || null,
    restingHr: num(c.restingHr) || null,
  };
}

function checkinSlice(c = {}) {
  return {
    sleepQuality: num(c.sleepQuality) || null,
    energy: num(c.energy) || null,
    muscleSoreness: num(c.muscleSoreness) || null,
    jointStress: num(c.jointStress) || null,
    mentalStress: num(c.mentalStress) || null,
  };
}

function packet() {
  const c = S.checkin[S.selectedDate] || S.checkin[today()] || {};
  return HybridBrain.buildBrainPacket({
    date: S.selectedDate,
    room: 'engine',
    metrics: metricsFromCheckin(c),
    checkin: checkinSlice(c),
    connected: { whoop: !!S.settings.whoop.connected, concept2: false },
  });
}

function dailyCheckin(date = today(), create = true) {
  S.checkin = S.checkin || {};
  if (!S.checkin[date] && create) {
    S.checkin[date] = {
      date,
      whoopRecovery: '',
      whoopStrain: '',
      hrv: '',
      restingHr: '',
      whoopSleepPerformance: '',
    };
  }
  return S.checkin[date];
}

function readinessScore(c) {
  return HybridBrain.scoreReadiness(metricsFromCheckin(c), checkinSlice(c));
}

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function weekDays(centerIso) {
  const c = parseDate(centerIso);
  const day = c.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(c);
  start.setDate(c.getDate() + mondayOffset);
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function athClamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function whoopDialSvg(opts = {}) {
  const size = opts.size || 104;
  const stroke = size >= 100 ? 7 : 6;
  const c = size / 2;
  const r = c - stroke / 2 - 1.5;
  const max = num(opts.max) || 100;
  const raw = opts.value;
  const has = raw != null && raw !== '' && Number.isFinite(Number(raw));
  const prog = has ? athClamp(num(raw) / max, 0, 1) : 0;
  const circ = 2 * Math.PI * r;
  const color = opts.color || '#9db4c8';
  const label = opts.label || '';
  const unit = opts.unit || '';
  const fid = `wg${Math.round(c)}${String(color).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}`;
  const valHtml = has
    ? unit === '%'
      ? `<span class="ath-whoop-n">${Math.round(num(raw))}</span><small>%</small>`
      : Math.abs(num(raw) % 1) > 0.001
        ? num(raw).toFixed(1)
        : String(Math.round(num(raw)))
    : '—';
  const glow = has
    ? `<defs><filter id="${fid}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`
    : '';
  const arc = has
    ? `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - prog)}" filter="url(#${fid})" style="filter:drop-shadow(0 0 6px ${color})"/>`
    : '';
  return `
    <div class="ath-whoop-dial">
      <div class="ath-whoop-dial-ring">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
          ${glow}
          <g transform="rotate(-90 ${c} ${c})">
            <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="#111113" stroke-width="${stroke}"/>
            ${arc}
          </g>
        </svg>
        <div class="ath-whoop-dial-val">${valHtml}</div>
      </div>
      <div class="ath-whoop-dial-lab">${esc(label)}</div>
    </div>`;
}

function longDateLabel(iso) {
  return parseDate(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function topBarHtml() {
  return `
    <header class="home-top">
      <div class="home-brand">
        <span class="home-mark" aria-hidden="true">TH</span>
        <div class="home-brand-text">
          <b>HYBRID</b>
          <small>Athlete</small>
        </div>
      </div>
      <div class="home-top-actions">
        <button type="button" class="month-btn" aria-label="Month">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h10M4 18h6"/></svg>
          <span>${esc(monthLabel(S.selectedDate))}</span>
        </button>
        <button type="button" class="today-btn" onclick="goToday()">Today</button>
        <button type="button" class="bell-btn" aria-label="Notifications">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a5 5 0 0 0-5 5v2.6c0 .8-.3 1.6-.8 2.2L4.5 15.5h15l-1.7-2.7a3.5 3.5 0 0 1-.8-2.2V8a5 5 0 0 0-5-5z"/><path d="M10 18a2 2 0 0 0 4 0"/></svg>
          <em class="bell-badge">${S.notifications || 0}</em>
        </button>
      </div>
    </header>`;
}

function gaugeRowHtml() {
  const c = dailyCheckin(S.selectedDate, false) || dailyCheckin(today(), false) || {};
  const m = metricsFromCheckin(c);
  return `
    <section class="ath-module-whoop" aria-label="WHOOP">
      <span class="ath-label">WHOOP</span>
      <div class="ath-whoop-wrap">
        <div class="ath-whoop-dials gauge-row">
          ${whoopDialSvg({ label: 'Sleep', value: m.sleepScore, max: 100, color: '#9db4c8', unit: '%', size: 104 })}
          ${whoopDialSvg({ label: 'Recovery', value: m.recovery, max: 100, color: '#16f26b', unit: '%', size: 104 })}
          ${whoopDialSvg({ label: 'Strain', value: m.strain, max: 21, color: '#1ba3ff', unit: '', size: 104 })}
        </div>
        ${todayCallHtml()}
      </div>
    </section>`;
}

function todayCallHtml() {
  const p = packet();
  return `
    <div class="today-call">
      <p class="eyebrow">${esc(p.label || 'Today')}</p>
      <p class="title">${esc(p.todayCall || 'Train with intent')}</p>
      <p class="meta">${esc(p.reason || 'Connect WHOOP under Me for live readiness.')}</p>
    </div>`;
}

function athleteRowHtml() {
  const items = S.published[S.selectedDate] || S.published[today()] || [];
  const first = items[0];
  const workout = first ? first.title : 'No session scheduled';
  return `
    <div class="ath-athlete">
      <div class="ath-avatar" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></svg>
      </div>
      <div>
        <p class="ath-name">Today</p>
        <p class="ath-workout">${esc(workout)}</p>
      </div>
    </div>`;
}

function calendarHtml() {
  const days = weekDays(S.selectedDate);
  return `
    <div class="cal-strip" role="tablist" aria-label="Published calendar">
      ${days
        .map((iso) => {
          const d = parseDate(iso);
          const published = S.published[iso] || [];
          const active = iso === S.selectedDate ? ' active' : '';
          const dots = published
            .map((p) => `<span class="cal-dot ${esc(p.type)}" title="${esc(p.title)}"></span>`)
            .join('');
          return `
            <button type="button" class="cal-day${active}" onclick="selectDate('${iso}')" aria-selected="${iso === S.selectedDate}">
              <b>${d.getDate()}</b>
              <div class="cal-dots">${dots}</div>
            </button>`;
        })
        .join('')}
    </div>`;
}

function publishedListHtml() {
  const items = S.published[S.selectedDate] || [];
  if (!items.length) {
    return `<p class="empty-day">Nothing scheduled for this day yet.</p>`;
  }
  return `
    <div class="published-list">
      ${items
        .map(
          (p) => `
        <button type="button" class="published-item" onclick="fabAction('session')">
          <span class="pub-dot ${esc(p.type)}" aria-hidden="true"></span>
          <div>
            <strong>${esc(p.title)}</strong>
            <small>${esc(p.type)}</small>
          </div>
          <span class="chev" aria-hidden="true">›</span>
        </button>`,
        )
        .join('')}
    </div>`;
}

function trainingHomeHtml() {
  const count = (S.published[S.selectedDate] || []).length;
  return `
    <div class="shell-screen shell-screen--oled">
      ${topBarHtml()}
      <div class="ath-date">${esc(longDateLabel(S.selectedDate))}</div>
      ${athleteRowHtml()}
      ${gaugeRowHtml()}
      ${calendarHtml()}
      <section class="home-brief">
        <div class="home-brief-header">
          <p class="eyebrow">Scheduled</p>
          ${count ? `<span class="home-pill">${count} session${count === 1 ? '' : 's'}</span>` : ''}
        </div>
        ${publishedListHtml()}
        <div class="home-cta">
          <button type="button" class="btn oled-cta create-session-btn" onclick="fabAction('session')">Create session</button>
        </div>
      </section>
    </div>
    <div id="whoopCard" class="hidden"></div>`;
}

function chatHtml() {
  return `
    <div class="page">
      <div class="eyebrow">Chat</div>
      <h1>Coach</h1>
      <div class="card">
        <div class="coach-log" id="coachLog">${(S.coachHistory || []).map((m) => `<div class="msg ${m.role}">${esc(m.content)}</div>`).join('')}</div>
        <div class="field"><textarea id="coachInput" rows="3" placeholder="Ask about today’s training…"></textarea></div>
        <button type="button" class="btn primary" style="width:100%" onclick="askCoach(false)">Send</button>
        <p class="stub" id="coachStatus"></p>
      </div>
    </div>`;
}

function libraryHtml() {
  return `
    <div class="page">
      <div class="eyebrow">Library</div>
      <h1>Programs</h1>
      <div class="card stub">Strength, conditioning, and recovery templates rebuild here.</div>
    </div>`;
}

function meHtml() {
  const w = S.settings.whoop || {};
  return `
    <div class="page">
      <div class="eyebrow">Me</div>
      <h1>Profile</h1>
      <div class="card">
        <p><b>WHOOP</b> · ${w.connected ? 'Connected' : 'Not connected'}</p>
        <p class="stub">${esc(w.email || 'Sign in below')}</p>
        <div id="whoopCard"></div>
      </div>
      <div class="card stub">Goals: ${S.goals.length ? S.goals.length : 'none yet'}</div>
    </div>`;
}

function setTab(tab) {
  S.tab = tab;
  S.fabOpen = false;
  save();
  render();
}

function selectDate(iso) {
  S.selectedDate = iso;
  save();
  render();
}

function goToday() {
  S.selectedDate = today();
  save();
  render();
}

function toggleFab(ev) {
  if (ev) ev.stopPropagation();
  S.fabOpen = !S.fabOpen;
  save();
  syncFab();
}

function closeFab() {
  S.fabOpen = false;
  save();
  syncFab();
}

function syncFab() {
  const layer = document.getElementById('fabLayer');
  if (!layer) return;
  const show = S.tab === 'home' || S.tab === 'training';
  layer.classList.toggle('hidden', !show);
  layer.classList.toggle('open', !!S.fabOpen);
}

function fabAction(kind) {
  S.fabOpen = false;
  save();
  syncFab();
  if (kind === 'goal') {
    const title = window.prompt('Goal title');
    if (title && title.trim()) {
      S.goals.push({ id: String(Date.now()), title: title.trim(), created: today() });
      save();
      render();
    }
    return;
  }
  if (kind === 'session') {
    window.alert('Create session — builder lands in the next slice.');
    return;
  }
  if (kind === 'coach') {
    openCoachSheet();
  }
}

function openCoachSheet() {
  const sheet = document.getElementById('coachSheet');
  if (!sheet) return;
  sheet.classList.remove('hidden');
  sheet.setAttribute('aria-hidden', 'false');
  renderCoachSheetLog();
}

function closeCoachSheet() {
  const sheet = document.getElementById('coachSheet');
  if (!sheet) return;
  sheet.classList.add('hidden');
  sheet.setAttribute('aria-hidden', 'true');
}

function renderCoachSheetLog() {
  const log = document.getElementById('coachSheetLog');
  if (!log) return;
  log.innerHTML = (S.coachHistory || [])
    .map((m) => `<div class="msg ${m.role}">${esc(m.content)}</div>`)
    .join('');
  log.scrollTop = log.scrollHeight;
}

function render() {
  const root = document.getElementById('app');
  const map = {
    home: trainingHomeHtml,
    training: trainingHomeHtml,
    chat: chatHtml,
    library: libraryHtml,
    me: meHtml,
    settings: meHtml,
  };
  root.innerHTML = (map[S.tab] || trainingHomeHtml)();

  document.querySelectorAll('[data-tab]').forEach((b) => {
    b.classList.toggle('active', b.dataset.tab === S.tab);
  });

  const chatBadge = document.getElementById('chatBadge');
  if (chatBadge) chatBadge.textContent = String(S.chatUnread || 0);

  syncFab();
  renderCoachSheetLog();

  if (window.Whoop) {
    Whoop.renderPanels();
    if (S.tab === 'home' || S.tab === 'training') Whoop.autoSyncIfPossible();
  }
}

async function askCoach(fromSheet) {
  const input = document.getElementById(fromSheet ? 'coachSheetInput' : 'coachInput');
  const status = document.getElementById(fromSheet ? 'coachSheetStatus' : 'coachStatus');
  const message = (input && input.value || '').trim();
  if (!message) return;
  if (!window.Whoop || !(await Whoop.token())) {
    if (status) status.textContent = 'Sign in under Me before using the coach.';
    return;
  }
  if (status) status.textContent = 'Thinking…';
  S.coachHistory = S.coachHistory || [];
  S.coachHistory.push({ role: 'user', content: message });
  input.value = '';
  render();
  renderCoachSheetLog();
  try {
    const res = await fetch('/.netlify/functions/brain-coach', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + (await Whoop.token()),
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        message,
        packet: HybridBrain.coachContextFromPacket(packet()),
        history: S.coachHistory.slice(-8),
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || 'Coach request failed');
    S.coachHistory.push({ role: 'assistant', content: body.reply || '(empty reply)' });
    if (status) status.textContent = '';
    S.chatUnread = Math.max(0, (S.chatUnread || 0) - 1);
  } catch (err) {
    if (status) status.textContent = err.message || 'Coach failed';
  }
  save();
  render();
  renderCoachSheetLog();
}

window.S = S;
window.save = save;
window.today = today;
window.dailyCheckin = dailyCheckin;
window.readinessScore = readinessScore;
window.touchRecord = function () {};
window.num = num;
window.setTab = setTab;
window.selectDate = selectDate;
window.goToday = goToday;
window.toggleFab = toggleFab;
window.closeFab = closeFab;
window.fabAction = fabAction;
window.openCoachSheet = openCoachSheet;
window.closeCoachSheet = closeCoachSheet;
window.askCoach = askCoach;
window.render = render;

document.addEventListener('DOMContentLoaded', () => {
  render();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').catch(() => {});
}
