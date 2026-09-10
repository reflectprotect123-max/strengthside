(function (root) {
  const QUOTE = 'You can’t do in a race what you haven’t prepared for.';
  const COACH = 'Train with intent. Log every set. Leave the gym already recovering. Rest as prescribed — the clock comes next.';

  let pad = null;
  let sheet = null;
  let toast = '';
  let toastTimer = 0;
  let clockTimer = 0;

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function session() {
    return root.S && root.S.session;
  }

  function persist(next) {
    root.S.session = next;
    root.S.loggerOpen = true;
    if (typeof root.save === 'function') root.save();
    paint();
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
    const existing = root.S.session && root.S.session.date === d && root.S.session.phase !== 'summary'
      ? root.S.session
      : null;
    if (letter && existing) {
      root.S.session = HS.goToLetter(HS.startSession({ date: d, plan: p, existing }), letter);
    } else if (letter) {
      root.S.session = HS.startSession({ date: d, plan: p, letter });
    } else {
      root.S.session = HS.startSession({ date: d, plan: p, existing });
    }
    root.S.loggerOpen = true;
    if (typeof root.save === 'function') root.save();
    document.getElementById('logger').classList.remove('hidden');
    document.getElementById('shell').classList.add('logger-open');
    if (typeof root.syncFab === 'function') root.syncFab();
    startClock();
    paint();
  }

  function close() {
    root.S.loggerOpen = false;
    pad = null;
    sheet = null;
    if (typeof root.save === 'function') root.save();
    const el = document.getElementById('logger');
    if (el) el.classList.add('hidden');
    const shell = document.getElementById('shell');
    if (shell) shell.classList.remove('logger-open');
    stopClock();
    if (typeof root.syncFab === 'function') root.syncFab();
    if (typeof root.render === 'function') root.render();
  }

  function startClock() {
    stopClock();
    clockTimer = setInterval(() => {
      const clock = document.getElementById('logClock');
      if (clock) clock.textContent = elapsed();
    }, 1000);
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
        <button type="button" class="log-back-x" onclick="Logger.close()" aria-label="Close">⌄</button>
        <div class="log-dots">${dotsHtml(s)}</div>
        <div class="log-clock" id="logClock">${elapsed()}</div>
      </div>
      <div class="log-totals">
        <div><b>${t.reps}</b><span>REPS</span></div>
        <div><b>${t.kg}</b><span>KG</span></div>
      </div>`;
  }

  function barHtml(s) {
    const atStart = s.blockIndex === 0;
    const atEnd = s.blockIndex === s.pages.length - 1;
    return `
      <div class="log-bar">
        <button type="button" class="log-bar-btn" onclick="Logger.prev()" ${atStart ? 'disabled' : ''}>← Back</button>
        <button type="button" class="log-play" aria-label="Rest timer coming later">▶</button>
        <button type="button" class="log-bar-btn" onclick="Logger.next()" ${atEnd ? 'disabled style="opacity:.35"' : ''}>Next →</button>
      </div>`;
  }

  function quoteHtml() {
    return `<div class="log-quote"><p>${esc(QUOTE)}</p></div>`;
  }

  function coachHtml() {
    return `
      <div class="log-coach">
        <h1>Coach Instructions</h1>
        <p>${esc(COACH)}</p>
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

  function sideHtml(s, page) {
    const wm = (s.workingMax && s.workingMax[page.id]) || '';
    return `
      <div class="log-meta-row">
        <div class="log-thumb">▶</div>
        <div class="log-side">
          <div class="log-side-row"><span>GOAL <small>PRO</small></span><button type="button" class="log-add" onclick="Logger.sheet('goal')">Add</button></div>
          <div class="log-side-row"><span>WORKING MAX</span><button type="button" class="log-add" onclick="Logger.sheet('wm')">${wm ? esc(wm) + ' >' : 'Add >'}</button></div>
          <div class="log-side-row"><span>LAST</span><span>${wm ? esc(wm) : 'None'}</span></div>
        </div>
      </div>`;
  }

  function tableHtml(s, page, log) {
    const kgCol = page.logMode === 'kg';
    const mid = esc(page.id);
    const rows = (log.sets || []).map((row, i) => {
      const focusKg = pad && pad.memberId === page.id && pad.setIndex === i && pad.field === 'kg';
      const focusReps = pad && pad.memberId === page.id && pad.setIndex === i && pad.field === 'reps';
      const repsLabel = row.reps == null ? 'MAX' : row.reps;
      return `<tr>
        <td>${i + 1}</td>
        <td><button type="button" class="log-cell${focusReps ? ' focus' : ''}${row.reps == null ? ' ph' : ''}" onclick="Logger.focusPad('${mid}',${i},'reps')">${esc(repsLabel)}</button></td>
        ${kgCol ? `<td><button type="button" class="log-cell${focusKg ? ' focus' : ''}" onclick="Logger.focusPad('${mid}',${i},'kg')">${row.kg == null ? '' : esc(row.kg)}</button></td>` : ''}
        <td><button type="button" class="log-check${row.logged ? ' on' : ''}" onclick="Logger.check('${mid}',${i})">${row.logged ? '✓' : ''}</button></td>
      </tr>`;
    }).join('');
    return `
      <p class="log-rx">${esc(page.prescription)}${page.notes && page.notes.length ? '' : ''}</p>
      ${page.notes && page.notes.length ? `<ul class="log-notes">${page.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
      <table class="log-table">
        <thead><tr><th>Sets</th><th>Reps</th>${kgCol ? '<th>Kg</th>' : ''}<th></th></tr></thead>
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
        <img src="assets/hpp-logo.jpg" alt="Hybrid Power Project">
        <button type="button" class="log-primary" onclick="Logger.doneTraining()">Done Training</button>
        <p class="log-or">OR</p>
        <p>Want to add more?</p>
        <button type="button" class="log-link" onclick="Logger.addExercise()">Add Exercise</button>
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

  function summaryHtml(s) {
    const st = HybridSession.summaryStats(s);
    return `
      <div class="log-sum">
        <p class="log-kicker">${esc(s.date)}</p>
        <h2 class="log-title">Heavy Lower</h2>
        <div class="log-stat"><span>Exercises</span><b>${st.exercises}</b></div>
        <div class="log-stat"><span>Sets</span><b>${st.sets}</b></div>
        <div class="log-stat"><span>Reps</span><b>${st.reps}</b></div>
        <div class="log-stat"><span>Blocks</span><b>${st.blocksDone}/${st.blocksTotal}</b></div>
        <div class="log-stat"><span>Minutes</span><b>${st.minutes}</b></div>
        <button type="button" class="log-primary" onclick="Logger.close()">Close</button>
      </div>`;
  }

  function padHtml() {
    if (!pad) return '';
    const unit = (session().unit || 'kg') === 'lb' ? 'lb' : 'kg';
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];
    const keyBtns = keys.map((k) => `<button type="button" onclick="Logger.padKey('${k}')">${k}</button>`).join('');
    return `
      <div class="log-pad">
        <div class="log-pad-head">
          <div>
            <span class="log-pad-val">${esc(pad.buffer || '0')}</span>
            ${pad.field === 'kg' ? `<span class="log-unit">
              <button type="button" class="${unit === 'kg' ? 'on' : ''}" onclick="Logger.unit('kg')">Kg</button>
              <button type="button" class="${unit === 'lb' ? 'on' : ''}" onclick="Logger.unit('lb')">Lb</button>
            </span>` : `<span style="margin-left:8px;opacity:.6">REPS</span>`}
          </div>
          <button type="button" onclick="Logger.closePad()">⌄</button>
        </div>
        <div class="log-keys">
          ${keyBtns}
          <div class="log-pad-side" style="grid-column:4;grid-row:1 / span 4">
            <button type="button" class="blue" onclick="Logger.padLog()">Log</button>
            <button type="button" class="blue" onclick="Logger.padAutofill()">Autofill</button>
            <button type="button" class="log-miss${pad.miss ? ' on' : ''}" onclick="Logger.padMiss()">Miss</button>
          </div>
        </div>
      </div>`;
  }

  function sheetHtml(s) {
    if (!sheet) return '';
    if (sheet === 'goal') {
      return `
        <div class="log-sheet" onclick="if(event.target===this)Logger.sheet(null)">
          <div class="log-sheet-card">
            <h2>Set a new goal</h2>
            <p>Track a target for this lift. Hybrid keeps this on the phone for now.</p>
            <button type="button" class="log-primary" onclick="Logger.sheet(null)">Got it</button>
          </div>
        </div>`;
    }
    const page = HybridSession.currentPage(s);
    const cur = (s.workingMax && s.workingMax[page.id]) || '';
    return `
      <div class="log-sheet" onclick="if(event.target===this)Logger.sheet(null)">
        <div class="log-sheet-card">
          <h2>Working max</h2>
          <input id="wmInput" type="number" inputmode="decimal" value="${esc(cur)}" placeholder="kg">
          <button type="button" class="log-primary" onclick="Logger.saveWm()">Save</button>
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
      const members = (page.members || []).map((m) => `
        <section class="log-ss-member">
          <h2 class="log-title">${esc(m.letter)}. ${esc(m.title)}</h2>
          ${m.logMode === 'kg' ? sideHtml(s, m) : ''}
          ${tableHtml(s, m, s.logs[m.id] || { sets: [], note: '' })}
        </section>`).join('');
      body = `
        <p class="log-kicker">${esc(page.letter)}. ${esc(page.section)}</p>
        <div class="log-ss">${members}</div>`;
    } else {
      body = `
        <p class="log-kicker">${esc(page.letter)}. ${esc(page.section)}</p>
        <h2 class="log-title">${esc(page.title)}</h2>
        ${page.logMode === 'kg' ? sideHtml(s, page) : ''}
        ${tableHtml(s, page, log)}`;
    }
    return `${headerHtml(s)}<div class="log-body">${body}</div>${barHtml(s)}${padHtml()}${sheetHtml(s)}`;
  }

  function paint() {
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
    el.innerHTML = `<div class="log-screen">${toast ? `<div class="log-toast">${esc(toast)}</div>` : ''}${inner}</div>`;
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

  const Logger = {
    open,
    close,
    paint,
    gotQuote() {
      if (Logger._quoteTimer) { clearTimeout(Logger._quoteTimer); Logger._quoteTimer = 0; }
      persist(HybridSession.ackQuote(session()));
    },
    gotCoach() { persist(HybridSession.ackCoach(session())); },
    next() { pad = null; persist(HybridSession.nextPage(session())); },
    prev() { pad = null; persist(HybridSession.prevPage(session())); },
    complete() { persist(HybridSession.completeCurrent(session())); },
    note(memberId, v) {
      const s = JSON.parse(JSON.stringify(session()));
      const page = HybridSession.currentPage(s);
      const id = page.logMode === 'superset' ? memberId : page.id;
      s.logs[id].note = v;
      persist(s);
    },
    focusPad(memberId, setIndex, field) {
      const s = session();
      const page = HybridSession.currentPage(s);
      const lift = page.logMode === 'superset' ? HybridSession.memberOf(page, memberId) : page;
      const row = s.logs[lift.id].sets[setIndex];
      const seed = field === 'kg' ? row.kg : row.reps;
      pad = { memberId: lift.id, setIndex, field, buffer: seed == null ? '' : String(seed), miss: !!row.miss };
      paint();
    },
    closePad() { pad = null; paint(); },
    padKey(k) {
      if (!pad) return;
      if (k === '⌫') pad.buffer = String(pad.buffer || '').slice(0, -1);
      else pad.buffer = `${pad.buffer || ''}${k}`.replace(/^0+(\d)/, '$1');
      paint();
    },
    padMiss() { if (pad) { pad.miss = !pad.miss; paint(); } },
    padLog() {
      if (!pad) return;
      const n = Number(pad.buffer);
      const patch = { miss: pad.miss };
      if (pad.field === 'kg') patch.kg = n;
      else patch.reps = n;
      let s = HybridSession.logSet(session(), pad.setIndex, patch, pad.memberId);
      if (pad.field === 'kg' && n > 0) {
        const page = HybridSession.currentPage(s);
        const lift = page.logMode === 'superset' ? HybridSession.memberOf(page, pad.memberId) : page;
        const prev = Math.max(0, ...s.logs[lift.id].sets.filter((r, i) => i !== pad.setIndex && r.logged).map((r) => r.kg || 0));
        if (n >= prev && lift.targetReps) {
          toast = `New ${lift.targetReps} Rep Max!`;
          clearTimeout(toastTimer);
          toastTimer = setTimeout(() => { toast = ''; paint(); }, 2200);
        }
      }
      pad = null;
      persist(s);
    },
    padAutofill() {
      if (!pad) return;
      const idx = pad.setIndex;
      const n = Number(pad.buffer);
      const patch = { miss: pad.miss };
      if (pad.field === 'kg') patch.kg = n;
      else patch.reps = n;
      let s = HybridSession.logSet(session(), idx, patch, pad.memberId);
      s = HybridSession.autofillFrom(s, idx, pad.memberId);
      pad = null;
      persist(s);
    },
    check(memberId, i) {
      const s = session();
      const page = HybridSession.currentPage(s);
      const lift = page.logMode === 'superset' ? HybridSession.memberOf(page, memberId) : page;
      const row = s.logs[lift.id].sets[i];
      if (!row.logged) persist(HybridSession.logSet(s, i, {}, lift.id));
      else persist(HybridSession.toggleLogged(s, i, lift.id));
    },
    unit(u) {
      const s = JSON.parse(JSON.stringify(session()));
      s.unit = u;
      persist(s);
    },
    nudgeSets(memberId, dir) {
      const s = JSON.parse(JSON.stringify(session()));
      const page = HybridSession.currentPage(s);
      const lift = page.logMode === 'superset' ? HybridSession.memberOf(page, memberId) : page;
      const log = s.logs[lift.id];
      if (dir > 0) {
        log.sets.push({
          reps: lift.logMode === 'max' ? null : lift.targetReps,
          kg: null,
          logged: false,
          miss: false,
        });
      } else if (log.sets.length > 1) log.sets.pop();
      persist(s);
    },
    sheet(kind) { sheet = kind; paint(); },
    saveWm() {
      const input = document.getElementById('wmInput');
      const page = HybridSession.currentPage(session());
      persist(HybridSession.setWorkingMax(session(), page.id, input && input.value));
      sheet = null;
      paint();
    },
    doneTraining() { pad = null; persist(HybridSession.openFeel(session())); },
    addExercise() { window.alert('Add Exercise — builder lands in a later slice.'); },
    feelIntensity(n) { persist(HybridSession.setFeel(session(), { intensity: n })); },
    feelMins(d) {
      const cur = (session().feel && session().feel.durationMin) || 1;
      persist(HybridSession.setFeel(session(), { durationMin: Math.max(1, cur + d) }));
    },
    feelNote(v) { persist(HybridSession.setFeel(session(), { note: v })); },
    finish() { persist(HybridSession.finishToSummary(session())); },
  };

  root.Logger = Logger;
})(typeof window !== 'undefined' ? window : globalThis);
