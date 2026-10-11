(function (root) {
  let numberPad = null;
  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function lib() {
    const Lib = root.HybridLibrary;
    root.S.library = Lib.ensure(root.S.library);
    root.S.libUi = root.S.libUi || { screen: 'list', tid: null, tab: 'exercises', q: '', selected: [], draft: {}, date: '', bid: null };
    return root.S.library;
  }

  function ui() {
    lib();
    return root.S.libUi;
  }

  function save(opts) {
    if (typeof root.save === 'function') root.save();
    if (opts && opts.paint === false) {
      refreshResults();
      return;
    }
    if (typeof root.render === 'function') root.render();
  }

  function refreshResults() {
    const doc = typeof document !== 'undefined' ? document : root.document;
    const el = doc && doc.getElementById && doc.getElementById('libResults');
    if (!el) return;
    const screen = ui().screen;
    if (screen === 'picker' || screen === 'newEx' || screen === 'newCirc') el.innerHTML = pickerRowsHtml();
    else if (screen === 'list') el.innerHTML = listCardsHtml();
  }

  function setLib(next) {
    root.S.library = next;
    save();
  }

  function go(screen, extra) {
    root.S.libUi = { ...ui(), screen, ...(extra || {}) };
    save();
  }

  function trackOptions(selected) {
    const skip = new Set(['for_completion']);
    return ['none', ...root.HybridLibrary.TRACK.filter((t) => !skip.has(t.key)).map((t) => t.key)]
      .map((k) => {
        const label = k === 'none' ? 'None' : root.HybridLibrary.trackLabel(k);
        return `<option value="${esc(k)}" ${k === selected ? 'selected' : ''}>${esc(label)}</option>`;
      })
      .join('');
  }

  function listCardsHtml() {
    const st = lib();
    const q = String(ui().q || '').toLowerCase();
    const rows = st.templates.filter((t) => !q || t.title.toLowerCase().includes(q) || t.blocks.some((b) => (b.title || '').toLowerCase().includes(q)));
    if (!rows.length) {
      return `<div class="lib-empty"><b>No session templates yet</b><p>Create one, then drop it on a Training day.</p></div>`;
    }
    return rows.map((t) => {
      const names = root.HybridLibrary.lettered(t).map((b) => b.title).join(', ') || 'Empty template';
      return `<article class="lib-card">
          <button type="button" style="text-align:left;width:100%" onclick="LibraryView.open('${esc(t.id)}')">
            <h2>${esc(t.title)}</h2>
            <p>${esc(names)}</p>
          </button>
          <div class="lib-card-actions">
            <button type="button" class="lib-chip" onclick="LibraryView.calendar('${esc(t.id)}')">Add to calendar</button>
            <button type="button" class="lib-danger" onclick="LibraryView.removeTpl('${esc(t.id)}')">Delete</button>
          </div>
        </article>`;
    }).join('');
  }

  function listHtml() {
    return `
      <div class="shell-screen shell-screen--library">
        <div class="lib-top">
          <p class="lib-kicker">Library</p>
          <h1 class="lib-title">Sessions</h1>
        </div>
        <div class="lib-search">
          <input value="${esc(ui().q || '')}" placeholder="Search sessions" oninput="LibraryView.search(this.value)" aria-label="Search sessions">
        </div>
        <button type="button" class="lib-create" onclick="LibraryView.create()"><span class="lib-plus">+</span> Create Session Template</button>
        <div id="libResults">${listCardsHtml()}</div>
      </div>`;
  }

  function editorHtml() {
    const st = lib();
    const t = root.HybridLibrary.template(st, ui().tid);
    if (!t) return listHtml();
    const blocks = root.HybridLibrary.lettered(t);
    let body = '';
    blocks.forEach((b, i) => {
      const prev = blocks[i - 1];
      if (prev && prev.kind === 'lift' && b.kind === 'lift' && prev.groupId && prev.groupId === b.groupId) {
        body += `<div class="lib-ss">− Superset</div>`;
      }
      const meta = b.kind === 'circuit' ? 'For Completion' : root.HybridLibrary.rxFor(b);
      body += b.kind === 'lift' ? exerciseCardHtml(b) : `<article class="lib-block">
        <div class="lib-block-top">
          <span class="lib-letter">${esc(b.letter)}</span>
          <div style="flex:1">
            <h3>${esc(b.title)}</h3>
            <div class="meta">${esc(meta)}</div>
          </div>
          <button type="button" class="lib-text-btn" onclick="LibraryView.editBlock('${esc(b.id)}')">Edit</button>
          <button type="button" class="lib-danger" onclick="LibraryView.removeBlock('${esc(b.id)}')">Delete</button>
        </div>
      </article>`;
    });
    return `
      <div class="shell-screen shell-screen--library">
        <div class="lib-head-row">
          <button type="button" class="lib-back" onclick="LibraryView.goList()">←</button>
          <h1>Session Template</h1>
          <button type="button" class="lib-text-btn" onclick="LibraryView.reorder()">Reorder</button>
        </div>
        <div class="lib-field">
          <label>Title</label>
          <input value="${esc(t.title)}" onchange="LibraryView.patchTpl({title:this.value})">
        </div>
        <div class="lib-field">
          <label>Session instructions</label>
          <textarea placeholder="Coach notes for Start Session" onchange="LibraryView.patchTpl({instructions:this.value})">${esc(t.instructions)}</textarea>
        </div>
        ${body}
        <div style="padding:16px">
          <button type="button" class="lib-primary" onclick="LibraryView.calendar('${esc(t.id)}',true)">Post to calendar</button>
        </div>
        <div class="lib-row-btns">
          <button type="button" onclick="LibraryView.picker('exercises')">+ Add Exercise</button>
          <button type="button" onclick="LibraryView.picker('circuits')">+ Add Circuit</button>
        </div>
        ${editSheetHtml()}
      </div>`;
  }

  function blockTargets(b) {
    try { return root.StrengthTargets.normalize({ ...b, repTarget: b.repTarget || ((b.columns || []).includes('reps_range') ? '8-12' : '8') }); }
    catch { return []; }
  }
  function repText(target) {
    if (!target?.reps) return '';
    return target.reps.min === target.reps.max ? String(target.reps.min) : `${target.reps.min}-${target.reps.max}`;
  }
  function isRepMetric(key) {
    return key === 'reps' || key === 'reps_range';
  }
  function metricHeader(key) {
    return key ? root.HybridLibrary.trackLabel(key) : '';
  }
  function exerciseCardHtml(b) {
    const columns = (b.columns && b.columns.length ? b.columns : ['reps']).slice(0, 2);
    const c1 = columns[0] || 'reps';
    const c2 = columns[1] || 'none';
    const hasReps = columns.some(isRepMetric);
    const targets = hasReps ? blockTargets(b) : [];
    const rowCount = hasReps ? targets.length : Math.max(1, Number(b.setCount) || 3);
    const rowMetricHtml = (key, target, n, i) => {
      if (!key || key === 'none') return '<div></div>';
      if (isRepMetric(key)) {
        if (target?.purpose === 'amrap') return `<div class="lib-cell" aria-label="Set ${n} AMRAP">AMRAP</div>`;
        return `<button type="button" class="lib-cell" aria-label="Set ${n} reps" onclick="LibraryView.openNumberPad('set:${i}','${esc(b.id)}')">${esc(repText(target))}</button>`;
      }
      if (target?.purpose === 'amrap' && (key === 'weight_kg' || key === 'weight_lb')) return '<div class="lib-cell">Set 1 weight</div>';
      return '<div class="lib-cell"></div>';
    };
    const rows = Array.from({ length: rowCount }, (_, i) => {
      const t = targets[i];
      const n = i + 1;
      return `<span>${n}</span>${rowMetricHtml(c1, t, n, i)}${rowMetricHtml(c2, t, n, i)}`;
    }).join('');
    const amrap = targets.at(-1)?.purpose === 'amrap';
    const metric1Id = `libMetric1_${b.id}`;
    const metric2Id = `libMetric2_${b.id}`;
    return `<article class="lib-block lib-ex" data-block="${esc(b.id)}">
      <div class="lib-ex-top">
        <span class="lib-letter">${esc(b.letter)}</span>
        <h3>${esc(b.title)}</h3>
        <button type="button" class="lib-danger" aria-label="Delete ${esc(b.title)}" onclick="LibraryView.removeBlock('${esc(b.id)}')">Delete</button>
        <button type="button" class="lib-done" onclick="LibraryView.closeNumberPad()">Done</button>
      </div>
      <div class="meta">${esc(root.HybridLibrary.rxFor(b))}</div>
      <label class="lib-notes"><textarea placeholder="Add notes or instructions here" onchange="LibraryView.patchBlock({notes:this.value.split('\\n').filter(Boolean)},'${esc(b.id)}')">${esc((b.notes || []).join('\n'))}</textarea></label>
      <div class="lib-field lib-metrics">
        <label>What do you want to track?</label>
        <div class="lib-cols">
          <select id="${esc(metric1Id)}" aria-label="First metric for ${esc(b.title)}" onchange="LibraryView.setCols(this.value,document.getElementById('${esc(metric2Id)}').value,'${esc(b.id)}')">${trackOptions(c1)}</select>
          <select id="${esc(metric2Id)}" aria-label="Second metric for ${esc(b.title)}" onchange="LibraryView.setCols(document.getElementById('${esc(metric1Id)}').value,this.value,'${esc(b.id)}')">${trackOptions(c2)}</select>
        </div>
      </div>
      <div class="lib-grid">
        <span></span><div class="lib-grid-h">${esc(metricHeader(c1))}</div><div class="lib-grid-h">${esc(metricHeader(c2))}</div>
        ${rows}
      </div>
      <p role="status">${esc(ui().repError || ui().targetError || '')}</p>
      <div class="lib-stepper">
        <button type="button" class="lib-step" aria-label="Remove a set" onclick="LibraryView.nudgeSets(-1,'${esc(b.id)}')">−</button>
        <span>Set</span>
        <button type="button" class="lib-step" aria-label="Add a set" onclick="LibraryView.nudgeSets(1,'${esc(b.id)}')">+</button>
      </div>
      ${hasReps ? `<button type="button" class="lib-text-btn" onclick="LibraryView.toggleAmrap('${esc(b.id)}')">${amrap ? 'Remove AMRAP' : 'Add final AMRAP'}</button>` : ''}
    </article>`;
  }

  function editSheetHtml() {
    const u = ui();
    if (u.screen !== 'edit' || !u.bid) return '';
    const t = root.HybridLibrary.template(lib(), u.tid);
    const b = t && t.blocks.find((x) => x.id === u.bid);
    if (!b) return '';
    if (b.kind === 'circuit') {
      return `<div class="lib-sheet" onclick="if(event.target===this)LibraryView.closeSheet()">
        <div class="lib-sheet-card">
          <h2>Edit circuit</h2>
          <div class="lib-field"><label>Title</label><input value="${esc(b.title)}" onchange="LibraryView.patchBlock({title:this.value})"></div>
          <div class="lib-field"><label>Instructions</label><textarea onchange="LibraryView.patchBlock({instructions:this.value})">${esc(b.instructions || '')}</textarea></div>
          <button type="button" class="lib-primary" onclick="LibraryView.closeSheet()">Done</button>
        </div></div>`;
    }
    return '';
  }

  function pickerHtml() {
    const u = ui();
    const tab = u.tab || 'exercises';
    const selected = new Set(u.selected || []);
    const create = tab === 'circuits'
      ? `<button type="button" class="lib-create" onclick="LibraryView.newCirc()"><span class="lib-plus">+</span> Create New Circuit</button>`
      : `<button type="button" class="lib-create" onclick="LibraryView.newEx()"><span class="lib-plus">+</span> Create New Exercise</button>`;
    const n = selected.size;
    return `
      <div class="shell-screen shell-screen--library">
        <div class="lib-head-row">
          <button type="button" class="lib-back" onclick="LibraryView.open('${esc(u.tid)}')">←</button>
          <h1>${tab === 'circuits' ? 'Circuits' : 'Exercises'}</h1>
          <button type="button" class="lib-text-btn" ${n < 2 ? 'disabled' : ''} onclick="LibraryView.addPicked(true)">Superset</button>
          <button type="button" class="lib-text-btn" ${n < 1 ? 'disabled' : ''} onclick="LibraryView.addPicked(false)">Add${n ? ' (' + n + ')' : ''}</button>
        </div>
        <div class="lib-search"><input value="${esc(u.q || '')}" placeholder="Search exercises and circuits" oninput="LibraryView.search(this.value)"></div>
        <div class="lib-tabs">
          <button type="button" class="${tab === 'exercises' ? 'on' : ''}" onclick="LibraryView.picker('exercises')">Exercises</button>
          <button type="button" class="${tab === 'circuits' ? 'on' : ''}" onclick="LibraryView.picker('circuits')">Circuits</button>
        </div>
        ${create}
        <div id="libResults">${pickerRowsHtml()}</div>
        ${createSheetHtml()}
      </div>`;
  }

  function pickerRowsHtml() {
    const u = ui();
    const tab = u.tab || 'exercises';
    const hits = root.HybridLibrary.searchCatalog(lib(), tab, u.q);
    const selected = new Set(u.selected || []);
    return hits.map((h) => `
      <button type="button" class="lib-pick-row" onclick="LibraryView.togglePick('${esc(h.id)}')">
        <b>${esc(h.title)}</b>
        <span class="lib-radio${selected.has(h.id) ? ' on' : ''}"></span>
      </button>`).join('') || `<div class="lib-empty">No results. Create something new.</div>`;
  }

  function createSheetHtml() {
    const u = ui();
    if (u.screen === 'newEx') {
      const d = u.draft || {};
      return `<div class="lib-sheet" onclick="if(event.target===this)LibraryView.closeCreate()">
        <div class="lib-sheet-card">
          <h2>New Exercise</h2>
          <div class="lib-field"><label>Title</label><input id="libNewTitle" value="${esc(d.title || '')}" placeholder="Title"></div>
        <div class="lib-field"><label>What do you want to track?</label>
            <div class="lib-cols">
              <select id="libNewC1">${trackOptions(d.c1 || 'reps')}</select>
              <select id="libNewC2">${trackOptions(d.c2 || 'none')}</select>
            </div>
          </div>
          <button type="button" class="lib-primary" onclick="LibraryView.saveNewEx()">Create</button>
        </div></div>`;
    }
    if (u.screen === 'newCirc') {
      const d = u.draft || {};
      return `<div class="lib-sheet" onclick="if(event.target===this)LibraryView.closeCreate()">
        <div class="lib-sheet-card">
          <h2>New Circuit</h2>
          <div class="lib-field"><label>Title</label><input id="libNewTitle" value="${esc(d.title || '')}"></div>
        <div class="lib-field"><label>What do you want to track?</label>
            <select disabled><option>For Completion</option></select>
          </div>
          <div class="lib-field"><label>Instructions</label><textarea id="libNewInstr" placeholder="Ex. 3 rounds for time">${esc(d.instructions || '')}</textarea></div>
          <button type="button" class="lib-primary" onclick="LibraryView.saveNewCirc()">Create</button>
        </div></div>`;
    }
    return '';
  }

  function calendarHtml() {
    const u = ui();
    const t = root.HybridLibrary.template(lib(), u.tid);
    const date = u.date || (typeof root.today === 'function' ? root.today() : '');
    return `
      <div class="shell-screen shell-screen--library">
        <div class="lib-head-row">
          <button type="button" class="lib-back" onclick="LibraryView.calendarBack()" aria-label="Back">←</button>
          <h1>Post to calendar</h1>
        </div>
        <div class="lib-field">
          <label for="sessionPostDate">Session date</label>
          <input id="sessionPostDate" type="date" value="${esc(date)}" onchange="LibraryView.setDate(this.value)">
        </div>
        <p class="lib-empty" style="text-align:left;padding:0 16px 12px">Lands on your Training tab only — no other athletes.</p>
        <div style="padding:0 16px">
          <button type="button" class="lib-primary" onclick="LibraryView.confirmDate()">Post to calendar</button>
        </div>
        <p class="lib-empty">${esc(t && t.title)}</p>
      </div>`;
  }

  function splitPad(buffer) {
    const text = String(buffer || '');
    const dash = text.indexOf('-');
    return dash < 0 ? { left: text, dash: false, right: '' } : { left: text.slice(0, dash), dash: true, right: text.slice(dash + 1) };
  }
  function padValueHtml(pad) {
    const parts = splitPad(pad.buffer);
    const mark = (text, on) => on ? `<span class="photo-caret">${esc(text || '')}</span>` : esc(text);
    if (!parts.dash) return mark(parts.left || '0', true);
    return `${mark(parts.left, pad.side !== 'right')}-${mark(parts.right, pad.side === 'right')}`;
  }
  function numberPadHtml() {
    if (!numberPad) return '';
    const key = (label, col, row, extra='') => `<button type="button" class="photo-key${extra}" style="grid-column:${col};grid-row:${row}" onclick="LibraryView.numberKey('${label}')">${label === '⌫' ? '⌫' : label}</button>`;
    return `<div class="photo-pad" role="dialog" aria-label="Reps keypad">
      <div class="photo-pad-top">
        <div class="photo-pad-val" aria-live="polite">${padValueHtml(numberPad)}</div>
        <span class="photo-pad-unit">REPS</span>
        <button type="button" class="photo-pad-close" aria-label="Close keypad" onclick="LibraryView.closeNumberPad()">⌄</button>
      </div>
      <div class="photo-pad-grid">
        ${key('1',1,1)}${key('2',2,1)}${key('3',3,1)}${key('>',4,1)}
        ${key('4',1,2)}${key('5',2,2)}${key('6',3,2)}${key('<',4,2)}
        ${key('7',1,3)}${key('8',2,3)}${key('9',3,3)}
        ${key('–',1,4)}${key('0',2,4)}${key('⌫',3,4,' photo-key-bs')}
      </div>
      <p role="status">${esc(numberPad.error || '')}</p>
    </div>`;
  }

  function html() {
    const s = ui().screen;
    if (s === 'edit' || s === 'editBlock') return editorHtml() + numberPadHtml();
    if (s === 'picker' || s === 'newEx' || s === 'newCirc') return pickerHtml();
    if (s === 'calendar') return calendarHtml();
    return listHtml();
  }

  const LibraryView = {
    html,
    search(q) {
      root.S.libUi.q = String(q || '');
      save({ paint: false });
    },
    goList() { go('list', { tid: null, q: '', selected: [], bid: null }); },
    create() {
      const next = root.HybridLibrary.createTemplate(lib(), {});
      root.S.library = next;
      go('edit', { tid: next.templates[0].id, bid: null });
    },
    open(tid) { go('edit', { tid, bid: null, q: '' }); },
    patchTpl(patch) { setLib(root.HybridLibrary.patchTemplate(lib(), ui().tid, patch)); },
    removeTpl(tid) {
      if (!window.confirm('Delete this session template?')) return;
      setLib(root.HybridLibrary.deleteTemplate(lib(), tid));
      go('list', { tid: null });
    },
    picker(tab) { go('picker', { tab, q: '', selected: [] }); },
    togglePick(id) {
      const cur = new Set(ui().selected || []);
      if (cur.has(id)) cur.delete(id);
      else cur.add(id);
      root.S.libUi.selected = [...cur];
      save();
    },
    addPicked(asSuperset) {
      const u = ui();
      const ids = u.selected || [];
      if (!ids.length) return;
      let st = lib();
      const added = [];
      for (const id of ids) {
        if (u.tab === 'circuits') st = root.HybridLibrary.addCircuit(st, u.tid, { catalogId: id });
        else st = root.HybridLibrary.addExercise(st, u.tid, { catalogId: id });
        added.push(st.templates.find((t) => t.id === u.tid).blocks.slice(-1)[0].id);
      }
      if (asSuperset && u.tab !== 'circuits') {
        for (let i = 1; i < added.length; i++) st = root.HybridLibrary.linkSuperset(st, u.tid, added[i - 1], added[i]);
      }
      root.S.library = st;
      go('edit', { tid: u.tid, selected: [], bid: null });
    },
    newEx() { go('newEx', { draft: { c1: 'reps', c2: 'none' } }); },
    newCirc() { go('newCirc', { draft: {} }); },
    closeCreate() { go('picker'); },
    saveNewEx() {
      const title = (document.getElementById('libNewTitle') || {}).value;
      const c1 = (document.getElementById('libNewC1') || {}).value || 'reps';
      const c2 = (document.getElementById('libNewC2') || {}).value || 'none';
      const cols = [c1, c2].filter((k) => k && k !== 'none');
      let st = root.HybridLibrary.createCatalogExercise(lib(), { title, columns: cols });
      const id = st.catalog.exercises[0].id;
      st = root.HybridLibrary.addExercise(st, ui().tid, { catalogId: id });
      root.S.library = st;
      go('edit', { tid: ui().tid, bid: null });
    },
    saveNewCirc() {
      const title = (document.getElementById('libNewTitle') || {}).value;
      const instructions = (document.getElementById('libNewInstr') || {}).value;
      let st = root.HybridLibrary.createCatalogCircuit(lib(), { title, instructions });
      const id = st.catalog.circuits[0].id;
      st = root.HybridLibrary.addCircuit(st, ui().tid, { catalogId: id });
      root.S.library = st;
      go('edit', { tid: ui().tid, bid: null });
    },
    editBlock(bid) { numberPad = null; root.S.libUi.bid = bid; root.S.libUi.repError = null; root.S.libUi.targetError=null; save(); },
    closeSheet() { numberPad = null; root.S.libUi.bid = null; save(); },
    patchBlock(patch, bid) { if (bid) root.S.libUi.bid = bid; setLib(root.HybridLibrary.patchBlock(lib(), ui().tid, ui().bid, patch)); },
    openNumberPad(field, bid) {
      if (bid) root.S.libUi.bid = bid;
      const use = field === 'reps' ? 'set:0' : field;
      if (!/^set:\d+$/.test(use)) return;
      const b = root.HybridLibrary.template(lib(), ui().tid)?.blocks.find(x => x.id === ui().bid);
      const targets = b ? blockTargets(b) : [];
      const target = targets[Number(use.split(':')[1])];
      if (!b || !target || target.purpose === 'amrap') return;
      numberPad = { field: use, buffer: repText(target), fresh: true, side: 'left', error: '' };
      save();
    },
    closeNumberPad() { numberPad = null; save(); },
    numberKey(key) {
      if (!numberPad) return;
      const parts = splitPad(numberPad.buffer);
      const side = numberPad.side === 'right' && parts.dash ? 'right' : 'left';
      if (key === '>' || key === '–' || key === '-') { parts.dash = true; numberPad.side = 'right'; numberPad.fresh = true; }
      else if (key === '<') { numberPad.side = 'left'; numberPad.fresh = true; }
      else if (key === '⌫') {
        if (side === 'right' && parts.right) parts.right = parts.right.slice(0, -1);
        else if (side === 'right') { parts.dash = false; numberPad.side = 'left'; }
        else parts.left = parts.left.slice(0, -1);
        numberPad.fresh = false;
      } else if (/^\d$/.test(key)) {
        if (side === 'right') parts.right = numberPad.fresh ? key : parts.right + key;
        else parts.left = numberPad.fresh ? key : parts.left + key;
        numberPad.fresh = false;
      } else return;
      numberPad.buffer = parts.dash ? `${parts.left}-${parts.right}` : parts.left;
      numberPad.error = '';
      const parsed = root.HybridLibrary.parseRepTarget(numberPad.buffer);
      if (parsed) LibraryView.setTargetReps(Number(numberPad.field.split(':')[1]), parsed.text);
      else save();
    },
    saveNumberPad() { LibraryView.closeNumberPad(); },
    nudgeSets(dir, bid) {
      if (bid) root.S.libUi.bid = bid;
      const b = root.HybridLibrary.template(lib(), ui().tid)?.blocks.find(x => x.id === ui().bid);
      if (!b) return;
      if (!(b.columns || []).some(isRepMetric)) {
        const count = Math.max(1, Math.min(12, (Number(b.setCount) || 3) + (dir > 0 ? 1 : -1)));
        LibraryView.patchBlock({ setCount: count });
        return;
      }
      const targets = blockTargets(b);
      const amrap = targets.filter(t => t.purpose === 'amrap');
      const work = targets.filter(t => t.purpose !== 'amrap');
      if (dir > 0 && work.length < 12) work.push({ purpose: 'working', reps: work.at(-1)?.reps || { min: 8, max: 8 }, loadRule: { kind: 'adaptive' }, toFailure: false });
      else if (dir < 0 && work.length > 1) work.pop();
      LibraryView.patchBlock({ setTargets: work.concat(amrap) });
    },
    setRepTarget(value) {
      const b = root.HybridLibrary.template(lib(), ui().tid)?.blocks.find(b => b.id === ui().bid);
      const range = (b?.columns || []).includes('reps_range');
      const parsed = root.HybridLibrary.parseRepTarget(value);
      if (!parsed || (!range && parsed.min !== parsed.max)) { root.S.libUi.repError = range ? 'Enter positive whole reps, with the lower number first.' : 'Select Rep Range to enter a range.'; save(); return; }
      root.S.libUi.repError = null;
      root.S.library = root.HybridLibrary.patchBlock(lib(), ui().tid, ui().bid, { repTarget: parsed.text });
      save({ paint: false });
    },
    editEachSet(){
      const b=root.HybridLibrary.template(lib(),ui().tid)?.blocks.find(b=>b.id===ui().bid);if(!b)return;
      if(ui().perSet||Array.isArray(b.setTargets)){root.S.libUi.perSet=false;LibraryView.patchBlock({repTarget:b.repTarget||'8',setTargets:undefined});return;}
      root.S.libUi.perSet=true;save();
    },
    setTargetReps(index,value){
      const b=root.HybridLibrary.template(lib(),ui().tid)?.blocks.find(b=>b.id===ui().bid),parsed=root.HybridLibrary.parseRepTarget(value);if(!b||!parsed)return;
      let targets;try{targets=root.StrengthTargets.normalize({...b,repTarget:b.repTarget||'8'});}catch(e){root.S.libUi.targetError=e.message;save();return;}
      targets[index]={...targets[index],purpose:'working',reps:{min:parsed.min,max:parsed.max},loadRule:{kind:'adaptive'},toFailure:false};
      const range=targets.some(t=>t.purpose==='working'&&t.reps&&t.reps.max>t.reps.min);
      const columns=(b.columns||['reps']).map(c=>c==='reps'||c==='reps_range'?(range?'reps_range':'reps'):c);
      try{root.StrengthTargets.validate(targets);root.S.libUi.targetError=null;LibraryView.patchBlock({setTargets:targets,columns});}catch(e){root.S.libUi.targetError=e.message;save();}
    },
    toggleAmrap(bid){
      if (bid) root.S.libUi.bid = bid;
      const b=root.HybridLibrary.template(lib(),ui().tid)?.blocks.find(b=>b.id===ui().bid);if(!b)return;
      let targets;try{targets=root.StrengthTargets.normalize({...b,repTarget:b.repTarget||'8'});}catch(e){root.S.libUi.targetError=e.message;save();return;}
      const last=targets.at(-1);
      if(last.purpose==='amrap')targets.pop();
      else targets.push({id:`${b.id||'block'}:set:${targets.length}`,purpose:'amrap',reps:null,loadRule:{kind:'first_working_set'},toFailure:false});
      const valid=root.StrengthTargets.validate(targets);if(!valid.valid){root.S.libUi.targetError=valid.error;save();return;}
      root.S.libUi.targetError=null;LibraryView.patchBlock({setTargets:targets});
    },
    setCols(c1, c2, bid) {
      if (bid) root.S.libUi.bid = bid;
      const cols = [c1, c2].filter((k) => k && k !== 'none');
      const columns = cols.length ? cols : ['reps'];
      const b = root.HybridLibrary.template(lib(), ui().tid)?.blocks.find(b => b.id === ui().bid);
      const parsed = root.HybridLibrary.parseRepTarget(b?.repTarget);
      const patch = {columns};
      const hasReps = columns.some(isRepMetric);
      if (!hasReps && Array.isArray(b?.setTargets)) {
        patch.setCount = b.setTargets.length;
        patch.setTargets = undefined;
      }
      if (parsed && !columns.includes('reps_range')) patch.repTarget = String(parsed.min);
      if(hasReps&&Array.isArray(b?.setTargets)&&!columns.includes('reps_range'))patch.setTargets=b.setTargets.map(t=>t.purpose==='amrap'?t:{...t,reps:{min:t.reps.min,max:t.reps.min}});
      numberPad = null; root.S.libUi.repError = null;
      setLib(root.HybridLibrary.patchBlock(lib(), ui().tid, ui().bid, patch));
    },
    removeBlock(bid) { setLib(root.HybridLibrary.removeBlock(lib(), ui().tid, bid)); },
    reorder() {
      const t = root.HybridLibrary.template(lib(), ui().tid);
      if (!t || t.blocks.length < 2) return;
      const names = t.blocks.map((b, i) => `${i + 1}. ${b.title}`).join('\n');
      const raw = window.prompt('Move a block. Enter from-to like 3-1\n' + names);
      if (!raw) return;
      const m = String(raw).match(/(\d+)\s*[-to]+\s*(\d+)/i);
      if (!m) return;
      const from = Number(m[1]) - 1;
      const to = Number(m[2]) - 1;
      let st = lib();
      const tpl = root.HybridLibrary.template(st, ui().tid);
      const id = tpl.blocks[from] && tpl.blocks[from].id;
      if (!id) return;
      const dir = to < from ? -1 : 1;
      let steps = Math.abs(to - from);
      while (steps--) st = root.HybridLibrary.moveBlock(st, ui().tid, id, dir);
      setLib(st);
    },
    calendar(tid, fromEditor) {
      go('calendar', { tid, fromEditor: !!fromEditor, date: typeof root.today === 'function' ? root.today() : '' });
    },
    calendarBack() { if (ui().fromEditor) go('edit'); else LibraryView.goList(); },
    setDate(d) { root.S.libUi.date = d; save(); },
    confirmDate() {
      const date = ui().date || '';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { root.alert('Choose a session date.'); return; }
      if (root.S.sessions && root.S.sessions[date]) { root.alert('This day already has a workout in progress or completed. Choose another day.'); return; }
      const assigned = lib().assignments[date];
      if (assigned && assigned !== ui().tid && !root.confirm('Replace the session already planned for this day?')) return;
      setLib(root.HybridLibrary.assignDate(lib(), ui().tid, date));
      if (typeof root.selectDate === 'function') root.selectDate(date);
      root.S.tab = 'training';
      go('list', { tid: null });
    },
  };

  root.LibraryView = LibraryView;
})(typeof window !== 'undefined' ? window : globalThis);
