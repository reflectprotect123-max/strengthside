/**
 * Builder log columns — one metric type per column.
 * Builder sheet mirrors the logger set-row chrome; column headers are dropdowns.
 * Logger: hard labels only.
 */
(function (global) {
  const KINDS = [
    { key: 'reps', label: 'Reps', loggerLabel: 'Reps', field: 'reps', targetKind: 'reps' },
    { key: 'reps_range', label: 'Reps (min–max)', loggerLabel: 'Reps', field: 'reps', targetKind: 'reps', placeholder: '8-12' },
    { key: 'weight_kg', label: 'Weight (kg)', loggerLabel: 'Weight', field: 'weight', targetKind: 'reps' },
    { key: 'weight_pct_wm', label: 'Weight % (of WM)', loggerLabel: 'Weight', field: 'weight', targetKind: 'reps', placeholder: '70' },
    { key: 'weight_lwp', label: 'Weight (LWP)', loggerLabel: 'Weight', field: 'weight', targetKind: 'reps', placeholder: '+2.5' },
    { key: 'time_sec', label: 'Time (seconds)', loggerLabel: 'Seconds', field: 'reps', targetKind: 'seconds', placeholder: '30' },
    { key: 'distance_m', label: 'Distance (metres)', loggerLabel: 'Metres', field: 'reps', targetKind: 'reps', placeholder: '100' },
  ];

  const KIND_MAP = Object.fromEntries(KINDS.map((k) => [k.key, k]));

  function newId() {
    return 'col_' + Math.random().toString(36).slice(2, 9);
  }

  function kindMeta(key) {
    return KIND_MAP[key] || KIND_MAP.reps;
  }

  function splitValues(raw, setCount) {
    const n = Math.max(1, setCount | 0);
    let parts = String(raw == null ? '' : raw)
      .split(',')
      .map((x) => x.trim())
      .filter((x, i, a) => a.length > 1 || x !== '' || i === 0);
    if (!parts.length) parts = [''];
    if (parts.length === 1) parts = Array.from({ length: n }, () => parts[0]);
    while (parts.length < n) parts.push(parts[parts.length - 1] || '');
    return parts.slice(0, n);
  }

  function joinValues(values) {
    const parts = (values || []).map((v) => String(v == null ? '' : v).trim());
    if (!parts.length) return '';
    const allSame = parts.every((p) => p === parts[0]);
    return allSame ? parts[0] : parts.join(', ');
  }

  function defaultColumns(ex) {
    const setCount = Math.max(1, Number(ex && ex.sets) || 3);
    const reps = String((ex && ex.reps) || '8');
    const cols = [];
    if (ex && ex.loadExpr && ex.loadExpr.exprKind === 'pct_of_max') {
      const pct = String(Math.round(Number(ex.loadExpr.exprArg) * 100) || '');
      cols.push({ id: newId(), kind: 'weight_pct_wm', value: pct, values: splitValues(pct, setCount) });
    } else if (ex && ex.loadExpr && ex.loadExpr.exprKind === 'lwp_delta') {
      const d = String(ex.loadExpr.exprArg ?? '');
      cols.push({ id: newId(), kind: 'weight_lwp', value: d, values: splitValues(d, setCount) });
    } else {
      cols.push({ id: newId(), kind: 'weight_kg', value: '', values: splitValues('', setCount) });
    }
    const looksTime = /s(ec(onds?)?)?$/i.test(reps.split(',')[0].trim()) || (ex && ex.targetKind === 'seconds');
    const effortRaw = reps.replace(/s(ec(onds?)?)?$/i, '').trim() || reps;
    cols.push({
      id: newId(),
      kind: looksTime ? 'time_sec' : 'reps',
      value: effortRaw,
      values: splitValues(effortRaw, setCount),
    });
    return cols;
  }

  function normalizeColumns(ex) {
    const setCount = Math.max(1, Number(ex && ex.sets) || 3);
    if (ex && Array.isArray(ex.logColumns) && ex.logColumns.length) {
      return ex.logColumns.map((c) => {
        const kind = KIND_MAP[c.kind] ? c.kind : 'reps';
        const value = c.value == null ? '' : String(c.value);
        const values = Array.isArray(c.values) && c.values.length ? splitValues(c.values.join(','), setCount) : splitValues(value, setCount);
        return { id: c.id || newId(), kind, value: joinValues(values), values };
      });
    }
    return defaultColumns(ex || {});
  }

  function optionsHtml(selected) {
    return KINDS.map(
      (k) => `<option value="${k.key}" ${k.key === selected ? 'selected' : ''}>${k.label}</option>`,
    ).join('');
  }

  function syncLegacyFromColumns(ex, columns, setCount) {
    const cols = (columns || normalizeColumns(ex)).map((c) => {
      const values = Array.isArray(c.values) ? c.values : splitValues(c.value, setCount || ex.sets || 1);
      return { id: c.id || newId(), kind: c.kind, value: joinValues(values), values };
    });
    ex.logColumns = cols;
    if (setCount) ex.sets = Math.max(1, setCount);
    const effort = cols.find((c) => c.kind === 'reps' || c.kind === 'reps_range' || c.kind === 'time_sec' || c.kind === 'distance_m');
    const loadCol = cols.find((c) => c.kind === 'weight_kg' || c.kind === 'weight_pct_wm' || c.kind === 'weight_lwp');
    if (effort) ex.reps = String(effort.value || '').trim() || ex.reps || '1';
    delete ex.loadExpr;
    if (loadCol) {
      if (loadCol.kind === 'weight_pct_wm') {
        const pct = Number(String(loadCol.values?.[0] ?? loadCol.value).split(',')[0]);
        if (pct >= 1 && pct <= 100) ex.loadExpr = { exprKind: 'pct_of_max', exprArg: pct / 100 };
      } else if (loadCol.kind === 'weight_lwp') {
        const delta = Number(String(loadCol.values?.[0] ?? loadCol.value).split(',')[0]);
        if (!Number.isNaN(delta)) ex.loadExpr = { exprKind: 'lwp_delta', exprArg: delta };
      }
    }
    return ex;
  }

  function columnsMeta(ex) {
    const cols = normalizeColumns(ex);
    return cols
      .map((c) => {
        const meta = kindMeta(c.kind);
        const v = String(c.value || '').trim();
        if (c.kind === 'weight_pct_wm' && v) return `${v}% WM`;
        if (c.kind === 'weight_lwp' && v) return `LWP ${v}`;
        if (c.kind === 'weight_kg' && v) return `${v} kg`;
        if (v) return `${meta.loggerLabel} ${v}`;
        return meta.label;
      })
      .join(' · ');
  }

  function fmtRest(sec) {
    const s = Math.max(0, Number(sec) || 0);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
  }

  /** Sheet draft while Edit lift is open */
  let sheet = { sets: 3, restSec: 120, columns: [] };

  function beginSheet(ex) {
    const sets = Math.max(1, Number(ex && ex.sets) || 3);
    const restSec = Math.max(0, Number(ex && ex.restSec) || 120);
    sheet = {
      sets,
      restSec,
      columns: normalizeColumns({ ...(ex || {}), sets }),
    };
    return sheet;
  }

  function getSheetColumns() {
    return sheet.columns.map((c) => ({
      id: c.id,
      kind: c.kind,
      values: (c.values || []).slice(),
      value: joinValues(c.values),
    }));
  }

  function getSetCount() {
    return sheet.sets;
  }

  function getRestSec() {
    return sheet.restSec;
  }

  function onRestChange(v) {
    sheet.restSec = Math.max(0, Number(v) || 0);
    const btn = global.document && global.document.getElementById('builderRestBtn');
    if (btn) btn.textContent = 'Rest ' + fmtRest(sheet.restSec);
  }

  function onKindChange(colIdx, kind) {
    if (!sheet.columns[colIdx]) return;
    sheet.columns[colIdx].kind = KIND_MAP[kind] ? kind : 'reps';
    refreshTwin();
  }

  function onCellChange(colIdx, setIdx, value) {
    const col = sheet.columns[colIdx];
    if (!col) return;
    if (!Array.isArray(col.values)) col.values = splitValues(col.value, sheet.sets);
    col.values[setIdx] = value;
    col.value = joinValues(col.values);
    // keep target chip in sync for effort columns
    const effortIdx = sheet.columns.findIndex((c) => c.kind === 'reps' || c.kind === 'reps_range' || c.kind === 'time_sec' || c.kind === 'distance_m');
    if (colIdx === effortIdx) {
      const chip = global.document && global.document.querySelector(`.builder-setrow[data-set="${setIdx}"] .target`);
      if (chip) chip.textContent = String(value || '').trim() || '—';
    }
  }

  function resizeSets(n) {
    const next = Math.max(1, Math.min(12, n | 0));
    sheet.sets = next;
    sheet.columns.forEach((c) => {
      c.values = splitValues(joinValues(c.values || splitValues(c.value, next)), next);
      c.value = joinValues(c.values);
    });
    const setsInput = global.document && global.document.getElementById('exSets');
    if (setsInput) setsInput.value = String(next);
    refreshTwin();
  }

  function addSet() {
    resizeSets(sheet.sets + 1);
  }

  function removeSet() {
    if (sheet.sets <= 1) return;
    resizeSets(sheet.sets - 1);
  }

  function addColumn() {
    if (sheet.columns.length >= 3) {
      if (global.alert) global.alert('Max 3 log columns.');
      return;
    }
    sheet.columns.push({
      id: newId(),
      kind: 'reps',
      value: '',
      values: splitValues('', sheet.sets),
    });
    refreshTwin();
  }

  function removeColumn(idx) {
    if (sheet.columns.length <= 1) return;
    sheet.columns.splice(idx, 1);
    refreshTwin();
  }

  function effortTarget(setIdx) {
    const effort = sheet.columns.find((c) => c.kind === 'reps' || c.kind === 'reps_range' || c.kind === 'time_sec' || c.kind === 'distance_m');
    if (!effort) return '—';
    const v = (effort.values || [])[setIdx];
    return String(v == null || v === '' ? '—' : v);
  }

  function builderLoggerTwinHtml() {
    const cols = sheet.columns;
    const last = sheet.sets - 1;
    const planned = sheet.sets + ' sets';
    const header = `<div class="setrow builder-colhead" style="border-bottom:1px solid var(--line)">
      <div class="setnum"></div>
      ${cols
        .map(
          (c, ci) =>
            `<div><span class="mini">Type</span><select class="logcol-kind" aria-label="Column ${ci + 1} type" onchange="LogColumns.onKindChange(${ci},this.value)">${optionsHtml(c.kind)}</select></div>`,
        )
        .join('')}
      <div><span class="mini">RIR</span></div>
      <div></div>
    </div>`;

    const rows = Array.from({ length: sheet.sets }, (_, i) => {
      const isLast = i === last;
      const cells = cols
        .map((c, ci) => {
          const meta = kindMeta(c.kind);
          const val = (c.values || [])[i] == null ? '' : c.values[i];
          const ph = meta.placeholder || '';
          return `<div><span class="mini">${meta.loggerLabel}</span><input value="${String(val).replace(/"/g, '&quot;')}" placeholder="${ph}" onchange="LogColumns.onCellChange(${ci},${i},this.value)" oninput="LogColumns.onCellChange(${ci},${i},this.value)"></div>`;
        })
        .join('');
      const rirMini = isLast ? 'RIR · counts' : 'RIR';
      return `<div class="setrow builder-setrow ${isLast ? 'last-set' : ''}" data-set="${i}">
        <div class="setnum">${i + 1}<span class="target">${effortTarget(i)}</span></div>
        ${cells}
        <div><span class="mini">${rirMini}</span><input disabled placeholder="—" aria-label="RIR logger only"></div>
        <div class="btns" style="margin:0;gap:5px"><button type="button" class="btn small primary" disabled>Log</button></div>
      </div>`;
    }).join('');

    return `<div class="card" style="margin-top:14px" id="builderLoggerCard">
      <div class="row">
        <div>
          <div class="title">Progress</div>
          <div class="meta">Planned: ${planned} · Rest ${fmtRest(sheet.restSec)} after Log</div>
        </div>
        <div class="btns" style="margin-top:0"><button type="button" class="btn small primary" id="builderRestBtn" disabled>Rest ${fmtRest(sheet.restSec)}</button></div>
      </div>
      <div class="guardrail" style="margin-top:10px">Log <b>RIR on your last set</b> (set ${sheet.sets}) — it drives the next session load.</div>
      <div class="divider"></div>
      ${header}
      ${rows}
      <div class="btns">
        <button type="button" class="btn small" onclick="LogColumns.addSet()">Add set</button>
        <button type="button" class="btn small" onclick="LogColumns.removeSet()">Remove set</button>
        <button type="button" class="btn small" onclick="LogColumns.addColumn()">Add column</button>
      </div>
      <button type="button" class="btn primary block" style="margin-top:12px" disabled>Complete exercise</button>
    </div>`;
  }

  /** @deprecated old list UI — keep name for any callers */
  function builderColumnsHtml() {
    return builderLoggerTwinHtml();
  }

  function refreshTwin() {
    const card = global.document && global.document.getElementById('builderLoggerCard');
    if (!card) return;
    const wrap = global.document.createElement('div');
    wrap.innerHTML = builderLoggerTwinHtml();
    card.replaceWith(wrap.firstChild);
  }

  function loggerCellsHtml(row, rowIndex, columns, isLast) {
    const cols = columns && columns.length ? columns : defaultColumns({});
    const cells = cols
      .map((c) => {
        const meta = kindMeta(c.kind);
        const field = meta.field;
        const val = row[field] == null ? '' : row[field];
        return `<div><span class="mini">${meta.loggerLabel}</span><input type="number" value="${val}" onchange="updateSet(${rowIndex},'${field}',this.value)"></div>`;
      })
      .join('');
    const rirLabel = isLast ? 'RIR · counts' : 'RIR';
    const rir = `<div><span class="mini">${rirLabel}</span><input type="number" min="0" max="10" value="${row.rir || ''}" onchange="updateSet(${rowIndex},'rir',this.value)" aria-label="${isLast ? 'RIR on last set for progression' : 'RIR set ' + row.n}"></div>`;
    return cells + rir;
  }

  function applyColumnTargetKinds(ex, rows) {
    const cols = normalizeColumns(ex);
    const effort = cols.find((c) => c.kind === 'time_sec') || cols.find((c) => c.kind === 'reps' || c.kind === 'reps_range' || c.kind === 'distance_m');
    const tk = effort ? kindMeta(effort.kind).targetKind : 'reps';
    (rows || []).forEach((r) => {
      if (!r.extra) r.targetKind = tk;
    });
    return rows;
  }

  global.LogColumns = {
    KINDS,
    kindMeta,
    normalizeColumns,
    defaultColumns,
    syncLegacyFromColumns,
    columnsMeta,
    builderColumnsHtml,
    builderLoggerTwinHtml,
    beginSheet,
    getSheetColumns,
    getSetCount,
    getRestSec,
    onRestChange,
    onKindChange,
    onCellChange,
    onValueChange: onCellChange,
    addColumn,
    removeColumn,
    addSet,
    removeSet,
    resizeSets,
    loggerCellsHtml,
    applyColumnTargetKinds,
    fmtRest,
  };
})(typeof window !== 'undefined' ? window : globalThis);
