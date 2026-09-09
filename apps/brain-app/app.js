const BRAIN_BUILD = 'THE-brain-v1';
const STORAGE_KEY = 'THE-brain-v1';

const defaultState = () => ({
  build: BRAIN_BUILD,
  tab: 'home',
  selectedDate: today(),
  checkin: {},
  settings: { whoop: { connected: false, lastSyncAt: null, email: null } },
  coachHistory: [],
  published: seedPublished(),
  goals: [],
  fabOpen: false,
  notifications: 5,
  chatUnread: 14,
});

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

function gaugeHtml(label, cls, value, suffix, max) {
  const pct = value != null && max ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const display = value != null && value !== '' ? `${value}${suffix || ''}` : '—';
  return `
    <div class="gauge ${cls}">
      <div class="gauge-ring" style="--pct:${pct}">
        <div><b>${esc(display)}</b></div>
      </div>
      <label>${esc(label)}</label>
    </div>`;
}

function topBarHtml() {
  return `
    <header class="topbar">
      <button type="button" class="brand-btn" aria-label="Brand">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="#888" stroke-width="1"/><path d="M8 12h8M12 8v8" stroke="#ccc" stroke-width="1.2"/></svg>
        </span>
        <span class="chev" aria-hidden="true"></span>
      </button>
      <button type="button" class="month-btn" aria-label="Month">
        <span class="filter-icon" aria-hidden="true"><i></i><i></i><i></i></span>
        <span>${esc(monthLabel(S.selectedDate))}</span>
        <span class="chev" aria-hidden="true"></span>
      </button>
      <div class="topbar-actions">
        <button type="button" class="today-btn" onclick="goToday()">TODAY</button>
        <button type="button" class="bell-btn" aria-label="Notifications">
          <svg viewBox="0 0 24 24"><path d="M12 3a5 5 0 0 0-5 5v2.6c0 .8-.3 1.6-.8 2.2L4.5 15.5h15l-1.7-2.7a3.5 3.5 0 0 1-.8-2.2V8a5 5 0 0 0-5-5z"/><path d="M10 18a2 2 0 0 0 4 0"/></svg>
          <em class="bell-badge">${S.notifications || 0}</em>
        </button>
      </div>
    </header>`;
}

function gaugeRowHtml() {
  const c = dailyCheckin(S.selectedDate, false) || dailyCheckin(today(), false) || {};
  const m = metricsFromCheckin(c);
  return `
    <section class="gauge-row" aria-label="WHOOP">
      ${gaugeHtml('Recovery', 'recovery', m.recovery, '%', 100)}
      ${gaugeHtml('Strain', 'strain', m.strain, '', 21)}
      ${gaugeHtml('Sleep', 'sleep', m.sleepScore, '%', 100)}
    </section>`;
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
    return `<p class="empty-day">Nothing published for this day yet.</p>`;
  }
  return `
    <div class="published-list">
      ${items
        .map(
          (p) => `
        <div class="published-item">
          <span class="pub-dot ${esc(p.type)}"></span>
          <div>
            <strong>${esc(p.title)}</strong>
            <small>${esc(p.type)}</small>
          </div>
        </div>`,
        )
        .join('')}
    </div>`;
}

function trainingHomeHtml() {
  return `
    ${topBarHtml()}
    ${gaugeRowHtml()}
    ${calendarHtml()}
    <section class="home-body">
      ${publishedListHtml()}
      <button type="button" class="create-session-btn" onclick="fabAction('session')">Create Session</button>
    </section>
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
