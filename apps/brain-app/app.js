const BRAIN_BUILD = 'THE-brain-v1';
const STORAGE_KEY = 'THE-brain-v1';
const CACHE = 'the-brain-v1';

const defaultState = () => ({
  build: BRAIN_BUILD,
  room: 'engine',
  tab: 'home',
  checkin: {},
  settings: { whoop: { connected: false, lastSyncAt: null, email: null } },
  coachHistory: [],
});

let S = load();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.build !== BRAIN_BUILD) return defaultState();
    return { ...defaultState(), ...parsed, settings: { ...defaultState().settings, ...parsed.settings } };
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
  const c = S.checkin[today()] || {};
  return HybridBrain.buildBrainPacket({
    date: today(),
    room: S.room,
    metrics: metricsFromCheckin(c),
    checkin: checkinSlice(c),
    connected: { whoop: !!S.settings.whoop.connected, concept2: false },
  });
}

function dailyCheckin(date = today(), create = true) {
  S.checkin = S.checkin || {};
  if (!S.checkin[date] && create) {
    S.checkin[date] = { date, whoopRecovery: '', whoopStrain: '', hrv: '', restingHr: '', whoopSleepPerformance: '' };
  }
  return S.checkin[date];
}

function readinessScore(c) {
  return HybridBrain.scoreReadiness(metricsFromCheckin(c), checkinSlice(c));
}

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function setRoom(room) {
  S.room = room;
  document.body.className = 'room-' + room;
  save();
  render();
}

function setTab(tab) {
  S.tab = tab;
  save();
  render();
}

function homeHtml() {
  const p = packet();
  const c = dailyCheckin(today(), false) || {};
  const rec = p.metrics.recovery;
  const strain = p.metrics.strain;
  const sleep = p.metrics.sleepScore;
  return `
    <div class="eyebrow">The Brain</div>
    <h1>Today</h1>
    <div class="rooms">
      <button class="room ${S.room === 'strength' ? 'active' : ''}" onclick="setRoom('strength')">Strength</button>
      <button class="room ${S.room === 'engine' ? 'active' : ''}" onclick="setRoom('engine')">Engine</button>
      <button class="room ${S.room === 'nutrition' ? 'active' : ''}" onclick="setRoom('nutrition')">Nutrition</button>
    </div>
    <div class="card">
      <div class="row"><strong>Today’s call</strong><span class="pill ${p.todayCall}">${esc(p.label)}</span></div>
      <p class="stub" style="margin:8px 0 0">Main limiter: ${esc(p.reason)} · Room: ${esc(S.room)}</p>
    </div>
    <div class="card dials">
      <div class="dial"><small>Recovery</small><b>${rec ? rec + '%' : '—'}</b></div>
      <div class="dial"><small>Strain</small><b>${strain ? strain : '—'}</b></div>
      <div class="dial"><small>Sleep</small><b>${sleep ? sleep + '%' : '—'}</b></div>
    </div>
    <div class="card" id="whoopCard"></div>
    <div class="card">
      <div class="eyebrow">Coach</div>
      <div class="coach-log" id="coachLog">${(S.coachHistory || []).map((m) => `<div class="msg ${m.role}">${esc(m.content)}</div>`).join('')}</div>
      <div class="field"><textarea id="coachInput" rows="2" placeholder="Ask about today’s training…"></textarea></div>
      <button class="btn primary block" onclick="askCoach()">Ask coach</button>
      <p class="stub" id="coachStatus" style="margin-top:8px"></p>
    </div>`;
}

function settingsHtml() {
  const w = S.settings.whoop || {};
  return `
    <div class="eyebrow">Settings</div>
    <h1>Connections</h1>
    <div class="card">
      <p><b>WHOOP</b> · ${w.connected ? 'Connected' : 'Not connected'}</p>
      <p class="stub">${esc(w.email || 'Sign in below')}</p>
      <div id="whoopSettings"><div id="whoopCard"></div></div>
    </div>
    <div class="card stub">Strength / Engine / Nutrition rooms rebuild screen-by-screen from here.</div>`;
}

function coachHtml() {
  return homeHtml();
}

function render() {
  document.body.className = 'room-' + S.room;
  const root = document.getElementById('app');
  const map = { home: homeHtml, settings: settingsHtml, coach: coachHtml };
  root.innerHTML = (map[S.tab] || homeHtml)();
  document.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('active', b.dataset.tab === S.tab));
  if (window.Whoop) {
    Whoop.renderPanels();
    if (S.tab === 'home') Whoop.autoSyncIfPossible();
  }
}

async function askCoach() {
  const input = document.getElementById('coachInput');
  const status = document.getElementById('coachStatus');
  const message = (input && input.value || '').trim();
  if (!message) return;
  if (!window.Whoop || !(await Whoop.token())) {
    status.textContent = 'Sign in under Settings before using the coach.';
    return;
  }
  status.textContent = 'Thinking…';
  S.coachHistory = S.coachHistory || [];
  S.coachHistory.push({ role: 'user', content: message });
  input.value = '';
  render();
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
    status.textContent = '';
  } catch (err) {
    status.textContent = err.message || 'Coach failed';
  }
  save();
  render();
}

// WHOOP connector shims
window.S = S;
window.save = save;
window.today = today;
window.dailyCheckin = dailyCheckin;
window.readinessScore = readinessScore;
window.touchRecord = function () {};
window.num = num;

window.setRoom = setRoom;
window.setTab = setTab;
window.askCoach = askCoach;
window.render = render;

document.addEventListener('DOMContentLoaded', () => {
  document.body.className = 'room-' + S.room;
  render();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').catch(() => {});
}
