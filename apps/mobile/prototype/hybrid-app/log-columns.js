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
      } else if (loadCol.kind === 'weight_kg') {
        const vals = loadCol.values || splitValues(loadCol.value, setCount || ex.sets || 1);
        ex.load = joinValues(vals);
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
  let sheet = { sets: 3, restSec: 120, targetRir: null, showOverrides: false, columns: [] };
  let changeHandler = null;

  function setChangeHandler(fn) {
    changeHandler = typeof fn === 'function' ? fn : null;
  }

  function notifyChange() {
    if (typeof changeHandler === 'function') changeHandler();
  }

  function beginSheet(ex) {
    const sets = Math.max(1, Number(ex && ex.sets) || 3);
    const restSec = Math.max(0, Number(ex && ex.restSec) || 120);
    const targetRir =
      ex && ex.targetRir != null && Number.isFinite(Number(ex.targetRir)) ? Math.round(Number(ex.targetRir)) : null;
    sheet = {
      sets,
      restSec,
      targetRir,
      showOverrides: !!(ex && ex.logColumns && ex.logColumns.some((c) => perSetOverrideActive(c.values, sets))),
      columns: normalizeColumns({ ...(ex || {}), sets }),
    };
    return sheet;
  }

  /** True when any set after 1 differs from set 1 (coach authored per-set overrides). */
  function perSetOverrideActive(values, setCount) {
    const vals = values || [];
    const first = String(vals[0] == null ? '' : vals[0]).trim();
    for (let i = 1; i < setCount; i++) {
      const v = String(vals[i] == null ? '' : vals[i]).trim();
      if (v !== first && v !== '') return true;
    }
    return false;
  }

  function toggleOverrides(on) {
    sheet.showOverrides = !!on;
    if (!sheet.showOverrides) {
      sheet.columns.forEach((c) => {
        const base = (c.values || [])[0] == null ? '' : c.values[0];
        if (shouldForwardFillColumn(c.kind)) {
          c.values = splitValues(base, sheet.sets);
        } else {
          c.values = [base, ...Array.from({ length: Math.max(0, sheet.sets - 1) }, () => '')];
        }
        c.value = joinValues(c.values);
      });
    }
    refreshPrescription();
    notifyChange();
  }

  function setTargetRir(v) {
    const n = String(v == null ? '' : v).trim();
    sheet.targetRir = n === '' || !Number.isFinite(Number(n)) ? null : Math.max(0, Math.min(10, Math.round(Number(n))));
    refreshPrescription();
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
    refreshPrescription();
    notifyChange();
  }

  function onKindChange(colIdx, kind) {
    if (!sheet.columns[colIdx]) return;
    sheet.columns[colIdx].kind = KIND_MAP[kind] ? kind : 'reps';
    refreshPrescription();
    notifyChange();
  }

  function shouldForwardFillColumn(kind) {
    return kind === 'reps' || kind === 'reps_range';
  }

  function onPrescriptionChange(colIdx, value) {
    const col = sheet.columns[colIdx];
    if (!col) return;
    if (!Array.isArray(col.values)) col.values = splitValues(col.value, sheet.sets);
    col.values[0] = value;
    if (shouldForwardFillColumn(col.kind)) {
      for (let i = 1; i < sheet.sets; i++) col.values[i] = value;
    } else if (!sheet.showOverrides) {
      for (let i = 1; i < sheet.sets; i++) col.values[i] = '';
    }
    col.value = joinValues(col.values);
    refreshPrescription();
    notifyChange();
  }

  function onCellChange(colIdx, setIdx, value) {
    const col = sheet.columns[colIdx];
    if (!col) return;
    if (!Array.isArray(col.values)) col.values = splitValues(col.value, sheet.sets);
    col.values[setIdx] = value;
    if (shouldForwardFillColumn(col.kind) && !sheet.showOverrides) {
      // Forward-fill reps column only — never backfill earlier sets.
      for (let i = setIdx + 1; i < sheet.sets; i++) col.values[i] = value;
      syncForwardColumnInputs(colIdx, setIdx, value);
      for (let i = setIdx; i < sheet.sets; i++) {
        const chip = global.document && global.document.querySelector(`.builder-setrow[data-set="${i}"] .target`);
        if (chip) chip.textContent = String(value || '').trim() || '—';
      }
    } else {
      const effortIdx = sheet.columns.findIndex((c) => shouldForwardFillColumn(c.kind));
      if (colIdx === effortIdx) {
        const chip = global.document && global.document.querySelector(`.builder-setrow[data-set="${setIdx}"] .target`);
        if (chip) chip.textContent = String(value || '').trim() || '—';
      }
    }
    col.value = joinValues(col.values);
    refreshPrescription();
    notifyChange();
  }

  function syncForwardColumnInputs(colIdx, setIdx, value) {
    const card = global.document && global.document.getElementById('builderLoggerCard');
    if (!card) return;
    card.querySelectorAll('.builder-setrow').forEach((row) => {
      const rowSet = Number(row.dataset.set);
      if (!Number.isFinite(rowSet) || rowSet <= setIdx) return;
      const input = row.querySelectorAll('input:not([disabled])')[colIdx];
      if (input) input.value = value;
    });
  }

  function resizeSets(n) {
    const next = Math.max(1, Math.min(12, n | 0));
    sheet.sets = next;
    sheet.columns.forEach((c) => {
      c.values = splitValues(joinValues(c.values || splitValues(c.value, next)), next);
      if (!sheet.showOverrides && !shouldForwardFillColumn(c.kind)) {
        const base = c.values[0] == null ? '' : c.values[0];
        c.values = [base, ...Array.from({ length: Math.max(0, next - 1) }, () => '')];
      }
      c.value = joinValues(c.values);
    });
    const setsInput = global.document && global.document.getElementById('exSets');
    if (setsInput) setsInput.value = String(next);
    refreshPrescription();
  }

  function addSet() {
    resizeSets(sheet.sets + 1);
    notifyChange();
  }

  function removeSet() {
    if (sheet.sets <= 1) return;
    resizeSets(sheet.sets - 1);
    notifyChange();
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
    refreshPrescription();
    notifyChange();
  }

  function removeColumn(idx) {
    if (sheet.columns.length <= 1) return;
    sheet.columns.splice(idx, 1);
    refreshPrescription();
    notifyChange();
  }

  function effortTarget(setIdx) {
    const effort = sheet.columns.find((c) => c.kind === 'reps' || c.kind === 'reps_range' || c.kind === 'time_sec' || c.kind === 'distance_m');
    if (!effort) return '—';
    const v = (effort.values || [])[setIdx];
    return String(v == null || v === '' ? '—' : v);
  }

  function metricKindsLabel() {
    return KINDS.map((k) => k.label).join(', ');
  }

  function builderPrescriptionGridHtml() {
    const cols = sheet.columns;
    const metricCards = cols
      .map((c, ci) => {
        const meta = kindMeta(c.kind);
        const val = (c.values || [])[0] == null ? '' : c.values[0];
        const ph = meta.placeholder || '';
        const removeBtn =
          cols.length > 1
            ? `<button type="button" class="btn ghost small rx-metric-remove" aria-label="Remove metric" onclick="LogColumns.removeColumn(${ci})">×</button>`
            : '';
        return `<div class="rx-metric-col">
          <div class="row" style="align-items:center;gap:6px;margin-bottom:6px">
            <select class="logcol-kind" aria-label="Metric ${ci + 1} type" onchange="LogColumns.onKindChange(${ci},this.value)">${optionsHtml(c.kind)}</select>
            ${removeBtn}
          </div>
          <input value="${String(val).replace(/"/g, '&quot;')}" placeholder="${ph || 'Set 1'}" aria-label="${meta.label} set 1" onchange="LogColumns.onPrescriptionChange(${ci},this.value)" oninput="LogColumns.onPrescriptionChange(${ci},this.value)">
          <p class="rx-metric-hint">${shouldForwardFillColumn(c.kind) ? 'Applies to all sets' : 'Set 1 · later sets autoreg unless overridden'}</p>
        </div>`;
      })
      .join('');
    const addBtn =
      cols.length < 3
        ? `<button type="button" class="btn small" onclick="LogColumns.addColumn()">+ Add metric</button>`
        : `<span class="muted" style="font-size:11px">Max 3 metrics</span>`;
    return `<div class="card rx-prescription-card" id="builderPrescriptionCard" style="margin-top:10px">
      <div class="row" style="align-items:flex-start">
        <div>
          <div class="title">Prescription</div>
          <div class="meta">${sheet.sets} sets · set 1 below · sets 2+ autoreg in-session</div>
        </div>
        ${addBtn}
      </div>
      <div class="rx-metric-grid cols-${Math.min(3, cols.length)}">${metricCards}</div>
      <p class="muted" style="margin:10px 0 0;font-size:11px;line-height:1.45">Loggable metrics: ${metricKindsLabel()}.</p>
      <details class="rx-overrides" ${sheet.showOverrides ? 'open' : ''} ontoggle="LogColumns.toggleOverrides(this.open)">
        <summary>Per-set overrides (optional)</summary>
        ${builderOverridesTableHtml()}
      </details>
    </div>`;
  }

  function builderOverridesTableHtml() {
    const cols = sheet.columns;
    const head = `<tr><th>Set</th>${cols.map((c) => `<th>${kindMeta(c.kind).loggerLabel}</th>`).join('')}</tr>`;
    const body = Array.from({ length: sheet.sets }, (_, i) => {
      const cells = cols
        .map((c, ci) => {
          const val = (c.values || [])[i] == null ? '' : c.values[i];
          const ph = i === 0 ? kindMeta(c.kind).placeholder || '' : shouldForwardFillColumn(c.kind) ? 'same as set 1' : 'autoreg';
          return `<td><input value="${String(val).replace(/"/g, '&quot;')}" placeholder="${ph}" onchange="LogColumns.onCellChange(${ci},${i},this.value)" oninput="LogColumns.onCellChange(${ci},${i},this.value)"></td>`;
        })
        .join('');
      return `<tr><td>${i + 1}</td>${cells}</tr>`;
    }).join('');
    return `<table class="set-table rx-override-table"><thead>${head}</thead><tbody>${body}</tbody></table>`;
  }

  function builderLoggerTwinHtml() {
    const cols = sheet.columns;
    const targetRirLabel =
      sheet.targetRir != null ? `Target ${sheet.targetRir} RIR` : 'Target 2 RIR (default)';

    const rows = Array.from({ length: sheet.sets }, (_, i) => {
      const active = i === 0;
      const cells = cols
        .map((c) => {
          const meta = kindMeta(c.kind);
          const val = (c.values || [])[i] == null ? '' : c.values[i];
          const display = String(val || '').trim() || (active ? '—' : 'autoreg');
          return `<div><span class="mini">${meta.loggerLabel}</span><input disabled value="${display.replace(/"/g, '&quot;')}"></div>`;
        })
        .join('');
      return `<div class="setrow builder-setrow ${active ? 'last-set' : ''} ${active ? '' : 'done'}" data-set="${i}">
        <div class="setnum">${i + 1}<span class="target">${effortTarget(i)}</span></div>
        ${cells}
        <div><span class="mini">Difficulty</span><input disabled placeholder="${active ? 'slider' : '—'}" aria-label="Difficulty slider preview"></div>
        <div class="btns" style="margin:0;gap:5px"><button type="button" class="btn small primary" disabled>${active ? 'Next' : 'Done'}</button></div>
      </div>`;
    }).join('');

    return `<div class="card" style="margin-top:14px" id="builderLoggerCard">
      <div class="row">
        <div>
          <div class="title">Athlete logger preview</div>
          <div class="meta">One set at a time · ${targetRirLabel} · Rest ${fmtRest(sheet.restSec)} after Next</div>
        </div>
        <div class="btns" style="margin-top:0"><button type="button" class="btn small primary" id="builderRestBtn" disabled>Rest ${fmtRest(sheet.restSec)}</button></div>
      </div>
      <div class="guardrail" style="margin-top:10px">Athlete logs <b>${cols.map((c) => kindMeta(c.kind).loggerLabel).join(' + ')}</b> each set, then rates difficulty — engine adjusts the next set.</div>
      <div class="divider"></div>
      ${rows}
      <button type="button" class="btn primary block" style="margin-top:12px" disabled>Complete exercise</button>
    </div>`;
  }

  function builderPrescriptionHtml() {
    return `${builderPrescriptionGridHtml()}${builderLoggerTwinHtml()}`;
  }

  function builderColumnsHtml() {
    return builderPrescriptionHtml();
  }

  function refreshPrescription() {
    const presc = global.document && global.document.getElementById('builderPrescriptionCard');
    if (presc) {
      const wrap = global.document.createElement('div');
      wrap.innerHTML = builderPrescriptionGridHtml();
      presc.replaceWith(wrap.firstChild);
    }
    refreshTwin();
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
    builderPrescriptionHtml,
    builderPrescriptionGridHtml,
    builderLoggerTwinHtml,
    beginSheet,
    getSheetColumns,
    getSetCount,
    getRestSec,
    onRestChange,
    setTargetRir,
    onKindChange,
    onPrescriptionChange,
    onCellChange,
    onValueChange: onCellChange,
    setChangeHandler,
    addColumn,
    removeColumn,
    addSet,
    removeSet,
    resizeSets,
    toggleOverrides,
    loggerCellsHtml,
    applyColumnTargetKinds,
    fmtRest,
  };
})(typeof window !== 'undefined' ? window : globalThis);
