(function (root) {
  const QUOTE = 'You can’t do in a race what you haven’t prepared for.';
  const COACH = 'Train with intent. Log every set. Leave the gym already recovering. Rest as prescribed — the clock comes next.';

  let pad = null;
  let toast = '';
  let toastTimer = 0;
  let clockTimer = 0;
  let lastBeep = '';

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function session() {
    return root.S && root.S.session;
  }

  function persist(next) {
    const previous=root.S.session,wasOpen=root.S.loggerOpen;
    root.S.session = next;
    root.S.loggerOpen = true;
    try{if (typeof root.save === 'function') root.save();}
    catch(e){
      root.S.session=previous;root.S.loggerOpen=wasOpen;
      const k=next&&(next.slotKey||next.date);if(k&&root.S.sessions?.[k]===next){if(previous&&(previous.slotKey||previous.date)===k)root.S.sessions[k]=previous;else delete root.S.sessions[k];}
      toast='Could not save. Free some storage and try again.';
      paint();return false;
    }
    paint();return true;
  }

  function elapsed() {
    const s = session();
    if (!s || !s.startedAt) return '0:00';
    const sec = Math.max(0, Math.floor((Date.now() - s.startedAt) / 1000));
    const m = Math.floor(sec / 60);
    const r = sec % 60;
    return `${m}:${String(r).padStart(2, '0')}`;
  }

  function open({ date, letter, plan } = {}) {
    const HS = root.HybridSession;
    const d = date || (root.S && root.S.selectedDate);
    const p = plan || (typeof root.trainingPlanForDate === 'function' ? root.trainingPlanForDate(d) : null);
    if (!p || !HS) return;
    const Slots = root.HybridSlots, slot = p.slotKey || d;
    const sameSlot = (x) => x && x.date === d && (x.slotKey || x.date) === slot;
    let existing = sameSlot(root.S.session) && root.S.session.phase !== 'summary' && (!root.S.session.demo || p.title === 'Slider demo')
      ? root.S.session
      : null;
    const stored = Slots && p.title !== 'Slider demo' ? Slots.find(root.S.sessions, slot) : null;
    // Leaving midway and coming back resumes the stored session; a finished one opens its summary, never restarts.
    if (!existing && stored && !letter) {
      if (stored.phase === 'summary') return openStored(slot);
      existing = stored;
    }
    if (letter && existing) {
      root.S.session = HS.goToLetter(HS.startSession({ date: d, plan: p, existing }), letter);
    } else if (letter) {
      root.S.session = HS.startSession({ date: d, plan: p, letter });
    } else {
      root.S.session = HS.startSession({ date: d, plan: p, existing });
    }
    if (p.title === 'Slider demo') root.S.session.demo = true;
    else root.S.session = root.StrengthBrain.seed(root.S.session, root.StrengthMemory.records());
    drainPrep();
    installPadGuard();
    root.S.loggerOpen = true;
    if (typeof root.save === 'function') root.save();
    document.getElementById('logger').classList.remove('hidden');
    document.getElementById('shell').classList.add('logger-open');
    if (typeof root.syncFab === 'function') root.syncFab();
    startClock();
    paint();
  }

  // Open a stored session as-is (history: view a summary, or resume an unfinished one).
  function openStored(key) {
    const stored = root.HybridSlots && root.HybridSlots.find(root.S.sessions, key);
    if (!stored) return false;
    root.S.session = stored.phase === 'summary' ? stored : root.StrengthBrain.seed(root.HybridSession.startSession({ date: stored.date, plan: { slotKey: root.HybridSlots.keyOf(stored) }, existing: stored }), root.StrengthMemory.records());
    root.S.loggerOpen = true;
    if (typeof root.save === 'function') root.save();
    document.getElementById('logger').classList.remove('hidden');
    document.getElementById('shell').classList.add('logger-open');
    if (typeof root.syncFab === 'function') root.syncFab();
    startClock();
    paint();
    return true;
  }

  let padGuard = false;
  let lastPaintKey = '';
  let fingerDown = false;
  let pendingPaint = false;
  function installPadGuard() {
    if (padGuard || !document || typeof document.addEventListener !== 'function') return;
    padGuard = true;
    const lift = () => {
      fingerDown = false;
      if (!pendingPaint) return;
      // Let the tap's click land on the control it started on, then apply the deferred repaint.
      setTimeout(() => { if (pendingPaint && !fingerDown) { pendingPaint = false; paint(); } }, 80);
    };
    document.addEventListener('pointerup', lift, true);
    document.addEventListener('pointercancel', lift, true);
    document.addEventListener('pointerdown', (e) => {
      fingerDown = true;
      const t = e.target;
      if (!pad || !t || !t.closest || t.closest('.log-pad') || t.closest('.log-cell')) return;
      Logger.padDismiss();
    }, true);
  }

  function close() {
    root.S.loggerOpen = false;
    pad = null;
    if (typeof root.save === 'function') root.save();
    const el = document.getElementById('logger');
    if (el) el.classList.add('hidden');
    const shell = document.getElementById('shell');
    if (shell) shell.classList.remove('logger-open');
    stopClock();
    if (typeof root.syncFab === 'function') root.syncFab();
    if (typeof root.render === 'function') root.render();
  }

  function timerState() {
    if (!root.S.timer) root.S.timer = HybridTimer.create();
    return root.S.timer;
  }

  function persistTimer(next) {
    if (typeof window !== 'undefined' && window.matchMedia) {
      next.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    root.S.timer = next;
    if (typeof root.save === 'function') root.save();
    if (fingerDown) { pendingPaint = true; return; }
    paint();
  }

  function restMilliseconds(s, page) {
    const selected = (s.restChoices || {})[page.id];
    if (selected) return selected;
    const sec = Number(page && page.restSec) || 0;
    return sec > 0 ? sec * 1000 : 0;
  }
  function completesRound(s, page, memberId, setIndex) {
    if (!page || page.logMode !== 'superset') return true;
    const steps = HybridSession.supersetSteps(s, page);
    const step = steps.find((item) => item.memberId === memberId && item.setIndex === setIndex);
    if (!step) return true;
    return steps.filter((item) => item.purpose === step.purpose && item.round === step.round && !(item.memberId === memberId && item.setIndex === setIndex)).every((item) => s.logs[item.memberId] && s.logs[item.memberId].sets[item.setIndex] && s.logs[item.memberId].sets[item.setIndex].logged);
  }
  function restAfterRound(s, page, memberId, setIndex) {
    if (!completesRound(s, page, memberId, setIndex)) return false;
    const row = s.logs[memberId] && s.logs[memberId].sets[setIndex];
    if (row && row.purpose === 'ramp') return false;
    if (!page || page.logMode !== 'superset') return true;
    const steps = HybridSession.supersetSteps(s, page);
    const step = steps.find((item) => item.memberId === memberId && item.setIndex === setIndex);
    if (!step) return true;
    const members = steps.filter((item) => item.purpose === step.purpose && item.round === step.round);
    return !(members.length === 1 && step.purpose === 'ramp');
  }
  function startChosenRest(s,page) {
    const ms=restMilliseconds(s,page);
    if(!ms)return;
    let timer=HybridTimer.choose(timerState(),'rest');
    timer=HybridTimer.start(HybridTimer.quickStart(timer,ms),Date.now());
    timer.display='docked';root.S.timer=timer;
  }
  function rememberRest(timer) {
    const s = session();
    if (!s || timer.mode !== 'rest' || !Number.isFinite(timer.config.restMs) || timer.config.restMs <= 0) return;
    const page = HybridSession.currentPage(s);
    s.restChoices = { ...(s.restChoices || {}), [page.id]: timer.config.restMs };
  }
  function moveExercise(direction) {
    const s = session();
    if(direction>0&&prepClockPending(s))return;
    const next = direction > 0 ? HybridSession.nextPage(s) : HybridSession.prevPage(s);
    if (next.blockIndex !== s.blockIndex) {
      // Clear both timer history and the choice for the newly entered exercise.
      delete (next.restChoices || {})[HybridSession.currentPage(next).id];
      root.S.timer = HybridTimer.create();
      lastBeep = '';
    }
    pad = null;
    persist(next);
  }

  let audioCtx = null;
  function beep(kind) {
    if (lastBeep === kind) return;
    lastBeep = kind;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = audioCtx || new AC();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g);
      g.connect(audioCtx.destination);
      o.frequency.value = kind === 'go' || kind === 'done' ? 880 : 660;
      g.gain.value = 0.06;
      o.start();
      o.stop(audioCtx.currentTime + 0.08);
    } catch (_) { /* no audio */ }
  }

  function startClock() {
    stopClock();
    clockTimer = setInterval(() => {
      const clock = document.getElementById('logClock');
      if (clock) clock.textContent = elapsed();
      const t = timerState();
      const now = Date.now();
      const next = HybridTimer.tick(t, now);
      if (next !== t) {
        if (next.view === 'idle' && t.view !== 'idle') {
          beep('done');
          if (t.config && t.config.hold) {
            if (continueHold(t, now)) return;
            recordHold(t, now);
          }
          const prep = prepCountdown(t);
          lastBeep = '';
          persistTimer(next);
          if (prep) continuePrep(t);
          return;
        }
        lastBeep = '';
        persistTimer(next);
        return;
      }
      const snap = HybridTimer.snapshot(t, now);
      if (snap.countInLabel && snap.countInLabel !== lastBeep) {
        beep(snap.countInLabel === 'GO!' ? 'go' : snap.countInLabel);
      } else if (snap.roundLabel && snap.roundLabel !== lastBeep) {
        beep(snap.roundLabel);
      }
      patchLiveTimer(snap);
    }, 100);
  }

  function patchLiveTimer(snap) {
    if (snap.view !== 'countIn' && snap.view !== 'running') return;
    if (snap.display === 'docked') {
      const dock = document.getElementById('logTimerDock');
      if (!dock) return;
      const wrap = document.createElement('div');
      wrap.innerHTML = timerDockHtml();
      const node = wrap.firstElementChild;
      if (node) dock.replaceWith(node);
      return;
    }
    const full = document.getElementById('logTimerFull');
    if (!full) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = runHtml(snap);
    const node = wrap.firstElementChild;
    if (node) full.replaceWith(node);
  }

  function stopClock() {
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = 0;
  }

  function dotsHtml(s) {
    return s.pages.map((p, i) => {
      const ids = HybridSession.logIdsForPage(p);
      const done = p.logMode === 'complete' ? !!(s.logs[p.id] && s.logs[p.id].completed)
        : p.logMode === 'doneHub' ? false
        : ids.some((id) => s.logs[id] && s.logs[id].sets && s.logs[id].sets.some((r) => r.logged));
      const cur = s.phase === 'block' && i === s.blockIndex;
      return `<span class="log-dot${cur ? ' current' : done ? ' done' : ''}"></span>`;
    }).join('');
  }

  function headerHtml(s) {
    const t = HybridSession.totals(s);
    return `
      <div class="log-top">
        <button type="button" class="log-back-x" onclick="Logger.chevron()" aria-label="Close">⌄</button>
        <div class="log-dots">${dotsHtml(s)}</div>
        <div class="log-clock" id="logClock">${elapsed()}</div>
      </div>
      <div class="log-totals">
        <div><b>${t.sets || 0}</b><span>SETS</span></div>
        <div><b>${t.reps}</b><span>REPS</span></div>
        <div><b>${t.kg}</b><span>KG</span></div>
        <div><b>${t.meters || 0}</b><span>M</span></div>
        <div><b>${t.seconds || 0}</b><span>SEC</span></div>
      </div>`;
  }

  function ringSvg(progress, inner) {
    const c = 2 * Math.PI * 46;
    const off = c * (1 - Math.max(0, Math.min(1, progress || 0)));
    return `<svg class="tm-ring" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="5"/>
      <circle cx="50" cy="50" r="46" fill="none" stroke="#16ec06" stroke-width="5"
        stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"
        transform="rotate(-90 50 50)"/>
    </svg>${inner}`;
  }

  function timerDockHtml() {
    const snap = HybridTimer.snapshot(timerState(), Date.now());
    if (snap.view === 'countIn' && snap.display === 'docked') {
      return `<div class="tm-dock-copy" id="logTimerDock">${esc(snap.countInLabel)}</div>`;
    }
    if (snap.view === 'running' && snap.display === 'docked') {
      return `<button type="button" class="tm-dock-run" id="logTimerDock" onclick="Logger.timerTapDock()">${ringSvg(snap.progress, `<span>${esc(snap.clock)}</span>`)}</button>`;
    }
    if (snap.chrome === 'select') {
      return `<button type="button" class="tm-select" onclick="Logger.timerOpen()" aria-label="Select Timer">${icoSwitch()} Select Timer</button>`;
    }
    return `<button type="button" class="log-play" onclick="Logger.timerPlay()" aria-label="Start last timer">▶</button>`;
  }

  function barHtml(s) {
    const atStart = s.blockIndex === 0;
    const atEnd = s.blockIndex === s.pages.length - 1;
    const snap = HybridTimer.snapshot(timerState(), Date.now());
    const hideSides = snap.stopSheet;
    return `
      <div class="log-bar">
        <button type="button" class="log-bar-btn" onclick="Logger.prev()" ${atStart || hideSides ? 'disabled' : ''}>← Back</button>
        ${timerDockHtml()}
        <button type="button" class="log-bar-btn" onclick="Logger.next()" ${atEnd || hideSides || prepClockPending(s) ? 'disabled style="opacity:.35"' : ''}>Next →</button>
      </div>`;
  }

  function switchBtn() {
    return `<button type="button" class="tm-switch" onclick="Logger.timerSwitch()">${icoSwitch()} Switch</button>`;
  }

  function modeTitle(mode) {
    if (mode === 'countdown') {
      const page = session() && HybridSession.currentPage(session());
      return page && page.title ? page.title : 'Countdown';
    }
    if (mode === 'tabata') return 'Tabata Timer';
    if (mode === 'emom') return 'EMOM Timer';
    return (HybridTimer.PICKER.find((p) => p.id === mode) || {}).label || mode;
  }

  function pickerIcon(id) {
    const g = '#16ec06';
    const w = '#fff';
    if (id === 'rest') {
      return `<svg viewBox="0 0 72 72" class="tm-ico">${circ()}<text x="36" y="44" text-anchor="middle" fill="${g}" font-size="22" font-weight="700" font-family="Barlow Condensed,sans-serif">Zzz</text></svg>`;
    }
    if (id === 'stopwatch') {
      return `<svg viewBox="0 0 72 72" class="tm-ico">${circ()}<circle cx="36" cy="38" r="16" fill="none" stroke="${w}" stroke-width="2.5"/><path d="M36 38 L36 26" stroke="${g}" stroke-width="2.5" stroke-linecap="round"/><rect x="32" y="12" width="8" height="6" rx="1" fill="${w}"/></svg>`;
    }
    if (id === 'amrap') {
      return `<svg viewBox="0 0 72 72" class="tm-ico"><path d="M14 50 A24 24 0 1 1 58 50" fill="none" stroke="${w}" stroke-width="2.5"/><path d="M36 50 L52 28" stroke="${g}" stroke-width="2.5" stroke-linecap="round"/></svg>`;
    }
    if (id === 'forTime') {
      return `<svg viewBox="0 0 72 72" class="tm-ico">${circ()}<path d="M36 20 A16 16 0 1 1 20 36" fill="none" stroke="${g}" stroke-width="8"/><circle cx="36" cy="36" r="3" fill="${w}"/></svg>`;
    }
    if (id === 'tabata') {
      return `<svg viewBox="0 0 72 72" class="tm-ico"><text x="36" y="46" text-anchor="middle" fill="${g}" font-size="28" font-weight="700" font-family="Barlow Condensed,sans-serif">:20</text></svg>`;
    }
    if (id === 'custom') {
      return `<svg viewBox="0 0 72 72" class="tm-ico">${circ()}<path d="M36 20 A16 16 0 0 1 52 36 L36 36 Z" fill="${g}"/></svg>`;
    }
    return `<svg viewBox="0 0 72 72" class="tm-ico"><text x="36" y="46" text-anchor="middle" fill="${g}" font-size="22" font-weight="700" font-family="Barlow Condensed,sans-serif">1:00</text></svg>`;
  }

  function circ() {
    return `<circle cx="36" cy="36" r="26" fill="none" stroke="#fff" stroke-width="2.5"/>`;
  }

  function icoSwitch() {
    return `<svg viewBox="0 0 20 20" width="16" height="16"><circle cx="10" cy="11" r="6" fill="none" stroke="#1ba3ff" stroke-width="1.6"/><path d="M10 7 v4" stroke="#1ba3ff" stroke-width="1.6"/></svg>`;
  }

  function fieldBox(key, value, label) {
    return `<label class="tm-field"><span>${esc(label)}</span><input inputmode="numeric" value="${esc(value)}" onchange="Logger.timerField('${esc(key)}', this.value)"></label>`;
  }

  function pairBoxes(aKey, aVal, bKey, bVal, label) {
    return `<div class="tm-pair">
      <input inputmode="numeric" value="${esc(aVal)}" onchange="Logger.timerField('${esc(aKey)}', this.value)">
      <i>:</i>
      <input inputmode="numeric" value="${esc(bVal)}" onchange="Logger.timerField('${esc(bKey)}', this.value)">
      <span>${esc(label)}</span>
    </div>`;
  }

  function setupHtml(snap) {
    const mode = snap.mode;
    const c = snap.config || {};
    const title = modeTitle(mode);
    let body = '';
    if (mode === 'rest') {
      const m = Math.floor((c.restMs || 0) / 60000);
      const s = Math.floor(((c.restMs || 0) % 60000) / 1000);
      body = `
        <p class="tm-kicker">Quick Start</p>
        <div class="tm-quick">${[30000, 45000, 60000, 90000, 120000].map((ms) => {
          const clock = HybridTimer.formatClock(ms, false);
          return `<button type="button" onclick="Logger.timerQuick(${ms})">${clock}</button>`;
        }).join('')}</div>
        <hr class="tm-rule">
        <p class="tm-kicker">Customize</p>
        <div class="tm-custom">
          <button type="button" onclick="Logger.timerNudge(-1)">−</button>
          <div class="tm-ms"><b>${m}</b><span>m</span></div>
          <div class="tm-ms"><b>${String(s).padStart(2, '0')}</b><span>s</span></div>
          <button type="button" onclick="Logger.timerNudge(1)">+</button>
        </div>
        <button type="button" class="tm-start" onclick="Logger.timerStart()"><span>▶</span>Start</button>`;
    } else if (mode === 'stopwatch' || mode === 'forTime') {
      body = `
        <button type="button" class="tm-giant" onclick="Logger.timerStart()">▶</button>
        <div class="tm-countin-row">${fieldBox('countInSec', Math.round((c.countInMs || 0) / 1000), 'Count In')}</div>
        <div class="tm-run-btns">
          <button type="button" class="tm-reset" onclick="Logger.timerReset()">Reset</button>
          <button type="button" class="tm-pause" onclick="Logger.timerPause()">Pause</button>
        </div>`;
    } else if (mode === 'amrap') {
      body = `
        ${pairBoxes('totalMin', Math.floor((c.totalMs || 0) / 60000), 'totalSec', String(Math.floor(((c.totalMs || 0) % 60000) / 1000)).padStart(2, '0'), 'Total Time')}
        <div class="tm-countin-row">${fieldBox('countInSec', Math.round((c.countInMs || 0) / 1000), 'Count In')}</div>
        <button type="button" class="tm-start" onclick="Logger.timerStart()"><span>▶</span>Start</button>`;
    } else if (mode === 'tabata' || mode === 'custom') {
      const work = c.workMs || 0;
      const rest = c.restMs || 0;
      const blurb = mode === 'tabata'
        ? `${c.rounds} rounds of ${Math.round(work / 1000)} seconds work, ${Math.round(rest / 1000)} seconds rest`
        : `${c.rounds} rounds of: ${HybridTimer.formatClock(work, false)} work / ${HybridTimer.formatClock(rest, false)} rest`;
      body = `
        <p class="tm-blurb">${esc(blurb)}</p>
        ${fieldBox('rounds', c.rounds, 'Rounds')}
        ${mode === 'tabata'
          ? `${fieldBox('workSec', Math.round(work / 1000), 'Work')}${fieldBox('restSec', Math.round(rest / 1000), 'Rest')}`
          : `${pairBoxes('workMin', Math.floor(work / 60000), 'workSec', String(Math.floor((work % 60000) / 1000)).padStart(2, '0'), 'Work')}
             ${pairBoxes('restMin', Math.floor(rest / 60000), 'restSec', String(Math.floor((rest % 60000) / 1000)).padStart(2, '0'), 'Rest')}`}
        <div class="tm-countin-row">${fieldBox('countInSec', Math.round((c.countInMs || 0) / 1000), 'Count In')}</div>
        <button type="button" class="tm-start" onclick="Logger.timerStart()"><span>▶</span>Start</button>`;
    } else if (mode === 'emom') {
      body = `
        ${pairBoxes('everyMin', Math.floor((c.everyMs || 0) / 60000), 'everySec', String(Math.floor(((c.everyMs || 0) % 60000) / 1000)).padStart(2, '0'), 'Every')}
        ${fieldBox('rounds', c.rounds, 'Rounds')}
        <div class="tm-countin-row">${fieldBox('countInSec', Math.round((c.countInMs || 0) / 1000), 'Count In')}</div>
        <button type="button" class="tm-start" onclick="Logger.timerStart()"><span>▶</span>Start</button>`;
    }
    return `
      <div class="tm-full" id="logTimerFull">
        <div class="tm-head">
          <h2>${esc(title)}</h2>
          ${switchBtn()}
        </div>
        <div class="tm-setup">${body}</div>
      </div>`;
  }

  function pickerHtml() {
    const tiles = HybridTimer.PICKER.map((m) => `<button type="button" class="tm-tile" onclick="Logger.timerChoose('${m.id}')">${pickerIcon(m.id)}<span>${esc(m.label)}</span></button>`).join('');
    return `<div class="tm-full tm-picker" id="logTimerFull">
      <button type="button" class="tm-x" onclick="Logger.timerClosePicker()" aria-label="Close">×</button>
      <div class="tm-grid">${tiles}</div>
    </div>`;
  }

  function sidesFor(page) {
    return page && (page.eachSide || /\(each side\)/i.test(page.title || '')) ? 2 : 1;
  }

  function isEachSideCarry(page) {
    return !!(page && sidesFor(page) === 2 && /carry|farmer|suitcase/i.test(page.title || ''));
  }

  function carrySide(s, id) {
    return s && s.loggerSides && s.loggerSides[id] === 2 ? 2 : 1;
  }

  function titled(page, s) {
    if (!page || !isEachSideCarry(page)) return (page && page.title) || '';
    return `${page.title} · side ${carrySide(s, page.id)}`;
  }

  function timerHeading(snap) {
    let title = modeTitle(snap.mode);
    const hold = snap.config && snap.config.hold;
    if (hold && session()) {
      const page = HybridSession.currentPage(session());
      const member = page && page.logMode === 'superset' ? HybridSession.memberOf(page, hold.memberId) : null;
      if (member && member.title) title = member.title;
    }
    const side = snap.config && snap.config.prepSide;
    return side ? `${title} · side ${side}` : title;
  }

  function holdActions(snap) {
    if (!(snap.config && snap.config.hold)) return '';
    return `<div class="tm-run-btns"><button type="button" class="tm-reset" onclick="Logger.stopHold()">Stop</button><button type="button" class="tm-reset" onclick="Logger.skipHold()">Skip</button></div>`;
  }

  function holdIsEachSide(snap) {
    const hold = snap.config && snap.config.hold;
    if (!hold || !session()) return false;
    const page = HybridSession.currentPage(session());
    const lift = page && page.logMode === 'superset' ? HybridSession.memberOf(page, hold.memberId) : page;
    return sidesFor(lift) === 2;
  }

  function runSwitch(snap) {
    if (snap.config && snap.config.hold && !holdIsEachSide(snap)) return '';
    return switchBtn();
  }

  function runHtml(snap) {
    const title = timerHeading(snap);
    if (snap.view === 'countIn') {
      return `<div class="tm-full" id="logTimerFull">
        <div class="tm-head"><h2>${esc(title)}</h2>${runSwitch(snap)}</div>
        <div class="tm-countin">${esc(snap.countInLabel)}</div>
        ${holdActions(snap)}
      </div>`;
    }
    const inner = `<div class="tm-face">
      ${snap.roundFraction ? `<small>${esc(snap.roundFraction)}</small>` : ''}
      <strong>${esc(snap.clock || '')}</strong>
      ${snap.roundLabel ? `<em>${esc(snap.roundLabel)}</em>` : ''}
    </div>`;
    const runningActions = snap.config && snap.config.hold
      ? holdActions(snap)
      : (snap.mode !== 'rest' ? `<div class="tm-run-btns"><button type="button" class="tm-reset" onclick="Logger.timerReset()">Reset</button>${snap.mode === 'stopwatch' || snap.mode === 'forTime' ? `<button type="button" class="tm-pause" onclick="Logger.timerPause()">Pause</button>` : ''}</div>` : '');
    return `<div class="tm-full" id="logTimerFull">
      <div class="tm-head"><h2>${esc(title)}</h2>${runSwitch(snap)}</div>
      <div class="tm-run">${ringSvg(snap.progress == null ? 1 : snap.progress, inner)}</div>
      ${runningActions}
    </div>`;
  }

  function timerOverlayHtml() {
    const t = timerState();
    const snap = HybridTimer.snapshot(t, Date.now());
    let extra = '';
    if (snap.view === 'picker') extra = pickerHtml();
    else if (snap.view === 'setup') extra = setupHtml(snap);
    else if ((snap.view === 'running' || snap.view === 'countIn') && snap.display === 'fullscreen') extra = runHtml(snap);
    if (snap.stopSheet) {
      extra += `<div class="tm-stop" onclick="if(event.target===this)Logger.timerCancelStop()">
        <div class="tm-stop-card">
          <button type="button" class="tm-stop-go" onclick="Logger.timerStop()">Stop Timer</button>
          <button type="button" onclick="Logger.timerCancelStop()">Cancel</button>
        </div>
      </div>`;
    }
    return extra;
  }

  function quoteHtml() {
    return `<div class="log-quote"><p>${esc(QUOTE)}</p></div>`;
  }

  function coachHtml() {
    const s = session();
    const copy = (s && s.instructions && String(s.instructions).trim()) ? s.instructions : COACH;
    return `
      <div class="log-coach">
        <h1>Coach Instructions</h1>
        <p>${esc(copy).replace(/\n/g, '<br>')}</p>
        <button type="button" class="log-primary" onclick="Logger.gotCoach()">Got It</button>
      </div>`;
  }

  function completeHtml(s, page, log) {
    const items = (page.items || []).map((it) => `
      <li><strong>${it.n}.</strong> ${esc(it.text)}
        ${it.note ? `<p class="log-note"><em>*${esc(it.note)}</em></p>` : ''}
      </li>`).join('');
    const bullets = (page.bullets || []).map((b) => `<li>${esc(b)}</li>`).join('');
    return `
      <p class="log-kicker">${esc(page.letter)}. ${esc(page.section)}</p>
      <h2 class="log-title">${esc(page.title)}</h2>
      ${items ? `<ol class="log-list">${items}</ol>` : ''}
      ${bullets ? `<ul class="log-bullets">${bullets}</ul>` : ''}
      ${page.note ? `<p class="log-note"><em>*${esc(page.note)}</em></p>` : ''}
      ${page.goal ? `<p>${esc(page.goal)}</p>` : ''}
      <button type="button" class="log-complete${log.completed ? ' is-done' : ''}" onclick="Logger.complete()">
        ${log.completed ? 'Completed' : 'Mark As Completed'}
      </button>
      <input class="log-ex-note" placeholder="Add circuit note" value="${esc(log.note || '')}" onchange="Logger.note('${esc(page.id)}',this.value)">`;
  }

  function showsEstimate(page) {
    if (!page || page.logMode !== 'kg') return false;
    if (/carry|farmer|suitcase|plank|hang|\bhold\b/i.test(page.title || '')) return false;
    return !columnsFor(page).some((column) => ['meters', 'seconds', 'time_mmss'].includes(column));
  }

  function columnLabel(page, key) {
    if (key === 'weight_kg' && page.loadConvention === 'per_hand') return 'Weight (kg per hand)';
    return (root.HybridLibrary && root.HybridLibrary.trackLabel && root.HybridLibrary.trackLabel(key)) || key;
  }

  function restNote(s, page) {
    const outer = HybridSession.currentPage(s);
    const ms = restMilliseconds(s, outer && outer.logMode === 'superset' ? outer : page);
    if (!ms) return 'Choose your rest using Select Timer below.';
    const when = outer && outer.logMode === 'superset' ? 'after the pair' : 'on Log set';
    return `Rest: ${Math.round(ms / 1000)} seconds · starts ${when}`;
  }

  function isStrengthHold(page) {
    if (!page || page.section === 'Warm-Up' || page.section === 'Cool-Down') return false;
    return /plank|hang|\bhold\b/i.test(page.title || '') && columnsFor(page).includes('seconds');
  }

  // Weighted lifts the brain cannot pick for say so quietly instead of looking broken.
  function manualLoad(page) {
    const cols = page.columns || [];
    return page.kind === 'lift' && cols.includes('weight_kg') && !/carry|farmer|suitcase/i.test(page.title || '') && !cols.includes('meters') &&
      !(root.StrengthBrain && root.StrengthBrain.eligible(page));
  }
  function lastText(s, page, past) {
    if (past.latest) return loggedLoad(page, past.latest.rows.filter(r=>r.logged && r.purpose!=='ramp').at(-1)?.kg) || 'None';
    // Manual lifts have no brain history; show the last weight used, keyed by title fallback.
    const last = root.StrengthBrain.lastLogged ? root.StrengthBrain.lastLogged(root.StrengthMemory.records(), page, s.id) : null;
    return last ? loggedLoad(page, last.kg) || 'None' : 'None';
  }
  function sideHtml(s, page, history) {
    const past = history || root.StrengthBrain.history(root.StrengthMemory.records(), page, s.id);
    // EST. 1RM is learned on physical kg; show it on the same entry basis as LAST (plates for bars).
    // One number: the Epley working 1RM the % loads use (the old rolling estimator is no longer shown).
    const rm = root.StrengthBrain.oneRM ? root.StrengthBrain.oneRM(root.StrengthMemory.records(), page, s.id) : null;
    const shown = rm && rm.kg > 0 ? rm.kg : null;
    const wm = shown != null ? loggedLoad(page, Math.round(shown * 10) / 10) : '';
    return `
      <div class="log-meta-row">
        <div class="log-thumb">▶</div>
        <div class="log-side">
          <div class="log-side-row"><span>EST. 1RM</span><span>${wm ? esc(wm) : 'Learning'}</span></div>
          ${manualLoad(page) ? '<div class="log-side-row"><span>LOAD</span><span>Manual</span></div>' : ''}
          <div class="log-side-row"><span>LAST</span><span>${lastText(s, page, past)}</span></div>
        </div>
      </div>`;
  }

  function colField(key) {
    if (key === 'reps' || key === 'reps_range') return 'reps';
    if (key === 'weight_kg') return 'kg';
    return key;
  }

  function columnsFor(page) {
    if (page.columns && page.columns.length) return page.columns;
    if (page.logMode === 'kg') return ['reps', 'weight_kg'];
    return ['reps'];
  }

  function weightText(page, kg) {
    if (kg == null || kg === '') return '';
    if (root.StrengthEquipment && typeof root.StrengthEquipment.label === 'function') return root.StrengthEquipment.label(page, kg);
    return String(kg);
  }

  function loggedLoad(page, kg) {
    const text = weightText(page, kg);
    if (text === '') return '';
    return text === 'empty bar' ? 'empty bar' : `${text} kg`;
  }

  function cellVal(row, field) {
    if (field === 'reps') return row.reps == null ? 'MAX' : row.reps;
    if (field === 'kg') return row.kg == null || row.kg === '' ? '' : row.kg;
    const v = row.cells && row.cells[field];
    return v == null ? '' : v;
  }

  function effortShort(effort) { return ({very_easy:'Very Easy',easy:'Easy',average:'Average',hard:'Hard',max_effort:'Max Effort'})[effort] || '—'; }

  const EFFORTS = root.TrainingCore.efforts;
  const EFFORT_COPY = { very_easy: 'Very light effort.', easy: 'Could have done 5–7 more reps.', average: 'Could have done 3–4 more reps.', hard: 'Could have done 1 or 2 more reps.', max_effort: 'Could not do any more reps.' };

  // Dan's colour slider: four snapped stops (Very Easy..Hard). Max Effort stays a stored rating and sits at the Hard end.
  const SLIDER_STOPS = 4;
  const SLIDER_LABELS = '<span>Very Easy</span><span>Easy</span><span>Average</span><span>Hard</span>';

  function setFlow(s, page) {
    const rows = (s.logs[page.id] && s.logs[page.id].sets) || [];
    const pending = rows.findIndex((r) => !r.logged && !r.skipped);
    const saved = (s.loggerSetFlow || {})[page.id] || {};
    const index = Number.isInteger(saved.index) && rows[saved.index] && (saved.editing || !rows[saved.index].logged)
      ? saved.index : pending;
    const row = rows[index];
    return {
      ...saved, index, rows,
      draft: saved.index === index && saved.draft ? saved.draft : {
        reps: row && row.reps != null ? row.reps : '',
        kg: row && row.kg != null ? row.kg : '',
        effort: row && row.logged ? row.effort || null : null,
        miss: !!(row && row.logged && row.miss),
      },
    };
  }

  function supportsSetFlow(page) {
    return !/carry|farmer|suitcase|\bhold\b|plank/i.test(page.title || '') && ['kg', 'reps', 'max'].includes(page.logMode) && columnsFor(page).every((c) => ['reps', 'reps_range', 'weight_kg'].includes(c));
  }

  function setActionHtml(s, page) {
    const flow = setFlow(s, page);
    if (flow.index < 0) return '';
    return `<div class="log-set-action"><button type="button" class="log-primary" onclick="Logger.saveSet('${esc(page.id)}')">${flow.editing ? 'Save changes' : 'Log set'}</button></div>`;
  }

  function activeSetHtml(s, page, log, dockAction = false) {
    const flow = setFlow(s, page);
    const id = esc(page.id);
    const target = root.StrengthBrain.target(page,flow.rows[flow.index],flow.index);
    const chosen = EFFORTS.includes(flow.draft.effort) ? flow.draft.effort : null;
    const position = Math.min(SLIDER_STOPS - 1, EFFORTS.indexOf(chosen || target || 'average'));
    const done = flow.index < 0;
    const rows = flow.rows;
    const activeRow=flow.rows[flow.index];let authored=null;try{authored=root.StrengthTargets.forRow(page,activeRow,flow.index);}catch{}
    const repTarget = activeRow?.purpose==='ramp'?(activeRow.reps??page.targetReps):authored?.purpose==='amrap'?'AMRAP':authored?.reps?(authored.reps.max>authored.reps.min?`${authored.reps.min}–${authored.reps.max}`:authored.reps.min):page.targetReps == null?'MAX':page.targetRepMax>page.targetReps?`${page.targetReps}–${page.targetRepMax}`:page.targetReps;
    const eachSideReps = sidesFor(page) === 2 && repTarget != null && repTarget !== 'AMRAP';
    const shownReps = eachSideReps ? `${repTarget} L · ${repTarget} R` : repTarget;
    // The rest note sits below the effort slider so rating the next set never needs a scroll.
    const restBits = `<p class="log-note">Set saved. Adjust the next weight if needed, then rate the set when it is done.</p><button type="button" class="log-set-skip" onclick="Logger.startSet('${id}')">Skip rest</button>`;
    const history = rows.map((r, i) => r.logged ? `<button type="button" class="log-set-history" aria-label="Edit set ${i + 1} of ${esc(page.title)}" onclick="Logger.editSet('${id}',${i})"><span class="log-set-tick">✓</span><span>${r.purpose==='ramp'?'Ramp':'Set'} ${rows.slice(0,i+1).filter(x=>x.purpose===r.purpose).length || i+1} · ${page.logMode === 'kg' ? `${esc(loggedLoad(page, r.kg))} × ` : ''}${sidesFor(page) === 2 ? `${esc(r.reps)} L · ${esc(r.reps)} R` : `${esc(r.reps)} reps`} · ${r.miss ? 'Incomplete' : esc(effortShort(r.effort))}</span><span class="log-link">Edit</span></button>` : '').join('');
    return `<p class="log-rx">${esc(page.prescription)}</p>
      ${page.notes && page.notes.length ? `<ul class="log-notes">${page.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
      <p class="log-note">${esc(restNote(s, page))}</p>
      <section class="log-active-set" data-exercise="${id}">
        <div class="log-set-heading"><h3>${done ? 'All sets recorded' : `${flow.rest ? 'Next · ' : ''}${rows[flow.index]?.purpose === 'ramp' ? `Ramp ${rows.slice(0,flow.index+1).filter(r=>r.purpose==='ramp').length} of 2` : `Set ${rows.slice(0,flow.index+1).filter(r=>r.purpose!=='ramp').length} of ${rows.filter(r=>r.purpose!=='ramp').length}`}`}</h3>${done ? '' : `<span>${esc(shownReps)}${repTarget==='AMRAP'||eachSideReps?'':' reps'}</span>`}</div>
        ${done ? '<p class="log-note">Review a set below or move to the next exercise.</p>' : `
<div class="log-active-fields">
          <label>Reps completed<input class="log-cell" type="text" readonly data-pad-cell="${id}|d|reps" value="${esc(flow.draft.reps)}" onclick="Logger.focusDraftPad('${id}','reps')"></label>
          ${page.logMode === 'kg' ? `<label>${esc(columnLabel(page, 'weight_kg'))}<input class="log-cell" type="text" readonly data-pad-cell="${id}|d|kg" value="${esc(weightText(page, flow.draft.kg))}" onclick="Logger.focusDraftPad('${id}','kg')"></label>` : ''}
        </div>
        ${page.askEffort === false ? '' : (target ? `<p class="log-set-target">Target effort: <strong>${esc(effortShort(target) === 'Med' ? 'Medium' : effortShort(target))}</strong></p>` : '<p class="log-set-target">Target effort not prescribed</p>')}
        ${flow.rest && page.askEffort === false ? restBits : ''}${page.askEffort === false ? (dockAction ? '' : `<button type="button" class="log-primary" onclick="Logger.saveSet('${id}')">${flow.editing ? 'Save changes' : 'Log set'}</button>`) : `
        <div class="log-effort-inline">
          <div class="log-effort-heading"><label id="effortHeading-${id}" for="setEffort-${id}">${chosen ? 'This set felt' : target ? 'This set should feel' : 'How did this set feel?'}</label><strong id="effortValue-${id}">${chosen ? chosen === 'medium' ? 'Medium' : effortShort(chosen) : target ? target === 'medium' ? 'Medium' : effortShort(target) : 'Choose effort'}</strong></div>
          <input id="setEffort-${id}" class="log-effort-slider log-effort-colour" type="range" min="0" max="3" step="1" value="${position}" aria-label="Actual set effort" aria-valuetext="${chosen ? chosen === 'medium' ? 'Medium' : effortShort(chosen) : 'Not rated'}" ${flow.draft.miss ? 'disabled' : ''} oninput="Logger.setEffort('${id}',this.value)" onchange="Logger.rate('${id}',this.value)" onpointerup="Logger.rate('${id}',this.value)" onclick="Logger.rate('${id}',this.value)" ontouchend="Logger.rate('${id}',this.value)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();Logger.rate('${id}',this.value)}">
          <div class="log-effort-labels" aria-hidden="true">${SLIDER_LABELS}</div>
          <p class="log-note" id="effortHelp-${id}">${flow.draft.miss ? 'Enter the reps you actually completed.' : chosen ? EFFORT_COPY[chosen] : 'Rate the actual effort after completing your set.'}</p>
        </div>
        <button type="button" class="log-set-incomplete" aria-pressed="${!!flow.draft.miss}" onclick="Logger.setIncomplete('${id}')">Did Not Complete</button>
        ${flow.rest ? restBits : ''}
        <p class="log-set-error" role="status">${esc(flow.error || '')}</p>
        ${dockAction ? '' : `<button type="button" class="log-primary" onclick="Logger.saveSet('${id}')">${flow.editing ? 'Save changes' : 'Log set'}</button>`}`}`}
      </section>
      <div class="log-set-history-list">${history}</div>
      <div class="log-set-ctrl"><button type="button" onclick="Logger.nudgeSets('${id}',-1)" aria-label="Remove a set">−</button><span>Sets</span><button type="button" onclick="Logger.nudgeSets('${id}',1)" aria-label="Add a set">+</button></div>
      <input class="log-ex-note" placeholder="Add exercise note" aria-label="Exercise note" value="${esc(log.note || '')}" onchange="Logger.note('${id}',this.value)">`;
  }

  // The validation message sits below the fold when Log set is docked; bring it into view.
  function revealSetError() {
    const el = document.getElementById('logger');
    const run = () => { const e = el && el.querySelector && el.querySelector('.log-set-error'); if (e && typeof e.scrollIntoView === 'function') e.scrollIntoView({ block: 'center', behavior: 'smooth' }); };
    if (typeof setTimeout === 'function') setTimeout(run, 0); else run();
  }

  function updateSetFlow(memberId, update, repaint = true) {
    const s = JSON.parse(JSON.stringify(session()));
    const page = HybridSession.currentPage(s);
    const lift = page.logMode === 'superset' ? HybridSession.memberOf(page, memberId) : page;
    if (!lift || lift.id !== memberId) return;
    const flow = setFlow(s, lift);
    const { rows, ...stored } = flow;
    s.loggerSetFlow = { ...(s.loggerSetFlow || {}), [memberId]: update(stored, lift, s) };
    if (repaint) persist(s);
    else { root.S.session = s; if (typeof root.save === 'function') root.save(); }
  }

  function tableHtml(s, page, log, onlyIndex) {
    const cols = columnsFor(page);
    const mid = esc(page.id);
    const heads = cols.map((k) => `<th>${esc(columnLabel(page, k))}</th>`).join('');
    const indexes = onlyIndex == null ? (log.sets || []).map((_, i) => i) : [onlyIndex];
    const rows = indexes.map((i) => {
      const row = (log.sets || [])[i];
      if (!row) return '';
      const tds = cols.map((k) => {
        const field = colField(k);
        const focus = pad && pad.memberId === page.id && pad.setIndex === i && pad.field === field;
        const val = root.TrainingCore.format(cellVal(row, field),k);
        const ph = field === 'reps' && row.reps == null;
        return `<td><button type="button" class="log-cell${focus ? ' focus' : ''}${ph ? ' ph' : ''}" data-pad-cell="${mid}|${i}|${esc(field)}" onclick="Logger.focusPad('${mid}',${i},'${esc(field)}')">${esc(val)}</button></td>`;
      }).join('');
      return `<tr>
        <td>${i + 1}</td>
        ${tds}
        <td><button type="button" class="log-check${row.logged ? ' on' : ''}" onclick="Logger.check('${mid}',${i})">${row.logged ? '✓' : ''}</button></td>
      </tr>${isStrengthHold(page) ? `<tr><td colspan="${cols.length + 2}"><button type="button" class="log-cell" onclick="Logger.startHold('${mid}',${i})">Start hold</button></td></tr>` : ''}${page.askEffort === false ? '' : `<tr><td colspan="${cols.length+2}"><label class="log-note">This set felt: <span id="rowEffort-${mid}-${i}">${esc(row.effort ? effortShort(row.effort) : 'Choose effort')}</span><input class="log-effort-slider log-effort-colour" type="range" min="0" max="3" step="1" value="${Math.min(SLIDER_STOPS-1,Math.max(0,EFFORTS.indexOf(row.effort||'average')))}" aria-label="Actual effort for set ${i+1}" oninput="Logger.rateRow('${mid}',${i},this.value)" onpointerup="Logger.rateRow('${mid}',${i},this.value)"></label><button type="button" class="log-set-incomplete" aria-label="Did Not Complete set ${i+1}" aria-pressed="${!!row.miss}" onclick="Logger.markMissRow('${mid}',${i})">Did Not Complete</button></td></tr>`}`;
    }).join('');
    return `
      <p class="log-rx">${esc(page.prescription)}</p>
      ${page.notes && page.notes.length ? `<ul class="log-notes">${page.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
      <table class="log-table">
        <thead><tr><th>Sets</th>${heads}<th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="log-set-ctrl">
        <button type="button" onclick="Logger.nudgeSets('${mid}',-1)">−</button>
        <span>Set</span>
        <button type="button" onclick="Logger.nudgeSets('${mid}',1)">+</button>
      </div>
      <input class="log-ex-note" placeholder="Add exercise note" value="${esc(log.note || '')}" onchange="Logger.note('${mid}',this.value)">`;
  }

  function hubHtml() {
    return `
      <div class="log-hub">
        <img src="assets/eds-strength-logo.png" alt="EDS Strength">
        <button type="button" class="log-primary" onclick="Logger.doneTraining()">Done Training</button>
      </div>`;
  }

  function feelHtml(s) {
    const f = s.feel || {};
    const n = f.durationMin || 1;
    return `
      <div class="log-feel">
        <h1>How did this session feel?</h1>
        <div class="log-intensity">
          ${[1, 2, 3, 4, 5].map((i) => `<button type="button" class="${f.intensity === i ? 'on' : ''}" onclick="Logger.feelIntensity(${i})">${i}</button>`).join('')}
        </div>
        <div class="eyebrow">Training Duration</div>
        <div class="log-dur">
          <button type="button" onclick="Logger.feelMins(-1)">−</button>
          <strong>${n} min</strong>
          <button type="button" onclick="Logger.feelMins(1)">+</button>
        </div>
        <input class="log-ex-note" placeholder="Session reflection" value="${esc(f.note || '')}" onchange="Logger.feelNote(this.value)">
        <button type="button" class="log-primary" onclick="Logger.finish()">Finish Session</button>
      </div>`;
  }

  function prepStat(label, items) {
    if (!items || !items.length) return '';
    const done = items.filter((item) => item.status === 'completed').length;
    const skipped = items.filter((item) => item.status === 'skipped').length;
    return `<div class="log-stat"><span>${esc(label)}</span><b>${done} completed · ${skipped} skipped</b></div>`;
  }

  function summaryHtml(s) {
    const st = HybridSession.summaryStats(s);
    const title = s.title || 'Completed session';
    return `
      <div class="log-sum">
        <p class="log-kicker">${esc(s.date)}</p>
        <h2 class="log-title">${esc(title)}</h2>
        <div class="log-stat"><span>Exercises</span><b>${st.exercises}</b></div>
        <div class="log-stat"><span>Sets</span><b>${st.sets}</b></div>
        <div class="log-stat"><span>Reps</span><b>${st.reps}</b></div>
        <div class="log-stat"><span>Volume</span><b>${st.kg} kg</b></div>
        <div class="log-stat"><span>Distance</span><b>${st.meters || 0} m</b></div>
        <div class="log-stat"><span>Time</span><b>${st.seconds || 0} sec</b></div>
        ${prepStat('Warm-up', st.prep && st.prep.warmup)}
        ${prepStat('Cool-down', st.prep && st.prep.cooldown)}
        <div class="log-stat"><span>Blocks</span><b>${st.blocksDone}/${st.blocksTotal}</b></div>
        <div class="log-stat"><span>Minutes</span><b>${st.minutes}</b></div>
        <button type="button" class="log-primary" onclick="Logger.close()">Close</button>
      </div>`;
  }

  function padHtml() {
    if (!pad) return '';
    const unit = (session().unit || 'kg') === 'lb' ? 'lb' : 'kg';
    const keys = root.TrainingCore.keys(pad);
    const keyBtns = keys.map((k) => k === null ? '<span></span>' : `<button type="button" onclick="Logger.padKey('${k}')">${k}</button>`).join('');
    return `
      <div class="log-pad" role="dialog" aria-label="Number entry keypad">
        <div class="log-pad-head">
          <div>
            <span class="log-pad-val">${esc(pad.buffer || '0')}</span>
            <span style="margin-left:8px;opacity:.6">${esc(root.TrainingCore.metric(pad.key)?.label || pad.key).toUpperCase()}</span>
          </div>
          <button type="button" onclick="Logger.closePad()">⌄</button>
        </div>
        <p class="log-set-error" role="status">${esc(pad.error||'')}</p><div class="log-keys">
          ${keyBtns}
          <div class="log-pad-side" style="grid-column:4;grid-row:1 / span 4">
            <button type="button" class="blue" onclick="Logger.padLog()">Save</button>
            <button type="button" onclick="Logger.padClear()">Clear</button>
            <button type="button" class="blue" onclick="Logger.padAutofill()">Autofill</button>${pad.key === 'lwp' ? '<button type="button" onclick="Logger.padKey(\'-\')">−</button>' : ''}
          </div>
        </div>
      </div>`;
  }

  function blockHtml(s) {
    const page = HybridSession.currentPage(s);
    const log = s.logs[page.id] || { completed: false, sets: [], note: '' };
    let body = '';
    if (page.logMode === 'complete') body = completeHtml(s, page, log);
    else if (page.logMode === 'doneHub') body = hubHtml();
    else if (page.logMode === 'superset') {
      const round = HybridSession.currentSupersetRound(s, page);
      const guide = round.members.length
        ? `${round.purpose === 'ramp' ? 'Ramp' : 'Round'} ${round.round} · ${round.members.map((member) => member.letter).join(' then ')}`
        : 'All rounds recorded';
      const members = round.members.map((step) => {
        const m = (page.members || []).find((member) => member.id === step.memberId);
        if (!m) return '';
        return `
        <section class="log-ss-member">
          <h2 class="log-title">${esc(m.letter)}. ${esc(titled(m, s))}</h2>
          ${showsEstimate(m) ? sideHtml(s, m) : ''}
          ${tableHtml(s, m, s.logs[m.id] || { sets: [], note: '' }, step.setIndex)}
        </section>`;
      }).join('');
      body = `
        <p class="log-kicker">${esc(page.letter)}. ${esc(page.section)}</p>
        <p class="log-note">${esc(guide)}</p>
        <p class="log-note">${esc(restNote(s, page))}</p>
        <div class="log-ss">${members}</div>`;
    } else {
      body = `
        <p class="log-kicker">${esc(page.letter)}. ${esc(page.section)}</p>
        <h2 class="log-title">${esc(titled(page, s))}</h2>
        ${showsEstimate(page) ? sideHtml(s, page) : ''}
        ${supportsSetFlow(page) ? activeSetHtml(s, page, log, true) : tableHtml(s, page, log)}`;
    }
    return `${headerHtml(s)}<div class="log-body">${body}</div>${supportsSetFlow(page) ? setActionHtml(s,page) : ""}${barHtml(s)}${padHtml()}${timerOverlayHtml()}`;
  }

  function prepClockPending(s) {
    if(!s||s.phase!=='block')return false;
    const page=HybridSession.currentPage(s),timer=timerState();
    if(!page||!['Warm-Up','Cool-Down'].includes(page.section)||s.warmupClock!==page.id||timer.mode!=='countdown')return false;
    const snap=HybridTimer.snapshot(timer,Date.now());
    if(!['running','countIn'].includes(snap.view)||snap.done)return false;
    const side=Number(timer.config&&timer.config.prepSide)||1;
    const rows=(s.logs[page.id]&&s.logs[page.id].sets)||[];
    if(side>=2&&rows.some((row)=>row.logged))return false;
    return true;
  }

  function heldSeconds(timer, now) {
    if (!timer) return 0;
    const countIn = Number(timer.config && timer.config.countInMs) || 0;
    const startedAt = timer.startedAt || (timer.countInAt != null ? timer.countInAt + countIn : null);
    if (!startedAt) return 0;
    const elapsed = Math.max(0, now - startedAt - (timer.pauseAccum || 0));
    const cap = Number(timer.config && timer.config.totalMs) || 0;
    const ms = cap > 0 ? Math.min(elapsed, cap) : elapsed;
    return Math.floor(ms / 1000);
  }

  function recordHold(timer, now) {
    const hold = timer.config && timer.config.hold;
    if (!hold || !session()) return;
    // Each-side holds are prescribed per side, so save seconds per side:
    // side 1 alone, or the mean of both sides once side 2 has been held.
    const firstSide = hold.sideSeconds == null ? null : Number(hold.sideSeconds) || 0;
    const held = heldSeconds(timer, now);
    const seconds = firstSide == null ? held : (held > 0 ? Math.round((firstSide + held) / 2) : firstSide);
    root.S.session = HybridSession.logSet(session(), hold.setIndex, { cells: { seconds } }, hold.memberId, { commit: false });
  }

  function continueHold(timer, now) {
    const hold = timer.config && timer.config.hold;
    if (!hold || !session()) return false;
    const page = HybridSession.currentPage(session());
    const lift = page && page.logMode === 'superset' ? HybridSession.memberOf(page, hold.memberId) : page;
    const side = Number(timer.config.prepSide) || 1;
    if (sidesFor(lift) !== 2 || side >= 2) return false;
    recordHold(timer, now);
    let next = HybridTimer.create();
    next.mode = 'countdown';
    next.config = {
      totalMs: timer.config.totalMs,
      countInMs: timer.config.countInMs,
      plainCount: true,
      prepSide: 2,
      hold: { memberId: hold.memberId, setIndex: hold.setIndex, sideSeconds: heldSeconds(timer, now) },
    };
    next.view = 'setup';
    next = HybridTimer.start(next, Date.now());
    persistTimer(next);
    return true;
  }

  function prepCountdown(timer) {
    const s = session();
    const page = s && HybridSession.currentPage(s);
    return !!(timer && timer.mode === 'countdown' && !(timer.config && timer.config.hold) && page && ['Warm-Up', 'Cool-Down'].includes(page.section) && s.warmupClock === page.id);
  }

  function armPrepClock(page, side) {
    const s = session();
    const total = Number(page.prescribed) * 1000;
    if (!Number.isFinite(total) || total <= 0) return;
    const previous = timerState();
    const previousClock = s.warmupClock;
    s.warmupClock = page.id;
    let next = HybridTimer.create();
    next.mode = 'countdown';
    next.config = { totalMs: total, countInMs: (Number(page.countIn) || 0) * 1000, plainCount: true };
    if (sidesFor(page) === 2) next.config.prepSide = side || 1;
    next.view = 'setup';
    next = HybridTimer.start(next, Date.now());
    root.S.timer = next;
    try { if (typeof root.save === 'function') root.save(); }
    catch {
      root.S.timer = previous;
      s.warmupClock = previousClock;
      toast = 'Could not save. Free some storage and try again.';
    }
  }

  // After a set is logged, the brain picks the next unlogged row's weight from
  // the logged effort. Used by the single-lift flow and by superset rows.
  function feedBrainNext(next, lift, sessionId) {
    const rows = (next.logs[lift.id] && next.logs[lift.id].sets) || [];
    const index = rows.findIndex(r => !r.logged && !r.skipped);
    if (index < 0 || lift.logMode !== 'kg') return null;
    const source = rows.slice(0, index).filter(r => r.logged).at(-1);
    if (!source) return null;
    const state = { rows, records: root.StrengthMemory?.records?.() || {}, excludeSession: sessionId };
    const adjustment = StrengthBrain.next({ page: lift, row: source, nextRow: rows[index], index, state });
    if (!adjustment) return null;
    rows[index].kg = adjustment.kg;
    // Only the next set moves; later sets follow their own plan (ramps never re-project work).
    source.loadDecision = adjustment;
    return adjustment;
  }

  function logFinishedPrep(s, page, timer) {
    const rows = (s.logs[page.id] && s.logs[page.id].sets) || [];
    const idx = rows.findIndex((r) => !r.logged);
    if (idx < 0 || rows[idx].skipped) return s;
    const secondsOnly = (page.columns || []).includes('seconds') && !(page.columns || []).some((c) => c === 'reps' || c === 'reps_range');
    if (secondsOnly) rows[idx].reps = null;
    const totalMs = Number(timer.config && timer.config.totalMs) || 0;
    return HybridSession.logSet(s, idx, { cells: { seconds: Math.round(totalMs / 1000) } }, page.id, { commit: true });
  }

  function continuePrep(timer) {
    const s = session();
    if (!s) return;
    const page = HybridSession.currentPage(s);
    if (!page || !['Warm-Up', 'Cool-Down'].includes(page.section) || s.warmupClock !== page.id) return;
    const side = Number(timer.config && timer.config.prepSide) || 1;
    if (sidesFor(page) === 2 && side < 2) {
      armPrepClock(page, 2);
      paint();
      return;
    }
    const logged = logFinishedPrep(s, page, timer);
    const moved = HybridSession.nextPage(logged);
    if (moved.blockIndex === s.blockIndex) return;
    delete (moved.restChoices || {})[HybridSession.currentPage(moved).id];
    root.S.timer = HybridTimer.create();
    lastBeep = '';
    persist(moved);
  }

  function armWarmupClock() {
    const s = session();
    if (!s || !root.S.loggerOpen || s.phase !== 'block') return;
    const page = HybridSession.currentPage(s);
    const cols = page && page.columns || [];
    if (!page || (page.section !== 'Warm-Up' && page.section !== 'Cool-Down') || !cols.includes('seconds')) return;
    const total = Number(page.prescribed) * 1000;
    if (!Number.isFinite(total) || total<=0) return;
    const timer = timerState();
    if (timer.view === 'running' || timer.view === 'countIn') return;
    if (s.warmupClock === page.id) return;
    armPrepClock(page, 1);
  }

  const pendingPrep=[];
  function takePrep(data) {
    if (!data || data.type !== 'hybrid-prep-result') return;
    const item={phase:data.phase==='cooldown'?'cooldown':'warmup',items:data.items||[]};
    if (!session()) { pendingPrep.push(item); return; }
    persist(HybridSession.recordPrep(session(), item.phase, item.items));
  }
  function drainPrep() {
    if (!session() || !pendingPrep.length) return;
    let next=session();
    for (const item of pendingPrep) next=HybridSession.recordPrep(next, item.phase, item.items);
    pendingPrep.length=0;
    root.S.session=next;
  }
  function listenPrep() {
    if (root.__prepWired || typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;
    root.__prepWired = true;
    window.addEventListener('message', (event) => takePrep(event && event.data));
  }

  function paint() {
    listenPrep();
    armWarmupClock();
    const el = document.getElementById('logger');
    if (!el) return;
    const s = session();
    if (!s || !root.S.loggerOpen) {
      el.classList.add('hidden');
      return;
    }
    el.classList.remove('hidden');
    document.getElementById('shell').classList.add('logger-open');
    let inner = '';
    if (s.phase === 'quote') inner = quoteHtml();
    else if (s.phase === 'coach') inner = coachHtml();
    else if (s.phase === 'feel') inner = feelHtml(s);
    else if (s.phase === 'summary') inner = summaryHtml(s);
    else inner = blockHtml(s);
    const oldBody = el.querySelector ? el.querySelector('.log-body') : null;
    const top = oldBody ? oldBody.scrollTop : 0;
    let pageKey = s.phase;
    try { pageKey += '|' + (HybridSession.currentPage(s) || {}).id; } catch (_) { /* no page */ }
    el.innerHTML = `<div class="log-screen">${toast ? `<div class="log-toast">${esc(toast)}</div>` : ''}${inner}</div>`;
    // Same page: keep the scroll so a repaint (rest end, a rating) never moves controls under the finger.
    const newBody = el.querySelector ? el.querySelector('.log-body') : null;
    if (newBody && pageKey === lastPaintKey && top) newBody.scrollTop = top;
    lastPaintKey = pageKey;
    installPadGuard();
    startClock();
    if (s.phase === 'quote') {
      el.querySelector('.log-quote')?.addEventListener('click', () => Logger.gotQuote());
      if (!Logger._quoteTimer) {
        Logger._quoteTimer = setTimeout(() => {
          Logger._quoteTimer = 0;
          const cur = session();
          if (cur && cur.phase === 'quote') persist(HybridSession.ackQuote(cur));
        }, 1600);
      }
    }
  }

  let lastRate = { key: '', at: 0 };
  let lastRowLog = { memberId: '', index: -1, at: 0 };
  const Logger = {
    openStored,
    sidesFor,
    _persistTimer: persistTimer,
    _sideHtml: sideHtml,
    _columnLabel: columnLabel,
    open,
    close,
    paint,
    setField(memberId, field, raw) {
      if (!['reps', 'kg'].includes(field)) return;
      updateSetFlow(memberId, f => ({ ...f, error: '', draft: { ...f.draft, [field]: raw } }), false);
    },
    setEffort(memberId, raw) {
      const effort = EFFORTS[Number(raw)];
      if (!effort) return;
      updateSetFlow(memberId, f => ({ ...f, error: '', draft: { ...f.draft, effort } }), false);
      const slider = document.getElementById(`setEffort-${memberId}`);
      if (!slider || slider.disabled) return;
      slider.setAttribute('aria-valuetext', effort === 'medium' ? 'Medium' : effortShort(effort));
      document.getElementById(`effortHeading-${memberId}`).textContent = 'This set felt';
      document.getElementById(`effortValue-${memberId}`).textContent = effort === 'medium' ? 'Medium' : effortShort(effort);
      document.getElementById(`effortHelp-${memberId}`).textContent = EFFORT_COPY[effort];
      slider.closest('.log-active-set').querySelector('.log-set-error').textContent = '';
    },
    rate(memberId, raw) {
      // Dan: one tap on the rating logs the set; a duplicate event from the same tap is ignored.
      const now = Date.now(), key = String(memberId);
      if (lastRate.key === key && now - lastRate.at < 600) return;
      lastRate = { key, at: now };
      Logger.setEffort(memberId, raw);
      const page = HybridSession.currentPage(session());
      const lift = page.logMode === 'superset' ? HybridSession.memberOf(page, memberId) : page;
      if (!lift) return;
      const f = setFlow(session(), lift);
      Logger.saveSet(memberId);
      // A slow save can delay the same tap's trailing events past the window; time it from the end.
      lastRate = { key, at: Date.now() };
    },
    setIncomplete(memberId) {
      updateSetFlow(memberId, f => ({ ...f, error: '', draft: { ...f.draft, miss: !f.draft.miss, effort: null } }));
    },
    editSet(memberId, index) {
      updateSetFlow(memberId, (f, lift, s) => {
        const r = s.logs[lift.id].sets[index];
        return r && r.logged ? { index, editing: true, rest: false, draft: { reps: r.reps, kg: r.kg, effort: r.effort || null, miss: !!r.miss } } : f;
      });
    },
    startSet(memberId) {
      updateSetFlow(memberId, f => ({ ...f, rest: false, editing: false }));
      const t = timerState();
      if (t.mode === 'rest' && t.display === 'docked') persistTimer(HybridTimer.stop(t));
    },
    saveSet(memberId) {
      const s = session();
      const page = HybridSession.currentPage(s);
      const lift = page.logMode === 'superset' ? HybridSession.memberOf(page, memberId) : page;
      if (!lift || lift.id !== memberId) return;
      const f = setFlow(s, lift);
      if (f.index < 0) return;
      const reps = Number(f.draft.reps), kg = Number(f.draft.kg);
      const candidate={...f.draft,reps:f.draft.reps===''?null:reps,kg:f.draft.kg===''||f.draft.kg==null?null:kg};
      const error=root.TrainingCore.validateRow(candidate,lift).error;
      if (error) { updateSetFlow(memberId, flow => ({ ...flow, error })); revealSetError(); return; }
      if (f.rest) { const t = timerState(); if (t && t.mode === 'rest') root.S.timer = HybridTimer.stop(t); }
      const patch = { reps, miss: !!f.draft.miss, effort: f.draft.miss ? null : f.draft.effort };
      if (lift.logMode === 'kg') patch.kg = f.draft.kg === '' || f.draft.kg == null || !Number.isFinite(kg) ? null : kg;
      const selectedRest=restAfterRound(s,page,memberId,f.index)?restMilliseconds(s,page):0;
      patch.context={requestedRestSec:selectedRest?Math.round(selectedRest/1000):null,elapsedRestSec:null};
      const next = HybridSession.logSet(s, f.index, patch, memberId);
      const rows = next.logs[memberId].sets;
      const index = rows.findIndex(r => !r.logged && !r.skipped);
      const adjustment = feedBrainNext(next, lift, s.id);
      const r = rows[index];
      next.loggerSetFlow = { ...(next.loggerSetFlow || {}), [memberId]: {
        index, rest: !f.editing && index >= 0, editing: false, adjustment,
        draft: { reps: r && r.reps != null ? r.reps : '', kg: r && r.kg != null ? r.kg : '', effort: null, miss: false },
      } };
      if (!f.editing && restAfterRound(s, page, memberId, f.index)) startChosenRest(next, page);
      persist(next);
    },
    gotQuote() {
      if (Logger._quoteTimer) { clearTimeout(Logger._quoteTimer); Logger._quoteTimer = 0; }
      persist(HybridSession.ackQuote(session()));
    },
    gotCoach() { persist(HybridSession.ackCoach(session())); },
    next() { moveExercise(1); },
    prev() { moveExercise(-1); },
    complete() { persist(HybridSession.completeCurrent(session())); },
    note(memberId, v) {
      const s = JSON.parse(JSON.stringify(session()));
      const page = HybridSession.currentPage(s);
      const id = page.logMode === 'superset' ? memberId : page.id;
      s.logs[id].note = v;
      root.S.session = s; root.save();
    },
    focusPad(memberId, setIndex, field) {
      const s = session();
      const page = HybridSession.currentPage(s);
      const lift = page.logMode === 'superset' ? HybridSession.memberOf(page, memberId) : page;
      const row = s.logs[lift.id].sets[setIndex];
      const seed = field === 'kg' ? row.kg : field === 'reps' ? row.reps : (row.cells && row.cells[field]);
      pad = { ...root.TrainingCore.numberEntry(seed,{key:field === 'kg' ? 'weight_kg' : field}),memberId:lift.id,setIndex,field,miss:!!row.miss }; installPadGuard();
      paint();
    },
    closePad() { pad = null; paint(); },
    padKey(k) {
      if (!pad) return;
      pad = root.TrainingCore.numberKey(pad,k); paint();
    },
    padClear() { if(pad){pad=root.TrainingCore.numberKey(pad,'clear');paint();} },
    focusDraftPad(memberId,field) {const page=HybridSession.currentPage(session());const lift=page.logMode==='superset'?HybridSession.memberOf(page,memberId):page;const f=setFlow(session(),lift);pad={...root.TrainingCore.numberEntry(f.draft[field],{key:field==='kg'?'weight_kg':'reps'}),memberId,field,draft:true};installPadGuard();paint();},
    markMissRow(memberId,index) {const row=session().logs[memberId].sets[index];persist(HybridSession.logSet(session(),index,{miss:!row.miss},memberId,{commit:false}));},
    rateRow(memberId,index,value) {
      // One tap: rating a row logs it (validation still applies); re-rating a logged row just updates its effort.
      const effort=EFFORTS[Number(value)];if(!effort)return;
      const was=session().logs[memberId]?.sets?.[index];
      if(was&&was.logged){persist(HybridSession.logSet(session(),index,{effort},memberId));return;}
      // The repaint puts the next row's slider under the same finger; its trailing event must not log that row.
      if(lastRowLog.memberId===memberId&&lastRowLog.index!==index&&Date.now()-lastRowLog.at<600)return;
      root.S.session=HybridSession.logSet(session(),index,{effort},memberId,{commit:false});
      Logger.check(memberId,index);
      if(session().logs[memberId]?.sets?.[index]?.logged)lastRowLog={memberId,index,at:Date.now()};
    },
    startHold(memberId, index) {
      const s = session();
      const page = HybridSession.currentPage(s);
      const lift = page.logMode === 'superset' ? HybridSession.memberOf(page, memberId) : page;
      const seconds = Number(lift.prescribed) || 30;
      let next = HybridTimer.create();
      next.mode = 'countdown';
      next.config = { totalMs: seconds * 1000, countInMs: 3000, plainCount: true, hold: { memberId: lift.id, setIndex: index } };
      if (sidesFor(lift) === 2) next.config.prepSide = 1;
      next.view = 'setup';
      next = HybridTimer.start(next, Date.now());
      persistTimer(next);
    },
    stopHold() {
      const timer = timerState();
      if (!(timer.config && timer.config.hold)) return;
      if (continueHold(timer, Date.now())) return;
      recordHold(timer, Date.now());
      persistTimer(HybridTimer.stop(timer));
    },
    skipHold() { Logger.stopHold(); },

    padMiss() { if (pad) { pad.miss = !pad.miss; paint(); } },
    padLog() {
      if(!pad)return;
      const n=root.TrainingCore.parse(pad.buffer,pad.key);
      if(n==null){pad.error='Enter a valid value.';paint();return;}
      if(pad.draft){const entry=pad;pad=null;Logger.setField(entry.memberId,entry.field,n);paint();return;}
      const patch=pad.field==='kg'?{kg:n}:pad.field==='reps'?{reps:n}:{cells:{[pad.field]:n}};
      const next=HybridSession.logSet(session(),pad.setIndex,patch,pad.memberId,{commit:false});
      pad=null;persist(next);
    },
    padDismiss() {
      // A tap outside the keypad keeps the entry and closes the pad WITHOUT repainting, so that tap still lands.
      if(!pad)return false;
      const entry=pad,n=root.TrainingCore.parse(entry.buffer,entry.key);pad=null;
      if(n!=null){
        if(entry.draft)updateSetFlow(entry.memberId,f=>({...f,error:'',draft:{...f.draft,[entry.field]:n}}),false);
        else{const patch=entry.field==='kg'?{kg:n}:entry.field==='reps'?{reps:n}:{cells:{[entry.field]:n}};root.S.session=HybridSession.logSet(session(),entry.setIndex,patch,entry.memberId,{commit:false});if(typeof root.save==='function')root.save();}
      }
      const el=document.getElementById('logger');const node=el&&el.querySelector?el.querySelector('.log-pad'):null;if(node&&node.remove)node.remove();
      // Show the committed value in its field straight away; no repaint, so the outside tap still lands.
      if(n!=null&&el&&el.querySelector){
        const cell=el.querySelector(`[data-pad-cell="${entry.memberId}|${entry.draft?'d':entry.setIndex}|${entry.field}"]`);
        if(cell){
          const page=HybridSession.currentPage(session());const lift=page&&page.logMode==='superset'?HybridSession.memberOf(page,entry.memberId):page;
          const text=entry.draft?(entry.field==='kg'&&lift?weightText(lift,n):String(n)):String(root.TrainingCore.format(n,entry.key));
          if(cell.tagName==='INPUT')cell.value=text;else{cell.textContent=text;if(cell.classList)cell.classList.remove('ph','focus');}
        }
      }
      return true;
    },
    padAutofill() {
      if(!pad)return;
      if(pad.draft){
        const entry=pad,n=root.TrainingCore.parse(entry.buffer,entry.key);if(n==null){pad.error='Enter a valid value.';paint();return;}
        const page=HybridSession.currentPage(session());const lift=page.logMode==='superset'?HybridSession.memberOf(page,entry.memberId):page;
        const f=setFlow(session(),lift),patch=entry.field==='kg'?{kg:n}:{reps:n};
        let next=session();const rows=next.logs[lift.id].sets;
        for(let i=Math.max(0,f.index)+1;i<rows.length;i++)if(!rows[i].logged&&!rows[i].skipped)next=HybridSession.logSet(next,i,patch,lift.id,{commit:false});
        pad=null;root.S.session=next;updateSetFlow(entry.memberId,fl=>({...fl,error:'',draft:{...fl.draft,[entry.field]:n}}),false);persist(session());return;
      }
      let n=root.TrainingCore.parse(pad.buffer,pad.key);
      if(n==null){const prev=(session().logs[pad.memberId]?.sets||[]).slice(0,pad.setIndex).reverse().map(r=>pad.field==='kg'?r.kg:pad.field==='reps'?r.reps:r.cells?.[pad.field]).find(v=>v!=null&&v!=='');if(prev!=null)n=Number(prev);}
      if(n==null||!Number.isFinite(n)){pad.error='Enter a valid value.';paint();return;}
      const patch=pad.field==='kg'?{kg:n}:pad.field==='reps'?{reps:n}:{cells:{[pad.field]:n}};
      let next=HybridSession.logSet(session(),pad.setIndex,patch,pad.memberId,{commit:false});
      const rows=next.logs[pad.memberId].sets;
      for(let i=pad.setIndex+1;i<rows.length;i++)if(!rows[i].logged)next=HybridSession.logSet(next,i,patch,pad.memberId,{commit:false});
      pad=null;persist(next);
    },
    check(memberId, i) {
      const s = session();
      const page = HybridSession.currentPage(s);
      const lift = page.logMode === 'superset' ? HybridSession.memberOf(page, memberId) : page;
      const row = s.logs[lift.id].sets[i];
      // Each-side carries keep one row of per-side metres (prescribed per side);
      // side 2 confirms the same distance and totals() counts both sides.
      if (!row.logged && isEachSideCarry(lift) && carrySide(s, lift.id) < 2) {
        const result = root.TrainingCore.validateRow(row, lift);
        if (!result.ok) { toast = result.error; paint(); return; }
        toast = '';
        const next = JSON.parse(JSON.stringify(s));
        next.loggerSides = { ...(next.loggerSides || {}), [lift.id]: 2 };
        persist(next);
        return;
      }
      if (!row.logged) {const result=root.TrainingCore.validateRow(row,lift);if(!result.ok){toast=result.error;paint();return;}toast='';const next=HybridSession.logSet(s,i,{},lift.id);feedBrainNext(next,lift,s.id);if(isEachSideCarry(lift))next.loggerSides={...(next.loggerSides||{}),[lift.id]:1};if(restAfterRound(s,page,lift.id,i))startChosenRest(s,page);persist(next);}
      else persist(HybridSession.toggleLogged(s, i, lift.id));
    },
    unit() {
      // Strength logging is kg-only; a stored lb flag would only relabel kg numbers.
      const s = JSON.parse(JSON.stringify(session()));
      s.unit = 'kg';
      persist(s);
    },
    nudgeSets(memberId, dir) {
      const s = JSON.parse(JSON.stringify(session()));
      const page = HybridSession.currentPage(s);
      const lift = page.logMode === 'superset' ? HybridSession.memberOf(page, memberId) : page;
      const log = s.logs[lift.id];
      if (dir > 0) {
        let reps=lift.logMode==='max'?null:lift.targetReps;
        try{const last=root.StrengthTargets.normalize(lift).filter(t=>t.purpose==='working').at(-1);if(last?.reps)reps=last.reps.min;}catch{}
        log.sets.push({
          reps,
          kg: null,
          id: root.crypto.randomUUID(),
          purpose: 'working',
          cells: {},
          logged: false,
          miss: false,
        });
      } else if (log.sets.filter(r=>r.purpose!=='ramp').length > 1) log.sets.pop();
      persist(s);
    },
    doneTraining() { pad = null; persist(HybridSession.openFeel(session())); },
    feelIntensity(n) { persist(HybridSession.setFeel(session(), { intensity: n })); },
    feelMins(d) {
      const cur = (session().feel && session().feel.durationMin) || 1;
      persist(HybridSession.setFeel(session(), { durationMin: Math.max(1, cur + d) }));
    },
    feelNote(v) { root.S.session = HybridSession.setFeel(session(), { note: v }); root.save(); },
    finish() { persist(HybridSession.finishToSummary(session())); },
    chevron() {
      const t = timerState();
      const snap = HybridTimer.snapshot(t, Date.now());
      if ((snap.view === 'running' || snap.view === 'countIn') && snap.display === 'fullscreen') persistTimer(HybridTimer.collapse(t));
      else if (snap.view === 'picker') persistTimer(HybridTimer.closePicker(t));
      else if (snap.view === 'setup') persistTimer(HybridTimer.stop(t));
      else close();
    },
    timerOpen() { persistTimer(HybridTimer.openPicker(timerState())); },
    timerPlay() { persistTimer(HybridTimer.play(timerState(), Date.now())); },
    timerChoose(id) { const timer = HybridTimer.choose(timerState(), id); persistTimer(timer); },
    timerClosePicker() { const timer=timerState(); if(timer.view==='setup') rememberRest(timer); persistTimer(HybridTimer.closePicker(timer)); },
    timerSwitch() { persistTimer(HybridTimer.openPicker(HybridTimer.stop(timerState()))); },
    timerQuick(ms) { persistTimer(HybridTimer.quickStart(timerState(), ms)); },
    timerNudge(dir) { persistTimer(HybridTimer.nudgeRest(timerState(), dir)); },
    timerStart() { const timer = HybridTimer.start(timerState(), Date.now()); rememberRest(timer); persistTimer(timer); },
    timerReset() { persistTimer(HybridTimer.reset(timerState(), Date.now())); },
    timerPause() { persistTimer(HybridTimer.togglePause(timerState(), Date.now())); },
    timerTapDock() { persistTimer(HybridTimer.openStopSheet(timerState())); },
    timerStop() { persistTimer(HybridTimer.stop(timerState())); },
    timerCancelStop() { persistTimer(HybridTimer.cancelStopSheet(timerState())); },
    timerField(key, raw) {
      const n = Number(raw);
      if (!Number.isFinite(n)) return;
      const t = timerState();
      const c = { ...(t.config || {}) };
      if (key === 'countInSec') c.countInMs = Math.max(0, n) * 1000;
      if (key === 'rounds') c.rounds = Math.max(1, n);
      if (key === 'workMin') c.workMs = Math.max(0, n) * 60000 + ((c.workMs || 0) % 60000);
      if (key === 'restMin') c.restMs = Math.max(0, n) * 60000 + ((c.restMs || 0) % 60000);
      if (key === 'workSec') {
        c.workMs = t.mode === 'tabata' ? Math.max(1, n) * 1000
          : Math.floor((c.workMs || 0) / 60000) * 60000 + Math.max(0, n) * 1000;
      }
      if (key === 'restSec') {
        c.restMs = t.mode === 'tabata' ? Math.max(0, n) * 1000
          : Math.floor((c.restMs || 0) / 60000) * 60000 + Math.max(0, n) * 1000;
      }
      if (key === 'totalMin') c.totalMs = n * 60000 + ((c.totalMs || 0) % 60000);
      if (key === 'totalSec') c.totalMs = Math.floor((c.totalMs || 0) / 60000) * 60000 + n * 1000;
      if (key === 'everyMin') c.everyMs = n * 60000 + ((c.everyMs || 0) % 60000);
      if (key === 'everySec') c.everyMs = Math.floor((c.everyMs || 0) / 60000) * 60000 + n * 1000;
      persistTimer(HybridTimer.patch(t, c));
    },
  };

  root.Logger = Logger;
})(typeof window !== 'undefined' ? window : globalThis);
