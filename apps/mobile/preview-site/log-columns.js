/**
 * Builder log columns — one metric type per column.
 * Builder: dropdown picks kind. Logger: hard labels from those kinds.
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

  function defaultColumns(ex) {
    const reps = String((ex && ex.reps) || '8');
    const cols = [];
    if (ex && ex.loadExpr && ex.loadExpr.exprKind === 'pct_of_max') {
      cols.push({
        id: newId(),
        kind: 'weight_pct_wm',
        value: String(Math.round(Number(ex.loadExpr.exprArg) * 100) || ''),
      });
    } else if (ex && ex.loadExpr && ex.loadExpr.exprKind === 'lwp_delta') {
      cols.push({
        id: newId(),
        kind: 'weight_lwp',
        value: String(ex.loadExpr.exprArg ?? ''),
      });
    } else {
      cols.push({ id: newId(), kind: 'weight_kg', value: '' });
    }
    const looksTime = /s(ec(onds?)?)?$/i.test(reps.split(',')[0].trim()) || (ex && ex.targetKind === 'seconds');
    cols.push({
      id: newId(),
      kind: looksTime ? 'time_sec' : 'reps',
      value: reps.replace(/s(ec(onds?)?)?$/i, '').trim() || reps,
    });
    return cols;
  }

  function normalizeColumns(ex) {
    if (ex && Array.isArray(ex.logColumns) && ex.logColumns.length) {
      return ex.logColumns.map((c) => ({
        id: c.id || newId(),
        kind: KIND_MAP[c.kind] ? c.kind : 'reps',
        value: c.value == null ? '' : String(c.value),
      }));
    }
    return defaultColumns(ex || {});
  }

  function optionsHtml(selected) {
    return KINDS.map(
      (k) =>
        `<option value="${k.key}" ${k.key === selected ? 'selected' : ''}>${k.label}</option>`,
    ).join('');
  }

  function syncLegacyFromColumns(ex, columns) {
    const cols = columns || normalizeColumns(ex);
    ex.logColumns = cols;
    const effort = cols.find((c) => c.kind === 'reps' || c.kind === 'reps_range' || c.kind === 'time_sec' || c.kind === 'distance_m');
    const loadCol = cols.find((c) => c.kind === 'weight_kg' || c.kind === 'weight_pct_wm' || c.kind === 'weight_lwp');
    if (effort) {
      ex.reps = String(effort.value || '').trim() || ex.reps || '1';
      if (effort.kind === 'time_sec' && !/s$/i.test(ex.reps)) {
        // keep numeric; targetKind inferred per row from column
      }
    }
    delete ex.loadExpr;
    if (loadCol) {
      if (loadCol.kind === 'weight_pct_wm') {
        const pct = Number(loadCol.value);
        if (pct >= 1 && pct <= 100) ex.loadExpr = { exprKind: 'pct_of_max', exprArg: pct / 100 };
      } else if (loadCol.kind === 'weight_lwp') {
        const delta = Number(loadCol.value);
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

  function builderColumnsHtml(columns) {
    const cols = columns && columns.length ? columns : defaultColumns({});
    return `<div class="card" style="margin-top:12px" id="logColumnsCard"><div class="eyebrow">Log columns</div><div class="meta" style="margin-bottom:8px">One metric type per column. Logger shows these hard — no dropdowns mid-session.</div><div class="stack" id="logColumnsList">${cols
      .map(
        (c, idx) => `<div class="setrow logcol-row" data-idx="${idx}" style="grid-template-columns:1.4fr 1fr auto;align-items:end">
      <div><span class="mini">Type</span><select class="logcol-kind" onchange="LogColumns.onKindChange(${idx},this.value)">${optionsHtml(c.kind)}</select></div>
      <div><span class="mini">Target</span><input class="logcol-value" value="${String(c.value || '').replace(/"/g, '&quot;')}" placeholder="${kindMeta(c.kind).placeholder || 'value / per-set list'}" onchange="LogColumns.onValueChange(${idx},this.value)"></div>
      <div class="btns" style="margin:0"><button type="button" class="btn small danger" onclick="LogColumns.removeColumn(${idx})" ${cols.length <= 1 ? 'disabled' : ''}>×</button></div>
    </div>`,
      )
      .join('')}</div><button type="button" class="btn small" style="margin-top:10px" onclick="LogColumns.addColumn()">Add column</button></div>`;
  }

  /** Draft state while the exercise sheet is open */
  let sheetColumns = [];

  function beginSheet(ex) {
    sheetColumns = normalizeColumns(ex);
    return sheetColumns;
  }

  function getSheetColumns() {
    return sheetColumns.map((c) => ({ ...c }));
  }

  function onKindChange(idx, kind) {
    if (!sheetColumns[idx]) return;
    sheetColumns[idx].kind = KIND_MAP[kind] ? kind : 'reps';
  }

  function onValueChange(idx, value) {
    if (!sheetColumns[idx]) return;
    sheetColumns[idx].value = value;
  }

  function addColumn() {
    if (sheetColumns.length >= 3) {
      if (global.alert) global.alert('Max 3 log columns.');
      return;
    }
    sheetColumns.push({ id: newId(), kind: 'reps', value: '' });
    refreshSheetList();
  }

  function removeColumn(idx) {
    if (sheetColumns.length <= 1) return;
    sheetColumns.splice(idx, 1);
    refreshSheetList();
  }

  function refreshSheetList() {
    const list = global.document && global.document.getElementById('logColumnsList');
    const card = global.document && global.document.getElementById('logColumnsCard');
    if (!card) return;
    const wrap = global.document.createElement('div');
    wrap.innerHTML = builderColumnsHtml(sheetColumns);
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
    beginSheet,
    getSheetColumns,
    onKindChange,
    onValueChange,
    addColumn,
    removeColumn,
    loggerCellsHtml,
    applyColumnTargetKinds,
  };
})(typeof window !== 'undefined' ? window : globalThis);
