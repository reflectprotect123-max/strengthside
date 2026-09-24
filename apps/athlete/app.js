const BRAIN_BUILD = 'THE-hybrid-engine-v1';
const STORAGE_KEY = 'THE-hybrid-engine-v1';
const APP_BUILD = 'engine-apk-1.0.5';

let otaInfo = { status: '', current: '', next: '', latest: '' };

const defaultState = () => ({
  build: BRAIN_BUILD,
  tab: 'home',
  selectedDate: today(),
  checkin: {},
  settings: { whoop: { connected: false, lastSyncAt: null, email: null } },
  published: {},
  goals: [],
  fabOpen: false,
  session: null,
  timer: null,
  loggerOpen: false,
  library: null,
  sessions: {},
  engineAnchors: {},
  zoneDay: {},
  planSync: { acks: { template: {}, session: {} }, snapshotRev: 0, lastPlan: null },
  libUi: { screen: 'list', tid: null, tab: 'exercises', q: '', selected: [], draft: {}, date: '', bid: null },
  notifications: 0,
  chatUnread: 0,
});

function resetBlankSlate(keepAuth = true) {
  const whoop = keepAuth && S.settings?.whoop
    ? { ...S.settings.whoop }
    : { connected: false, lastSyncAt: null, email: null };
  S.published = {};
  S.goals = [];
  S.checkin = {};
  S.zoneDay = {};
  S.notifications = 0;
  S.chatUnread = 0;
  S.fabOpen = false;
  S.session = null;
  S.timer = null;
  S.loggerOpen = false;
  S.libUi = { screen: 'list', tid: null, tab: 'exercises', q: '', selected: [], draft: {}, date: '', bid: null };
  S.selectedDate = today();
  S.settings = { whoop };
  save();
}

let S = load();
if (window.HybridIntegrations) HybridIntegrations.mergeIntoState(S);
refreshHybridOccupancy();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.build !== BRAIN_BUILD) return defaultState();
    return {
      ...defaultState(),
      ...parsed,
      published: parsed.published || {},
      settings: { ...defaultState().settings, ...parsed.settings },
    };
  } catch {
    return defaultState();
  }
}

function refreshHybridOccupancy() {
  if (!window.HybridSc) return;
  HybridSc.applyOccupancyToState(S, HybridSc.datesFromState(S));
}

function save() {
  if (S.session && S.session.date) {
    S.sessions = S.sessions || {};
    S.sessions[S.session.date] = S.session;
  }
  if (S.session && S.session.engineAnchors) {
    S.engineAnchors = Object.assign({}, S.engineAnchors || {}, S.session.engineAnchors);
  }
  refreshHybridOccupancy();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(S));
  window.S = S;
  if (window.PlanSync && typeof PlanSync.schedulePush === 'function') PlanSync.schedulePush();
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

/** WHOOP recovery zones — green ≥67, yellow 34–66, red ≤33 (brand guidelines). */
function whoopRecoveryColor(recovery) {
  const v = num(recovery);
  if (!v) return '#16ec06';
  if (v >= 67) return '#16ec06';
  if (v >= 34) return '#ffde00';
  return '#ff0026';
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
        <div class="home-brand-text" aria-label="The Engine">
          ${HybridSc.brandHtml()}
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
          ${whoopDialSvg({ label: 'Recovery', value: m.recovery, max: 100, color: whoopRecoveryColor(m.recovery), unit: '%', size: 104 })}
          ${whoopDialSvg({ label: 'Strain', value: m.strain, max: 21, color: '#1ba3ff', unit: '', size: 104 })}
        </div>
      </div>
    </section>
    ${zonesCardHtml(c)}`;
}

function zoneProfile() {
  const z = S.settings?.zones || {};
  const c = dailyCheckin(S.selectedDate, false) || dailyCheckin(today(), false) || {};
  return {
    hrMax: num(z.hrMax) || 190,
    rhr28: num(z.rhr28) || num(c.restingHr) || 60,
    bgBase: num(z.bgBase) || 138,
    grBase: num(z.grBase) || 170.5,
  };
}

function zonesCardHtml(checkin) {
  if (!globalThis.HybridBrainKernel || typeof HybridBrainKernel.dailyZones !== 'function') return '';
  const profile = zoneProfile();
  const recovery = metricsFromCheckin(checkin || {}).recovery;
  const connected = !!S.settings?.whoop?.connected;
  const freshness = connected && recovery != null ? 'current' : 'missing';
  const zones = HybridBrainKernel.dailyZones({
    recovery,
    freshness,
    hrMax: profile.hrMax,
    rhr28: profile.rhr28,
    bgBase: profile.bgBase,
    grBase: profile.grBase,
  });
  const blue = Math.round(zones.bgToday);
  const green = Math.round(zones.grToday);
  const day = zoneDayFor(S.selectedDate || today());
  const note = freshness === 'current' ? '' : ' · no WHOOP adjustment today';
  return `
    <section class="ath-zones" aria-label="Heart rate zones">
      <span class="ath-label">Today's zones</span>
      <div class="zone-cutoffs" aria-label="Zone cutoffs">
        <span class="zone-cut zone-cut--blue"><em>Blue</em> <strong>${blue}</strong></span>
        <span class="zone-cut zone-cut--green"><em>Green</em> <strong>${green}</strong></span>
      </div>
      <div class="zone-morph">
        <div class="zone-morph-head">
          <span>Chart</span>
          <span class="zone-morph-range">${zoneChartRangeLabel(day)}</span>
        </div>
        ${zoneChartHtml(day, blue, green, profile.hrMax)}
        <div class="zone-morph-head zone-morph-head--zones">
          <span>Time in zones</span>
        </div>
        ${zoneTimeBarsHtml(day)}
      </div>
      <p class="ath-zone-est">Estimated from baseline${note}</p>
    </section>`;
}

function zoneDayFor(iso) {
  const raw = (S.zoneDay && S.zoneDay[iso]) || {};
  const samples = Array.isArray(raw.samples) ? raw.samples : [];
  return {
    blue: Math.max(0, Math.round(num(raw.blue) || 0)),
    green: Math.max(0, Math.round(num(raw.green) || 0)),
    red: Math.max(0, Math.round(num(raw.red) || 0)),
    samples,
  };
}

function formatZoneHms(sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function zoneChartRangeLabel(day) {
  const samples = day.samples || [];
  if (samples.length < 2) return 'Range: —';
  const spanMs = Math.max(0, Number(samples[samples.length - 1].t) - Number(samples[0].t));
  const mins = Math.max(1, Math.round(spanMs / 60000));
  return `Range: ${mins} min`;
}

function zoneToneForHr(hr, blue, green) {
  if (hr < blue) return 'blue';
  if (hr < green) return 'green';
  return 'red';
}

function zoneChartHtml(day, blue, green, hrMax) {
  const samples = day.samples || [];
  const maxHr = Math.max(200, Number(hrMax) || 190);
  const yMarks = [125, 150, 175, 200].filter((v) => v <= maxHr + 10);
  const w = 320;
  const h = 120;
  const padL = 28;
  const padR = 8;
  const padT = 8;
  const padB = 18;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const yAt = (bpm) => padT + plotH * (1 - athClamp(bpm / maxHr, 0, 1));
  const grid = yMarks
    .map((bpm) => {
      const y = yAt(bpm);
      return `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${w - padR}" y2="${y.toFixed(1)}" class="zone-chart-grid"/>
        <text x="${padL - 4}" y="${(y + 3).toFixed(1)}" text-anchor="end" class="zone-chart-ylab">${bpm}</text>`;
    })
    .join('');
  let bars = '';
  if (samples.length) {
    const t0 = Number(samples[0].t);
    const t1 = Number(samples[samples.length - 1].t);
    const span = Math.max(1, t1 - t0);
    const step = Math.max(1, Math.floor(samples.length / 72));
    const barW = Math.max(1.5, plotW / Math.ceil(samples.length / step) - 1.2);
    for (let i = 0; i < samples.length; i += step) {
      const s = samples[i];
      const hr = Number(s.hr);
      if (!Number.isFinite(hr)) continue;
      const x = padL + ((Number(s.t) - t0) / span) * plotW;
      const y = yAt(hr);
      const tone = zoneToneForHr(hr, blue, green);
      bars += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(2, padT + plotH - y).toFixed(1)}" class="zone-chart-bar zone-chart-bar--${tone}"/>`;
    }
  } else {
    bars = `<text x="${padL + plotW / 2}" y="${padT + plotH / 2}" text-anchor="middle" class="zone-chart-empty">Train to fill</text>`;
  }
  const xLabels = samples.length >= 2
    ? (() => {
        const t0 = Number(samples[0].t);
        const t1 = Number(samples[samples.length - 1].t);
        const mid = t0 + (t1 - t0) / 2;
        const fmt = (t) => {
          const sec = Math.max(0, Math.round((t - t0) / 1000));
          const m = Math.floor(sec / 60);
          const r = sec % 60;
          return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
        };
        return `<text x="${padL}" y="${h - 4}" class="zone-chart-xlab">${fmt(t0)}</text>
          <text x="${padL + plotW / 2}" y="${h - 4}" text-anchor="middle" class="zone-chart-xlab">${fmt(mid)}</text>
          <text x="${w - padR}" y="${h - 4}" text-anchor="end" class="zone-chart-xlab">${fmt(t1)}</text>`;
      })()
    : `<text x="${padL}" y="${h - 4}" class="zone-chart-xlab">00:00</text>
      <text x="${w - padR}" y="${h - 4}" text-anchor="end" class="zone-chart-xlab">—</text>`;
  return `<svg class="zone-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Heart rate chart">${grid}${bars}${xLabels}</svg>`;
}

function zoneTimeBarsHtml(day) {
  const rows = [
    { key: 'blue', label: 'Blue', sec: day.blue, tone: 'blue' },
    { key: 'green', label: 'Green', sec: day.green, tone: 'green' },
    { key: 'red', label: 'Red', sec: day.red, tone: 'red' },
  ];
  const maxSec = Math.max(10 * 60, ...rows.map((r) => r.sec));
  const scaleMarks = [10, 20, 30, 40, 50]
    .filter((m) => m * 60 <= maxSec * 1.05 || m === 10)
    .slice(0, 5);
  const scaleMax = Math.max(maxSec, (scaleMarks[scaleMarks.length - 1] || 10) * 60);
  const rowsHtml = rows
    .map((r) => {
      const pct = athClamp((r.sec / scaleMax) * 100, 0, 100);
      return `
        <div class="zone-time-row" data-tone="${r.tone}">
          <div class="zone-time-meta">
            <span class="zone-time-name">${r.label}</span>
            <span class="zone-time-clock">${formatZoneHms(r.sec)}</span>
          </div>
          <div class="zone-time-track" aria-hidden="true">
            <i class="zone-time-fill" style="width:${pct.toFixed(1)}%"></i>
          </div>
        </div>`;
    })
    .join('');
  const scaleHtml = scaleMarks
    .map((m) => `<span>${String(m).padStart(2, '0')}:00</span>`)
    .join('');
  return `
    <div class="zone-time-list">
      ${rowsHtml}
      <div class="zone-time-scale" aria-hidden="true">${scaleHtml}</div>
    </div>`;
}

/** Accrue live HR into today's zone chart + time-in-zone totals (1 Hz from logger). */
function recordZoneSample(hr, atMs) {
  const bpm = Math.round(Number(hr));
  if (!Number.isFinite(bpm) || bpm < 35 || bpm > 230) return;
  const iso = (S.session && S.session.date) || S.selectedDate || today();
  const profile = zoneProfile();
  const checkin = dailyCheckin(iso, false) || {};
  const recovery = metricsFromCheckin(checkin).recovery;
  const connected = !!S.settings?.whoop?.connected;
  const freshness = connected && recovery != null ? 'current' : 'missing';
  let blue = profile.bgBase;
  let green = profile.grBase;
  if (globalThis.HybridBrainKernel && typeof HybridBrainKernel.dailyZones === 'function') {
    const z = HybridBrainKernel.dailyZones({
      recovery,
      freshness,
      hrMax: profile.hrMax,
      rhr28: profile.rhr28,
      bgBase: profile.bgBase,
      grBase: profile.grBase,
    });
    blue = z.bgToday;
    green = z.grToday;
  }
  S.zoneDay = S.zoneDay || {};
  const day = S.zoneDay[iso] || { blue: 0, green: 0, red: 0, samples: [] };
  const tone = zoneToneForHr(bpm, blue, green);
  day[tone] = Math.max(0, Math.round(num(day[tone]) || 0) + 1);
  const samples = Array.isArray(day.samples) ? day.samples.slice() : [];
  const t = Number(atMs) || Date.now();
  const last = samples[samples.length - 1];
  if (!last || t - Number(last.t) >= 900) {
    samples.push({ t, hr: bpm });
    if (samples.length > 2400) samples.splice(0, samples.length - 2400);
  } else {
    last.hr = bpm;
    last.t = t;
  }
  day.samples = samples;
  S.zoneDay[iso] = day;
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
          const active = iso === S.selectedDate ? ' active' : '';
          const dots = HybridSc.dotsHtml(iso, S.hybridOccupancy);
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
      ${calendarHtml()}
      ${athleteRowHtml()}
      ${gaugeRowHtml()}
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
    </div>`;
}

const homeHtml = trainingHomeHtml;

function trainingPlanForDate(iso) {
  if (window.HybridLibrary) {
    S.library = HybridLibrary.ensure(S.library);
    const fromLib = HybridLibrary.planForDate(S.library, iso, null);
    if (fromLib) return fromLib;
  }
  if (S.trainingPlans && S.trainingPlans[iso]) return S.trainingPlans[iso];
  return null;
}

function trainingTopBarHtml() {
  const badge = S.notifications || 7;
  return `
    <header class="trn-top">
      <div class="trn-top-left">
        <img class="trn-logo" src="assets/hpp-logo.jpg" width="36" height="36" alt="Hybrid Power Project">
        <button type="button" class="trn-icon-btn" aria-label="Program menu">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2"/></svg>
        </button>
        <button type="button" class="trn-icon-btn" aria-label="Filter">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M6 12h12M9 17h6" fill="none" stroke="currentColor" stroke-width="2"/></svg>
        </button>
      </div>
      <div class="trn-top-right">
        <button type="button" class="trn-month" aria-label="Month">
          <span>${esc(monthLabel(S.selectedDate))}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2"/></svg>
        </button>
        <button type="button" class="today-btn trn-today" onclick="goToday()">Today</button>
        <button type="button" class="bell-btn trn-bell" aria-label="Notifications">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a5 5 0 0 0-5 5v2.6c0 .8-.3 1.6-.8 2.2L4.5 15.5h15l-1.7-2.7a3.5 3.5 0 0 1-.8-2.2V8a5 5 0 0 0-5-5z"/><path d="M10 18a2 2 0 0 0 4 0"/></svg>
          ${badge ? `<em class="bell-badge trn-bell-badge">${badge}</em>` : ''}
        </button>
      </div>
    </header>`;
}

function trainingCalendarHtml() {
  const days = weekDays(S.selectedDate);
  return `
    <div class="cal-strip cal-strip--training" role="tablist" aria-label="Training calendar">
      ${days
        .map((iso) => {
          const d = parseDate(iso);
          const active = iso === S.selectedDate ? ' active' : '';
          const dots = HybridSc.dotsHtml(iso, S.hybridOccupancy);
          return `
            <button type="button" class="cal-day${active}" onclick="selectDate('${iso}')" aria-selected="${iso === S.selectedDate}">
              <b>${d.getDate()}</b>
              <div class="cal-dots">${dots}</div>
            </button>`;
        })
        .join('')}
    </div>`;
}

function trnWarmupHtml(block) {
  const items = (block.items || [])
    .map((item) => {
      const note = item.note
        ? `<p class="trn-note"><em>*${esc(item.note)}</em></p>`
        : '';
      return `<li><span class="trn-num">${item.n}</span><span class="trn-item-text">${esc(item.text)}${note}</span></li>`;
    })
    .join('');
  return `
    <article class="trn-block trn-block--warmup" onclick="startTrainingSession('${esc(block.letter)}')">
      <div class="trn-block-head">
        <span class="trn-letter">${esc(block.letter)}</span>
        <h2 class="trn-block-title">${esc(block.title)}</h2>
      </div>
      <ol class="trn-warmup-list">${items}</ol>
      ${block.footer ? `<button type="button" class="trn-link">${esc(block.footer)}</button>` : ''}
    </article>`;
}

function trnSectionHtml(block) {
  const badge = block.badge
    ? `<span class="trn-section-badge"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8l1 3 3 1v6l-3 1-1 3H8l-1-3-3-1V8l3-1 1-3z"/></svg>${esc(block.badge.text)}</span>`
    : '';
  return `
    <div class="trn-section">
      <span class="trn-section-label">${esc(block.label)}</span>
      ${badge}
    </div>`;
}

function trnEngineHtml(block) {
  return `
    <article class="trn-block trn-block--engine" onclick="startTrainingSession('${esc(block.letter)}')">
      <span class="trn-letter trn-letter--engine">${esc(block.letter)}</span>
      <div class="trn-lift-body">
        <p class="trn-engine-kicker">The Engine</p>
        <h3 class="trn-lift-title">${esc(block.title)}</h3>
        <p class="trn-lift-rx">${esc(block.prescription)}</p>
      </div>
    </article>`;
}

function trnRecoveryHtml(block) {
  const bullets = (block.bullets || []).map((b) => `<li>${esc(b)}</li>`).join('');
  return `
    <article class="trn-block trn-block--recovery" onclick="startTrainingSession('${esc(block.letter)}')">
      <div class="trn-block-head">
        <span class="trn-letter">${esc(block.letter)}</span>
        <h2 class="trn-block-title">${esc(block.title)}</h2>
      </div>
      <ul class="trn-recovery-list">${bullets}</ul>
      ${block.note ? `<p class="trn-note"><em>*${esc(block.note)}</em></p>` : ''}
      ${block.goal ? `<p class="trn-recovery-goal">${esc(block.goal)}</p>` : ''}
      ${block.footer ? `<button type="button" class="trn-link">${esc(block.footer)}</button>` : ''}
    </article>`;
}

function trainingBlocksHtml(iso) {
  const plan = trainingPlanForDate(iso);
  if (!plan || !plan.blocks || !plan.blocks.length) {
    return `<p class="trn-empty">Nothing scheduled for this day yet.</p>
    <button type="button" class="trn-add-exercise" onclick="openLibraryForDay()">
      <span class="trn-add-icon" aria-hidden="true">+</span>
      <span>Add Engine session</span>
    </button>`;
  }
  const head = plan.title
    ? `<div class="trn-session-name">${esc(plan.title)}</div>`
    : '';
  const body = plan.blocks
    .map((block, i) => {
      if (block.kind === 'warmup') return trnWarmupHtml(block);
      if (block.kind === 'section') return trnSectionHtml(block);
      if (block.kind === 'engine') return trnEngineHtml(block);
      if (block.kind === 'recovery') return trnRecoveryHtml(block);
      return '';
    })
    .join('');
  return `
    ${head}
    ${body}
    <button type="button" class="trn-add-exercise" onclick="openLibraryForDay()">
      <span class="trn-add-icon" aria-hidden="true">+</span>
      <span>Add Engine session</span>
    </button>`;
}

function trainingTabHtml() {
  return `
    <div class="shell-screen shell-screen--training">
      ${trainingTopBarHtml()}
      ${trainingCalendarHtml()}
      <div class="trn-scroll">${trainingBlocksHtml(S.selectedDate)}
        <div class="trn-start-bar">
          <button type="button" class="log-primary" onclick="startTrainingSession()">Start Session</button>
        </div>
      </div>
    </div>`;
}

function startTrainingSession(letter) {
  if (window.Logger) Logger.open({ date: S.selectedDate, letter, plan: trainingPlanForDate(S.selectedDate) });
}

function libraryHtml() {
  if (window.LibraryView) return LibraryView.html();
  return `<div class="page"><h1>Library</h1></div>`;
}

function openLibraryForDay() {
  S.tab = 'library';
  S.library = window.HybridLibrary ? HybridLibrary.ensure(S.library) : S.library;
  const tid = S.library && S.library.assignments && S.library.assignments[S.selectedDate];
  if (tid && window.LibraryView) LibraryView.open(tid);
  else if (window.LibraryView) LibraryView.createEngine();
  else render();
}

function meAppSectionHtml() {
  const otaLine = otaInfo.current ? `Channel ${esc(otaInfo.current)}` : `Build ${esc(APP_BUILD)}`;
  return `
    ${otaBannerHtml()}
    <div class="card account-compact">
      <div class="eyebrow">App</div>
      <p class="stub">${otaLine} · ${esc(APP_BUILD)}</p>
      <div class="account-actions">
        <button type="button" class="btn" onclick="lookForAppUpdate()">Look for app update</button>
      </div>
    </div>`;
}

function otaBannerHtml() {
  const s = otaInfo && otaInfo.status;
  if (s !== 'ready' && s !== 'available') return '';
  const ver = esc(otaInfo.next || otaInfo.latest || '');
  if (s === 'ready') {
    return `
      <div class="ota-banner" id="otaBanner" role="status">
        <div class="ota-copy">
          <div class="ota-kicker">App update</div>
          <div class="ota-title">Version ${ver} is ready</div>
          <div class="ota-meta">Restart to load it. Workouts stay on this phone.</div>
        </div>
        <button type="button" class="btn oled-cta" onclick="applyOtaUpdate()">Restart now</button>
      </div>`;
  }
  return `
    <div class="ota-banner ota-wait" id="otaBanner" role="status">
      <div class="ota-copy">
        <div class="ota-kicker">App update</div>
        <div class="ota-title">Version ${ver} is downloading</div>
        <div class="ota-meta">Restart now appears when the file is on the phone.</div>
      </div>
    </div>`;
}

async function refreshOtaStatus(force) {
  if (!window.NativeBridge || typeof NativeBridge.probeLiveUpdate !== 'function') return;
  try {
    otaInfo = (await NativeBridge.probeLiveUpdate(force ? { refresh: true } : {})) || otaInfo;
  } catch (_) {
    return;
  }
  if (S.tab === 'me') render();
}

async function applyOtaUpdate() {
  if (!window.NativeBridge || typeof NativeBridge.applyLiveUpdate !== 'function') return;
  const r = await NativeBridge.applyLiveUpdate();
  if (r === 'error' || r === 'unavailable') {
    window.alert('Could not restart into the update. Close the app fully and open it again.');
  }
}

async function lookForAppUpdate() {
  await refreshOtaStatus(true);
  if (otaInfo.status === 'ready' || otaInfo.status === 'available') {
    if (S.tab === 'me') render();
    return;
  }
  if (otaInfo.status === 'browser') {
    window.alert('App updates run on the phone install — not in the browser.');
    return;
  }
  window.alert(`You're on ${otaInfo.current || APP_BUILD}. No new version is ready.`);
}

function meHtml() {
  const w = S.settings.whoop || {};
  if (w.email) {
    return `
      <div class="page">
        <div class="eyebrow">Me</div>
        <h1>Profile</h1>
        ${meAppSectionHtml()}
        <div class="card account-compact">
          <p class="account-email">${esc(w.email)}</p>
          <p class="stub">WHOOP · ${w.connected ? 'Connected' : 'Not linked yet'} · ${esc(APP_BUILD)}</p>
          ${window.Whoop && typeof Whoop.uiMessage === 'function' && Whoop.uiMessage()
            ? `<p class="stub signin-msg">${esc(Whoop.uiMessage())}</p>`
            : ''}
          <div class="account-actions">
            ${w.connected
              ? '<button type="button" class="btn" onclick="Whoop.syncAll()">Sync WHOOP</button>'
              : '<button type="button" class="btn" onclick="Whoop.connect()">Connect WHOOP</button>'}
            <button type="button" class="btn" onclick="Whoop.signOut()">Sign out</button>
          </div>
        </div>
      </div>`;
  }
  return `
    <div class="page page-signin">
      <div class="eyebrow">Account</div>
      <h1>Sign in</h1>
      ${meAppSectionHtml()}
      <p class="stub page-lead">One email and password for The Engine. After sign-in you land on a blank conditioning slate.</p>
      <div id="whoopCard"></div>
    </div>`;
}

function setTab(tab) {
  S.tab = tab === 'chat' ? 'home' : tab;
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
  const show = !S.loggerOpen;
  layer.classList.toggle('hidden', !show);
  layer.classList.toggle('open', !!S.fabOpen);
  layer.classList.toggle('fab-layer--training', S.tab === 'training');
}

function render() {
  const root = document.getElementById('app');
  if (!root) return;
  const map = {
    home: homeHtml,
    training: trainingTabHtml,
    library: libraryHtml,
    me: meHtml,
    settings: meHtml,
  };
  if (S.tab === 'chat') S.tab = 'home';
  root.innerHTML = (map[S.tab] || homeHtml)();
  document.querySelectorAll('[data-tab]').forEach((b) => {
    b.classList.toggle('active', b.dataset.tab === S.tab);
  });
  const shell = document.getElementById('shell');
  if (shell) shell.classList.toggle('shell--training', S.tab === 'training');
  syncFab();
  if (window.Logger && S.loggerOpen) Logger.paint();
  if (window.Whoop) {
    if (S.tab === 'me' && !(S.settings.whoop && S.settings.whoop.email)) Whoop.renderPanels();
    if (S.tab === 'home' || S.tab === 'training') Whoop.autoSyncIfPossible();
  }
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
    S.tab = 'library';
    if (window.LibraryView) LibraryView.createEngine();
    else render();
  }
}


window.S = S;
window.save = save;
window.today = today;
window.dailyCheckin = dailyCheckin;
window.recordZoneSample = recordZoneSample;
window.touchRecord = function () {
  if (window.PlanSync) PlanSync.schedulePush();
};
window.num = num;
window.resetBlankSlate = resetBlankSlate;
window.setTab = setTab;
window.selectDate = selectDate;
window.goToday = goToday;
window.toggleFab = toggleFab;
window.closeFab = closeFab;
window.fabAction = fabAction;
window.applyOtaUpdate = applyOtaUpdate;
window.lookForAppUpdate = lookForAppUpdate;
window.startTrainingSession = startTrainingSession;
window.trainingPlanForDate = trainingPlanForDate;
window.openLibraryForDay = openLibraryForDay;
window.render = render;

document.addEventListener('DOMContentLoaded', async () => {
  if (window.NativeBridge && typeof NativeBridge.onLiveUpdateStatus === 'function') {
    NativeBridge.onLiveUpdateStatus((info) => {
      otaInfo = info || otaInfo;
      if (S.tab === 'me') render();
    });
  }
  if (window.HybridIntegrations) {
    HybridIntegrations.bindForegroundSync();
    try { await HybridIntegrations.bootSync(); } catch (_) { /* offline */ }
    if (window.HybridIntegrations.mergeIntoState) HybridIntegrations.mergeIntoState(S);
  }
  refreshHybridOccupancy();
  await refreshOtaStatus(false);
  render();
});

if ('serviceWorker' in navigator && !/\/functions\/v1\//.test(location.pathname || '')) {
  navigator.serviceWorker.register('./service-worker.js').catch(() => {});
}
