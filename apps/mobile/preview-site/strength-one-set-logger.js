/**
 * One-set strength logger — 1:1 with one-set-logger-mockup.html
 */
(function (global) {
  var DIFFICULTIES = [
    { key: 'very_easy', label: 'Very easy' },
    { key: 'easy', label: 'Easy' },
    { key: 'medium', label: 'Medium' },
    { key: 'hard', label: 'Hard' },
    { key: 'max', label: 'Max' },
    { key: 'did_not_complete', label: "Didn't finish" },
  ];

  function plannedRows(t) {
    return (t.rows || []).filter(function (r) { return !r.extra; });
  }

  function ensureAutoreg(t) {
    if (!t.autoreg) {
      t.autoreg = {
        setOrdinal: 0,
        sessionAnchorKg: null,
        selectedDifficulty: null,
        restPhase: false,
        restSec: 90,
        phase: 'active',
        workStarted: false,
        side: 'left',
        round: 1,
      };
    }
    if (t.autoreg.phase == null) t.autoreg.phase = 'active';
    if (t.autoreg.workStarted == null) t.autoreg.workStarted = false;
    if (isSidePerRound(t)) {
      if (t.autoreg.side !== 'left' && t.autoreg.side !== 'right') t.autoreg.side = 'left';
      var planned = plannedRows(t);
      var ord = t.autoreg.setOrdinal || 0;
      t.autoreg.round = ord + 1;
      if (t.autoreg.round > planned.length) t.autoreg.round = Math.max(1, planned.length);
    }
    return t.autoreg;
  }

  function isSidePerRound(t) {
    return !!(t && t.sideMode === 'both_per_round');
  }

  function sideLabel(side) {
    return side === 'right' ? 'Right' : 'Left';
  }

  function setChipHtml(t, autoreg, planned, ordinal) {
    if (isSidePerRound(t)) {
      return (
        '<div class=setchip>' +
        escHtml(sideLabel(autoreg.side)) +
        ' · Round <b>' +
        (ordinal + 1) +
        '</b> / ' +
        planned.length +
        '</div>'
      );
    }
    return '<div class=setchip>Set <b>' + (ordinal + 1) + '</b> / ' + planned.length + '</div>';
  }

  function stashSideValues(row) {
    row.leftWeight = row.weight;
    row.leftReps = row.reps;
    row.leftDistance = row.distance;
    row.weight = '';
    row.reps = '';
    row.distance = '';
  }

  function syncAutoregOrdinal(t) {
    var planned = plannedRows(t);
    var firstOpen = planned.findIndex(function (r) { return !r.done; });
    ensureAutoreg(t).setOrdinal = firstOpen >= 0 ? firstOpen : Math.max(0, planned.length - 1);
  }

  function rowIndex(t, row) {
    return (t.rows || []).indexOf(row);
  }

  function parseTargetReps(row) {
    var raw = String((row && row.target) || '').trim();
    var m = raw.match(/^(\d+)/);
    return m ? Number(m[1]) : null;
  }

  function taskColumnLayout(t) {
    if (!t || !global.LogColumns || !global.LogColumns.columnLayout) return null;
    return global.LogColumns.columnLayout(t);
  }

  function isLoadKind(kind) {
    return kind === 'weight_kg' || kind === 'weight_pct_wm' || kind === 'weight_lwp';
  }

  function resolveLoggerFlow(t) {
    var layout = taskColumnLayout(t);
    if (!layout) return 'load_reps';
    if (layout.layout === 'single' && layout.effortCols[0] && layout.effortCols[0].kind === 'time_sec') {
      return 'time_primary';
    }
    if (layout.layout === 'load_x_effort' && layout.effortCols[0] && layout.effortCols[0].kind === 'time_sec') {
      return 'load_then_time';
    }
    if (layout.layout === 'triple') return 'carry';
    return 'load_reps';
  }

  function isTimePrimaryHold(t) {
    return resolveLoggerFlow(t) === 'time_primary';
  }

  function rowFieldForKind(kind) {
    if (isLoadKind(kind)) return 'weight';
    if (kind === 'distance_m') return 'distance';
    return 'reps';
  }

  function timeNotLogged(row) {
    return row.reps === '' || row.reps == null;
  }

  function loadReadyForWork(row) {
    var w = row.weight;
    return w !== '' && w != null;
  }

  function carryPrescribedTimeSec(t, ordinal) {
    var cols = (t && t.logColumns) || [];
    for (var i = 0; i < cols.length; i++) {
      if (cols[i].kind === 'time_sec') {
        var col = cols[i];
        var raw =
          col.values && col.values[ordinal] != null && String(col.values[ordinal]).trim() !== ''
            ? col.values[ordinal]
            : col.value;
        if (String(raw || '').trim() !== '') return Math.max(1, Math.round(Number(raw)));
      }
    }
    var row = (t.rows || [])[ordinal];
    if (row && row.targetKind === 'seconds') return prescribedHoldSec(row);
    return null;
  }

  function carryUsesWorkTimer(t, row, ordinal) {
    if (resolveLoggerFlow(t) !== 'carry') return false;
    var sec = carryPrescribedTimeSec(t, ordinal);
    return sec != null && sec > 0 && timeNotLogged(row);
  }

  function prescribedHoldSec(row) {
    return parseTargetReps(row) || Math.max(1, Math.round(Number(row && row.target) || 30));
  }

  function prescribedWorkSec(t, row, ordinal) {
    var flow = resolveLoggerFlow(t);
    if (flow === 'carry') {
      var carrySec = carryPrescribedTimeSec(t, ordinal);
      if (carrySec != null) return carrySec;
    }
    return prescribedHoldSec(row);
  }

  function shouldEnterWorkPhase(t, autoreg, row) {
    var flow = resolveLoggerFlow(t);
    if (!row || row.done || !timeNotLogged(row)) return false;
    if (flow === 'time_primary') return true;
    if (flow === 'load_then_time') return autoreg.phase === 'work';
    if (flow === 'carry') return carryUsesWorkTimer(t, row, autoreg.setOrdinal);
    return false;
  }

  function showSlider(t, autoreg, row) {
    var flow = resolveLoggerFlow(t);
    if (autoreg.phase === 'work') return false;
    if (flow === 'time_primary' || flow === 'load_then_time') return !timeNotLogged(row);
    if (flow === 'carry' && carryUsesWorkTimer(t, row, autoreg.setOrdinal) && timeNotLogged(row)) return false;
    return true;
  }

  /** Persist prescribed reps on the active row — display fallback alone is not enough for Next set. */
  function seedActiveRow(row, t) {
    if (!row || row.done || row.extra) return false;
    var flow = t ? resolveLoggerFlow(t) : 'load_reps';
    var autoreg = t ? ensureAutoreg(t) : null;
    if (autoreg && autoreg.phase === 'work') return false;
    if (flow === 'time_primary' || flow === 'load_then_time' || flow === 'carry') {
      if (timeNotLogged(row)) return false;
    }
    var changed = false;
    if (row.reps === '' || row.reps == null) {
      var fromTarget = parseTargetReps(row);
      if (fromTarget != null && row.targetKind !== 'seconds') {
        row.reps = String(fromTarget);
        changed = true;
      }
    }
    return changed;
  }

  function syncActiveRowFromDom(row, t) {
    if (!row || !global.document) return;
    var layout = t ? taskColumnLayout(t) : null;
    if (layout && layout.layout === 'triple') {
      layout.cols.forEach(function (col, i) {
        var el = global.document.getElementById('oneSetMetric_' + i);
        if (el && String(el.value).trim() !== '') row[rowFieldForKind(col.kind)] = el.value;
      });
      return;
    }
    var w = global.document.getElementById('oneSetWeight');
    var r = global.document.getElementById('oneSetReps');
    if (w && String(w.value).trim() !== '') row.weight = w.value;
    if (r && String(r.value).trim() !== '') row.reps = r.value;
  }

  function escHtml(value) {
    if (typeof global.esc === 'function') return global.esc(value);
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function difficultyIndex(key) {
    for (var i = 0; i < DIFFICULTIES.length; i++) {
      if (DIFFICULTIES[i].key === key) return i;
    }
    return 2;
  }

  function rowValues(row, t) {
    seedActiveRow(row, t);
    var weightVal = row.weight == null ? '' : row.weight;
    var repsVal = row.reps == null ? '' : row.reps;
    return { weightVal: weightVal, repsVal: repsVal };
  }

  function loggerPhase(t) {
    if (!t) return 'active';
    var autoreg = ensureAutoreg(t);
    if (autoreg.restPhase) return 'rest';
    var flow = resolveLoggerFlow(t);
    var planned = plannedRows(t);
    var row = planned[autoreg.setOrdinal];
    if (!row || row.done) return 'active';
    if (autoreg.phase === 'work' && timeNotLogged(row)) return 'work';
    if (flow === 'time_primary' && timeNotLogged(row)) return 'work';
    if (flow === 'carry' && carryUsesWorkTimer(t, row, autoreg.setOrdinal)) return 'work';
    return 'active';
  }

  function metricFieldValue(row, meta, kind) {
    var field = kind ? rowFieldForKind(kind) : meta.field;
    if (row[field] != null && row[field] !== '') return row[field];
    if (row.targetKind === meta.targetKind && row.target != null) return row.target;
    return '';
  }

  function metricInputId(layout, col, index) {
    if (layout === 'load_x_effort') {
      return col.kind === 'weight_kg' || col.kind === 'weight_pct_wm' || col.kind === 'weight_lwp'
        ? 'oneSetWeight'
        : 'oneSetReps';
    }
    if (layout === 'single') return 'oneSetReps';
    return 'oneSetMetric_' + index;
  }

  function metricCellsHtml(t, row, ri, opts) {
    opts = opts || {};
    var layoutInfo = taskColumnLayout(t);
    var cols = layoutInfo ? layoutInfo.cols : [{ kind: 'weight_kg' }, { kind: 'reps' }];
    var layout = layoutInfo ? layoutInfo.layout : 'load_x_effort';
    if (opts.loadOnly) cols = cols.filter(function (c) { return isLoadKind(c.kind); });
    return cols
      .map(function (col, i) {
        var meta = global.LogColumns && global.LogColumns.kindMeta ? global.LogColumns.kindMeta(col.kind) : { field: 'reps', loggerLabel: 'Reps', targetKind: 'reps' };
        var field = rowFieldForKind(col.kind);
        var val = metricFieldValue(row, meta, col.kind);
        var unit =
          field === 'weight'
            ? 'kg'
            : String(meta.loggerLabel || 'reps').toLowerCase();
        var inputId = metricInputId(layout, col, opts.loadOnly ? 0 : i);
        var sep =
          i > 0
            ? '<div class=metric-sep>' + (layout === 'triple' ? '·' : '×') + '</div>'
            : '';
        var changeHandler = opts.superset
          ? "setSupersetValue('" + field + "',this.value)"
          : 'updateSet(' + ri + ",'" + field + "',this.value)";
        return (
          sep +
          '<div><input type="number" class="metric-val" id="' +
          inputId +
          '" value="' +
          String(val).replace(/"/g, '&quot;') +
          '" onchange="' +
          changeHandler +
          '" oninput="' +
          changeHandler +
          '" aria-label="' +
          escHtml(meta.loggerLabel) +
          '">' +
          '<span class=metric-unit>' +
          unit +
          '</span></div>'
        );
      })
      .join('');
  }

  function formatRowMetricsSummary(t, row) {
    var layoutInfo = taskColumnLayout(t);
    if (isSidePerRound(t) && (row.leftWeight != null || row.leftReps != null || row.leftDistance != null)) {
      var leftParts = [];
      var rightParts = [];
      if (layoutInfo) {
        layoutInfo.cols.forEach(function (col) {
          var meta = global.LogColumns.kindMeta(col.kind);
          var field = rowFieldForKind(col.kind);
          var leftVal = row['left' + field.charAt(0).toUpperCase() + field.slice(1)];
          var rightVal = row[field];
          if (leftVal === '' || leftVal == null) leftVal = '—';
          if (rightVal === '' || rightVal == null) rightVal = '—';
          if (field === 'weight') {
            leftParts.push(escHtml(String(leftVal)) + ' kg');
            rightParts.push(escHtml(String(rightVal)) + ' kg');
          } else if (col.kind === 'time_sec') {
            leftParts.push(escHtml(String(leftVal)) + (leftVal === '—' ? '' : 's'));
            rightParts.push(escHtml(String(rightVal)) + (rightVal === '—' ? '' : 's'));
          } else {
            leftParts.push(escHtml(String(leftVal)) + ' ' + String(meta.loggerLabel || '').toLowerCase());
            rightParts.push(escHtml(String(rightVal)) + ' ' + String(meta.loggerLabel || '').toLowerCase());
          }
        });
      }
      return 'L ' + leftParts.join(' · ') + ' · R ' + rightParts.join(' · ');
    }
    if (!layoutInfo) {
      return (
        escHtml(String(row.weight != null && row.weight !== '' ? row.weight : '—')) +
        ' kg × ' +
        escHtml(String(row.reps != null && row.reps !== '' ? row.reps : '—'))
      );
    }
    var parts = [];
    layoutInfo.cols.forEach(function (col) {
      var meta = global.LogColumns.kindMeta(col.kind);
      var field = rowFieldForKind(col.kind);
      var val = row[field];
      if (val === '' || val == null) {
        if (row.targetKind === meta.targetKind && row.target != null && row.target !== '') val = row.target;
        else val = '—';
      }
      if (field === 'weight') parts.push(escHtml(String(val)) + ' kg');
      else if (col.kind === 'time_sec') parts.push(escHtml(String(val)) + (val === '—' ? '' : 's'));
      else parts.push(escHtml(String(val)) + ' ' + String(meta.loggerLabel || '').toLowerCase());
    });
    return parts.join(' · ');
  }

  function sessionElapsedSec() {
    if (typeof global.activeSession !== 'function' || typeof global.workElapsed !== 'function') return 0;
    var x = global.activeSession();
    return x ? global.workElapsed(x) : 0;
  }

  function targetRir(t) {
    return global.StrengthAdapter ? global.StrengthAdapter.targetRirForExercise(t) : 2;
  }

  function strengthWeekLabel() {
    var x = typeof global.activeSession === 'function' ? global.activeSession() : null;
    var w = x && (x.weekIndex || x.week || x.programWeek || (x.meta && x.meta.week));
    if (w != null && w !== '') return 'Strength · Week ' + w;
    return 'Strength · Week 1';
  }

  function applyChrome(t, week, badge) {
    if (global.SessionChrome && global.SessionChrome.applyBrand) {
      // Strength mockup: brand + stopwatch only — no phase badge.
      global.SessionChrome.applyBrand({
        product: 'strength',
        weekLabel: week || strengthWeekLabel(),
        elapsedSec: sessionElapsedSec(),
        badge: '',
      });
    }
  }

  function handoffHtml() {
    // Mockup screens are exact — no session handoff strip on strength boards.
    return '';
  }

  function fmtClock(totalSec) {
    // Mockup clocks use m:ss (no leading zero on minutes), matching formatMmSs.
    if (typeof global.formatMmSs === 'function') return global.formatMmSs(totalSec);
    var n = Math.max(0, Math.floor(Number(totalSec) || 0));
    var m = Math.floor(n / 60);
    var s = n % 60;
    return m + ':' + String(s).padStart(2, '0');
  }

  function eyebrowFor(t) {
    return escHtml(t.heading || t.category || 'Strength');
  }

  function taskProgress(t) {
    var x = typeof global.activeSession === 'function' ? global.activeSession() : null;
    if (!x || !x.tasks) return '';
    return 'Task ' + ((x.taskIndex || 0) + 1) + ' of ' + x.tasks.length;
  }

  function sliderCard(t, autoreg) {
    var idx = autoreg.selectedDifficulty != null ? difficultyIndex(autoreg.selectedDifficulty) : 2;
    var d = DIFFICULTIES[idx];
    var rir = targetRir(t);
    var valueLabel =
      d.key === 'medium' ? 'Medium · RIR ~' + rir : d.key === 'did_not_complete' ? "Didn't finish" : d.label;
    var nextSet = (autoreg.setOrdinal || 0) + 2;
    return (
      '<div class="slider-card">' +
      '<div class=sliderhead><b>How hard was that set?</b><span id="oneSetDiffLabel" class=slidervalue>' +
      escHtml(valueLabel) +
      '</span></div>' +
      '<input type="range" id="oneSetDifficulty" min="0" max="' +
      (DIFFICULTIES.length - 1) +
      '" step="1" value="' +
      idx +
      '" aria-label="Set difficulty" oninput="StrengthOneSetLogger.onDifficultySlide(this.value)">' +
      '<div class=sliderlabels>' +
      '<span>Very easy</span><span>Easy</span><span>Medium</span><span>Hard</span><span>Max</span><span>Didn\'t finish</span>' +
      '</div>' +
      '<div class=slider-hint>Prescribed <b>RIR ' +
      rir +
      '</b>. Slide if it felt easier or harder — <b>Next</b> updates set ' +
      nextSet +
      ' load.</div></div>'
    );
  }

  function heroActive(t, row, autoreg) {
    var ri = rowIndex(t, row);
    var vals = rowValues(row, t);
    var rir = targetRir(t);
    var missed = autoreg.selectedDifficulty === 'did_not_complete';
    if (missed) {
      var targetReps = parseTargetReps(row) || row.target || '—';
      var bwOnly =
        global.StrengthAdapter &&
        global.StrengthAdapter.bodyweightRepLift &&
        global.StrengthAdapter.bodyweightRepLift(t.name, t.category, global.S, t.exerciseId, t.rows);
      var noWeight = vals.weightVal === '' || vals.weightVal === 0;
      var wLabel = noWeight && bwOnly ? 'BW' : noWeight ? '—' : vals.weightVal;
      var wUnit = noWeight && bwOnly ? 'bodyweight' : 'kg';
      return (
        '<div class="hero missed">' +
        '<div class=hero-label>Did not complete · log reps done</div>' +
        '<div class=hero-metrics>' +
        '<div><div class=metric-val>' +
        escHtml(String(wLabel)) +
        '</div><span class=metric-unit>' +
        wUnit +
        '</span></div>' +
        '<div class=metric-sep>×</div>' +
        '<div><div class=metric-val>' +
        escHtml(String(targetReps)) +
        '</div><span class=metric-unit>target</span></div></div>' +
        '<div class=reps-input><label>Reps done</label>' +
        '<input type="number" id="oneSetReps" value="' +
        String(vals.repsVal).replace(/"/g, '&quot;') +
        '" onchange="updateSet(' +
        ri +
        ',\'reps\',this.value)"></div>' +
        '<div class=attempt-dots><span class="dot miss"></span><span class="dot ok"></span></div>' +
        '<input type="hidden" id="oneSetWeight" value="' +
        String(vals.weightVal).replace(/"/g, '&quot;') +
        '">' +
        '<div class=hero-target>Next set capped at <b>' +
        escHtml(String(vals.repsVal || '—')) +
        ' reps</b> · load unchanged</div></div>'
      );
    }
    return (
      '<div class="hero">' +
      '<div class=hero-label>Tap to edit</div>' +
      '<div class=hero-metrics>' +
      metricCellsHtml(t, row, ri, {
        loadOnly: resolveLoggerFlow(t) === 'load_then_time' && timeNotLogged(row),
      }) +
      '</div>' +
      '<div class=hero-target>Target: <b>RIR ' +
      rir +
      '</b> · next set adjusts from slider</div>' +
      (t.lastSuggestion && t.lastSuggestion.reasonCodes && t.lastSuggestion.reasonCodes.length
        ? '<div class=hero-target style="margin-top:8px">Adjusted <b>' +
          escHtml(String(t.lastSuggestion.loadKg)) +
          ' kg</b> × ' +
          escHtml(String(t.lastSuggestion.reps)) +
          '</div>'
        : '') +
      '</div>'
    );
  }

  function renderWorkPhase(t, autoreg, planned, row) {
    var ordinal = autoreg.setOrdinal;
    var prescribed = prescribedHoldSec(row);
    var remaining = global.WorkOverlay ? global.WorkOverlay.remainingSec() : prescribed;
    applyChrome(t, strengthWeekLabel());
    var ring = global.WorkOverlay
      ? global.WorkOverlay.render({
          mode: 'strength',
          remainingSec: remaining,
          label: 'remaining',
          doneEarlyLabel: 'Done early',
          doneEarlyOnclick: 'StrengthOneSetLogger.finishWorkEarly()',
        })
      : '';
    return (
      '<div class="logger-screen dial-strength">' +
      '<div class=eyebrow>Work · hold</div>' +
      '<div class=task>' +
      escHtml(t.name) +
      '</div>' +
      '<div class=progressline>' +
      escHtml(taskProgress(t)) +
      '</div>' +
      '<div class=setchip>Set <b>' +
      (ordinal + 1) +
      '</b> / ' +
      planned.length +
      ' · target <b>' +
      prescribed +
      's</b></div>' +
      ring +
      '</div>'
    );
  }

  function beginWork(sec) {
    var t = global.current && global.current();
    if (!t) return;
    var autoreg = ensureAutoreg(t);
    autoreg.phase = 'work';
    autoreg.workStarted = true;
    autoreg.workSec = Math.max(1, Math.round(Number(sec) || 30));
    if (global.WorkOverlay) {
      global.WorkOverlay.startWork(autoreg.workSec, function (actualSec) {
        finishWorkPhase(actualSec);
      });
    }
    if (typeof global.save === 'function') global.save();
  }

  function finishWorkPhase(actualSec) {
    var t = global.current && global.current();
    if (!t) return;
    var autoreg = ensureAutoreg(t);
    var planned = plannedRows(t);
    var row = planned[autoreg.setOrdinal];
    if (!row) return;
    row.reps = String(Math.max(1, Math.round(Number(actualSec) || 0)));
    row.targetKind = 'seconds';
    autoreg.phase = 'active';
    autoreg.workStarted = false;
    if (global.WorkOverlay) global.WorkOverlay.stopWork();
    if (typeof global.save === 'function') global.save();
    if (typeof global.train === 'function') global.train();
  }

  function finishWorkEarly() {
    if (global.WorkOverlay) global.WorkOverlay.finishEarly();
  }

  function renderRestPhase(t, autoreg, planned) {
    var ordinal = autoreg.setOrdinal;
    var prev = planned[ordinal - 1];
    var next = planned[ordinal];
    var restSec = autoreg.restSec || (typeof global.restSeconds === 'function' ? global.restSeconds(t.restSec) : 90);
    var remaining = global.RestOverlay ? global.RestOverlay.remainingSec() : restSec;
    var rir = targetRir(t);
    applyChrome(t, strengthWeekLabel());
    var nextSummary = next ? formatRowMetricsSummary(t, next) : '';
    var upNext = next
      ? 'Up next<span class="setchip" style="margin:10px auto 0;display:inline-flex">Set <b>' +
        (ordinal + 1) +
        '</b> / ' +
        planned.length +
        '</span><b>' +
        nextSummary +
        ' · RIR ' +
        rir +
        '</b>'
      : '';
    var ring = global.RestOverlay
      ? global.RestOverlay.render({
          mode: 'strength',
          remainingSec: remaining,
          upNextHtml: upNext,
          skipLabel: 'Skip rest',
          skipOnclick: 'StrengthOneSetLogger.finishRest()',
          addOnclick: 'RestOverlay.addRest(30)',
          clockFmt: 'mmss',
        })
      : '';
    var prevSummary = prev ? 'Set ' + ordinal + ' logged · ' + formatRowMetricsSummary(t, prev) : '';
    return (
      '<div class="logger-screen dial-strength">' +
      '<div class=eyebrow>Rest · between sets</div>' +
      '<div class=task>' +
      escHtml(t.name) +
      '</div>' +
      '<div class=progressline>' +
      prevSummary +
      '</div>' +
      ring +
      '</div>'
    );
  }

  function renderActiveLogger(t, planned, ordinal, autoreg) {
    var row = planned[ordinal];
    if (seedActiveRow(row, t) && typeof global.save === 'function') global.save();
    var missed = autoreg.selectedDifficulty === 'did_not_complete';
    var flow = resolveLoggerFlow(t);
    var sliderVisible = showSlider(t, autoreg, row);
    var nextLabel = ordinal + 1 >= planned.length ? 'Next set' : 'Next set';
    applyChrome(t, strengthWeekLabel());
    var actionHtml = '';
    if (missed) {
      actionHtml =
        '<button type="button" class="btn attempt" onclick="StrengthOneSetLogger.retryAttempt()">Log attempt · try again</button>' +
        '<button type="button" class="btn primary" style="margin-top:10px" onclick="nextStrengthSet()">Next set · lower target</button>';
    } else if (flow === 'load_then_time' && timeNotLogged(row)) {
      if (loadReadyForWork(row)) {
        actionHtml =
          '<button type="button" class="btn primary" onclick="StrengthOneSetLogger.startHold()">Start hold</button>';
      } else {
        actionHtml = '<div class=slider-hint>Set load, then start the hold timer.</div>';
      }
    } else {
      actionHtml =
        '<button type="button" class="btn primary" onclick="nextStrengthSet()">' +
        nextLabel +
        '</button>' +
        '<button type="button" class="btn ghost" onclick="addExtra()">+ Extra set</button>';
    }
    return (
      '<div class="logger-screen dial-strength">' +
      '<div class=eyebrow>' +
      eyebrowFor(t) +
      '</div>' +
      '<div class=task>' +
      escHtml(t.name) +
      '</div>' +
      '<div class=progressline>' +
      escHtml(taskProgress(t)) +
      '</div>' +
      setChipHtml(t, autoreg, planned, ordinal) +
      heroActive(t, row, autoreg) +
      (sliderVisible ? sliderCard(t, autoreg) : '') +
      '<div class=next-wrap>' +
      actionHtml +
      '</div></div>'
    );
  }

  function renderTask(t) {
    if (typeof global.current !== 'function') return '';
    syncAutoregOrdinal(t);
    var autoreg = ensureAutoreg(t);
    var planned = plannedRows(t);
    var ordinal = autoreg.setOrdinal;
    if (!planned.length || ordinal >= planned.length) {
      applyChrome(t, 'Strength');
      return (
        '<div class="logger-screen dial-strength">' +
        '<div class=eyebrow>' +
        eyebrowFor(t) +
        '</div>' +
        '<div class=task>' +
        escHtml(t.name) +
        '</div>' +
        '<div class=progressline>All sets logged</div>' +
        '<div class=next-wrap><button type="button" class="btn primary" onclick="completeStrength()">Complete exercise</button></div></div>'
      );
    }
    if (autoreg.restPhase) return renderRestPhase(t, autoreg, planned);
    var row = planned[ordinal];
    if (row && !row.done && shouldEnterWorkPhase(t, autoreg, row)) {
      if (resolveLoggerFlow(t) === 'time_primary' || resolveLoggerFlow(t) === 'carry') autoreg.phase = 'work';
      if (autoreg.phase === 'work') {
        if (!autoreg.workStarted) beginWork(prescribedWorkSec(t, row, ordinal));
        return renderWorkPhase(t, autoreg, planned, row);
      }
    }
    return renderActiveLogger(t, planned, ordinal, autoreg);
  }

  function startHold() {
    var t = global.current && global.current();
    if (!t) return;
    var autoreg = ensureAutoreg(t);
    var planned = plannedRows(t);
    var row = planned[autoreg.setOrdinal];
    if (!row || !loadReadyForWork(row)) return;
    syncActiveRowFromDom(row, t);
    autoreg.phase = 'work';
    autoreg.workStarted = false;
    if (typeof global.save === 'function') global.save();
    if (typeof global.train === 'function') global.train();
  }

  function beginRest(sec) {
    var t = global.current && global.current();
    if (!t) return;
    var autoreg = ensureAutoreg(t);
    autoreg.restPhase = true;
    autoreg.restSec = Math.max(1, Math.round(Number(sec) || 90));
    if (global.RestOverlay) {
      global.RestOverlay.startRest(autoreg.restSec, function () {
        finishRest();
      });
    }
    if (typeof global.save === 'function') global.save();
    if (typeof global.train === 'function') global.train();
  }

  function finishRest() {
    var t = global.current && global.current();
    if (!t) return;
    var autoreg = ensureAutoreg(t);
    autoreg.restPhase = false;
    if (global.RestOverlay) global.RestOverlay.stopRest();
    syncAutoregOrdinal(t);
    var planned = plannedRows(t);
    var row = planned[autoreg.setOrdinal];
    if (seedActiveRow(row, t) && typeof global.save === 'function') global.save();
    else if (typeof global.save === 'function') global.save();
    if (isTimePrimaryHold(t) && row && !row.done) {
      autoreg.phase = 'work';
      autoreg.workStarted = false;
    } else if (carryUsesWorkTimer(t, row, autoreg.setOrdinal)) {
      autoreg.phase = 'work';
      autoreg.workStarted = false;
    } else {
      autoreg.phase = 'active';
    }
    if (typeof global.train === 'function') global.train();
  }

  function retryAttempt() {
    var t = global.current && global.current();
    if (!t) return;
    ensureAutoreg(t).selectedDifficulty = 'medium';
    if (typeof global.save === 'function') global.save();
    if (typeof global.train === 'function') global.train();
  }

  function onDifficultySlide(value) {
    var idx = Number(value);
    if (!Number.isFinite(idx)) idx = 2;
    idx = Math.max(0, Math.min(DIFFICULTIES.length - 1, idx));
    var d = DIFFICULTIES[idx];
    var t = global.current && global.current();
    var rir = t ? targetRir(t) : 2;
    var label = global.document && global.document.getElementById('oneSetDiffLabel');
    if (label) {
      label.textContent =
        d.key === 'medium' ? 'Medium · RIR ~' + rir : d.key === 'did_not_complete' ? "Didn't finish" : d.label;
      if (d.key === 'did_not_complete') label.style.color = 'var(--bad)';
      else label.style.color = '';
    }
    selectStrengthDifficulty(d.key);
  }

  function selectStrengthDifficulty(key) {
    var t = global.current && global.current();
    if (!t) return;
    var prev = ensureAutoreg(t).selectedDifficulty;
    ensureAutoreg(t).selectedDifficulty = key;
    if (typeof global.save === 'function') global.save();
    // Re-render when entering/leaving missed mode so hero swaps
    if ((prev === 'did_not_complete') !== (key === 'did_not_complete') && typeof global.train === 'function') {
      global.train();
    }
  }

  function nextStrengthSet() {
    var t = global.current && global.current();
    if (!t || t.kind !== 'strength') return;
    if (ensureAutoreg(t).restPhase) return;
    var autoreg = ensureAutoreg(t);
    var planned = plannedRows(t);
    var ordinal = autoreg.setOrdinal;
    var row = planned[ordinal];
    if (!row) return;
    syncActiveRowFromDom(row, t);
    seedActiveRow(row, t);
    if (!autoreg.selectedDifficulty) {
      var slider = global.document && global.document.getElementById('oneSetDifficulty');
      if (slider) onDifficultySlide(slider.value);
    }
    if (!autoreg.selectedDifficulty) {
      if (global.alert) global.alert('Rate difficulty on the slider first.');
      return;
    }
    if (typeof global.validateStrengthRow === 'function') {
      var err = global.validateStrengthRow(row, t);
      if (err) return global.alert(err);
    }
    if (isSidePerRound(t) && autoreg.side === 'left') {
      stashSideValues(row);
      row.leftDifficulty = autoreg.selectedDifficulty;
      if (row.leftWeight != null && row.leftWeight !== '') row.weight = row.leftWeight;
      autoreg.side = 'right';
      autoreg.selectedDifficulty = null;
      if (typeof global.save === 'function') global.save();
      if (typeof global.train === 'function') global.train();
      return;
    }
    row.done = true;
    row.difficulty = autoreg.selectedDifficulty;
    if (isSidePerRound(t)) autoreg.side = 'left';
    var performedLoad = Number(row.weight);
    var performedReps = Number(row.reps);
    if (!autoreg.sessionAnchorKg && performedLoad) autoreg.sessionAnchorKg = performedLoad;
    var prescribedReps = parseTargetReps(row) || performedReps;
    var nextOrdinal = ordinal + 1;
    if (nextOrdinal < planned.length && global.StrengthAdapter && global.StrengthAdapter.suggestNextSet) {
      var suggestion = global.StrengthAdapter.suggestNextSet(global.S, t, {
        performedLoadKg: performedLoad,
        performedReps: performedReps,
        prescribedReps: prescribedReps,
        prescribedLoadKg: performedLoad,
        difficulty: autoreg.selectedDifficulty,
        sessionAnchorKg: autoreg.sessionAnchorKg || performedLoad,
        ordinal: ordinal + 1,
      });
      if (suggestion) {
        var nextRow = planned[nextOrdinal];
        nextRow.weight = suggestion.loadKg;
        nextRow.reps = suggestion.reps;
        nextRow.target = String(suggestion.reps);
        t.lastSuggestion = suggestion;
      }
    }
    autoreg.setOrdinal = nextOrdinal;
    autoreg.selectedDifficulty = null;
    if (typeof global.save === 'function') global.save();
    if (nextOrdinal < planned.length) {
      beginRest(typeof global.restSeconds === 'function' ? global.restSeconds(t.restSec) : 90);
      return;
    }
    t.complete = true;
    if (typeof global.save === 'function') global.save();
    if (global.RestOverlay) global.RestOverlay.stopRest();
    if (typeof global.stopRest === 'function') global.stopRest();
    if (typeof global.nextTask === 'function') global.nextTask();
  }

  function letterFor(i) {
    return String.fromCharCode(65 + i);
  }

  function fmtRestLabel(sec) {
    if (typeof global.fmt === 'function') return global.fmt(sec);
    var n = Math.max(0, Math.round(Number(sec) || 0));
    var m = Math.floor(n / 60);
    var s = n % 60;
    if (m && s) return m + ':' + String(s).padStart(2, '0');
    if (m) return m + ':00';
    return s + 's';
  }

  function partnerRestSec(t) {
    return 45;
  }

  function roundRestSec(t, ex) {
    if (typeof global.restSeconds === 'function') {
      return global.restSeconds((ex && ex.restSec) || (typeof global.supersetRest === 'function' ? global.supersetRest(t) : 120));
    }
    return Number(ex && ex.restSec) || 120;
  }

  function currentSupersetItem(t) {
    if (typeof global.supersetCurrent === 'function') return global.supersetCurrent(t);
    return null;
  }

  function heroSuperset(ex, row, t) {
    rowValues(row, ex);
    var rir = targetRir(ex);
    var adj =
      t.lastSuggestion && t.lastSuggestion.reasonCodes && t.lastSuggestion.reasonCodes.length
        ? '<div class=hero-target>Adjusted <b>' +
          escHtml(String(t.lastSuggestion.loadKg)) +
          ' kg</b> after last set</div>'
        : '<div class=hero-target>Target: <b>RIR ' + rir + '</b> · next set adjusts from slider</div>';
    return (
      '<div class="hero">' +
      '<div class=hero-label>Suggested · tap to edit</div>' +
      '<div class=hero-metrics>' +
      metricCellsHtml(ex, row, null, { superset: true }) +
      '</div>' +
      adj +
      '</div>'
    );
  }

  function sliderSuperset(ex, autoreg) {
    var idx = autoreg.selectedDifficulty != null ? difficultyIndex(autoreg.selectedDifficulty) : 2;
    var d = DIFFICULTIES[idx];
    var rir = targetRir(ex);
    var valueLabel = d.key === 'medium' ? 'Target RIR ' + rir : d.label;
    return (
      '<div class="slider-card">' +
      '<div class=sliderhead><b>How hard should this feel?</b><span id="oneSetDiffLabel" class=slidervalue>' +
      escHtml(valueLabel) +
      '</span></div>' +
      '<input type="range" id="oneSetDifficulty" min="0" max="' +
      (DIFFICULTIES.length - 1) +
      '" step="1" value="' +
      idx +
      '" aria-label="Set difficulty" oninput="StrengthOneSetLogger.onDifficultySlide(this.value)">' +
      '<div class=sliderlabels>' +
      '<span>Very easy</span><span>Easy</span><span>Medium</span><span>Hard</span><span>Max</span><span>Didn\'t finish</span>' +
      '</div></div>'
    );
  }

  function renderSupersetRest(t, autoreg, item) {
    var exercises = t.exercises || [];
    var next = currentSupersetItem(t);
    var restSec = autoreg.restSec || 120;
    var remaining = global.RestOverlay ? global.RestOverlay.remainingSec() : restSec;
    applyChrome(t, strengthWeekLabel());
    var nextEx = next ? exercises[next.exIndex] : null;
    var upNext = nextEx
      ? 'Up next<span class="setchip" style="margin:10px auto 0;display:inline-flex">Round <b>' +
        (next.rowIndex + 1) +
        '</b></span><b>' +
        escHtml(nextEx.name) +
        '</b>'
      : '';
    var ring = global.RestOverlay
      ? global.RestOverlay.render({
          mode: 'strength',
          remainingSec: remaining,
          upNextHtml: upNext,
          skipLabel: 'Skip rest',
          skipOnclick: 'StrengthOneSetLogger.finishRest()',
          addOnclick: 'RestOverlay.addRest(30)',
          clockFmt: 'mmss',
        })
      : '';
    return (
      '<div class="logger-screen dial-strength">' +
      '<div class=eyebrow>Rest · between rounds</div>' +
      '<div class=task>' +
      escHtml(t.heading || 'Superset') +
      '</div>' +
      '<div class=progressline>Round logged</div>' +
      ring +
      '</div>'
    );
  }

  function renderSupersetTask(t) {
    if (!t) return '';
    var item = currentSupersetItem(t);
    var autoreg = ensureAutoreg(t);
    if (autoreg.restPhase) return renderSupersetRest(t, autoreg, item);
    if (!item) {
      applyChrome(t, 'Strength');
      return (
        '<div class="logger-screen dial-strength">' +
        '<div class=eyebrow>Superset</div>' +
        '<div class=task>Superset complete</div>' +
        '<div class=progressline>All rounds are logged.</div>' +
        '<div class=next-wrap>' +
        '<button type="button" class="btn primary" onclick="addSupersetRound()">Add extra round</button>' +
        '<button type="button" class="btn ghost" onclick="supersetEditSheet()">Edit logged sets</button></div></div>'
      );
    }
    var exercises = t.exercises || [];
    var ex = exercises[item.exIndex];
    var row = item.row;
    var roundTotal = Math.max.apply(
      null,
      exercises.map(function (y) {
        return (y.rows || []).length;
      }),
    );
    var planned = (ex.rows || []).filter(function (r) {
      return !r.extra;
    });
    var partnerSec = partnerRestSec(t);
    var roundSec = roundRestSec(t, ex);
    var prevEx = item.exIndex > 0 ? exercises[item.exIndex - 1] : null;
    var nextEx = exercises[item.exIndex + 1];
    var lastInRound = !nextEx || !(nextEx.rows || [])[item.rowIndex] || item.exIndex === exercises.length - 1;
    var pill =
      prevEx || nextEx
        ? '<div class=superset-pill>' +
          letterFor(item.exIndex) +
          (item.rowIndex + 1) +
          ' → ' +
          letterFor(lastInRound ? 0 : item.exIndex + 1) +
          (item.rowIndex + 1) +
          ' · ' +
          partnerSec +
          's between partners</div>'
        : '';
    var nextLabel = lastInRound ? 'Next · ' + fmtRestLabel(roundSec) + ' after round' : 'Next';
    applyChrome(t, strengthWeekLabel());
    return (
      '<div class="logger-screen dial-strength">' +
      '<div class=eyebrow>Superset ' +
      letterFor(0) +
      ' · Round ' +
      (item.rowIndex + 1) +
      '</div>' +
      '<div class=task>' +
      escHtml(ex.name) +
      '</div>' +
      '<div class=progressline>' +
      (prevEx ? 'After ' + escHtml(prevEx.name) + ' · partner rest ' + partnerSec + 's' : 'Round ' + (item.rowIndex + 1) + ' / ' + roundTotal) +
      '</div>' +
      pill +
      '<div class=setchip>Set <b>' +
      (item.rowIndex + 1) +
      '</b> / ' +
      Math.max(planned.length, roundTotal) +
      '</div>' +
      heroSuperset(ex, row, t) +
      sliderSuperset(ex, autoreg) +
      '<div class=next-wrap>' +
      '<button type="button" class="btn primary" onclick="StrengthOneSetLogger.nextSupersetSet()">' +
      nextLabel +
      '</button></div></div>'
    );
  }

  function nextSupersetSet() {
    var t = global.current && global.current();
    if (!t || t.kind !== 'superset') return;
    if (ensureAutoreg(t).restPhase) return;
    var item = currentSupersetItem(t);
    if (!item) {
      t.complete = true;
      if (typeof global.save === 'function') global.save();
      return typeof global.train === 'function' && global.train();
    }
    var autoreg = ensureAutoreg(t);
    if (!autoreg.selectedDifficulty) {
      var slider = global.document && global.document.getElementById('oneSetDifficulty');
      if (slider) onDifficultySlide(slider.value);
    }
    if (typeof global.validateStrengthRow === 'function') {
      syncActiveRowFromDom(item.row, ex);
      var err = global.validateStrengthRow(item.row, ex);
      if (err) return global.alert(err);
    }
    var exercises = t.exercises || [];
    var ex = exercises[item.exIndex];
    item.row.done = true;
    item.row.difficulty = autoreg.selectedDifficulty;
    var next = currentSupersetItem(t);
    t.complete = !next;
    autoreg.selectedDifficulty = null;
    if (typeof global.save === 'function') global.save('superset-log');
    if (next && next.exIndex === 0) {
      beginRest(roundRestSec(t, ex));
      return;
    }
    if (typeof global.train === 'function') global.train();
  }

  function clearRestPhase() {
    var t = global.current && global.current();
    if (t && t.autoreg) t.autoreg.restPhase = false;
  }

  global.StrengthOneSetLogger = {
    DIFFICULTIES: DIFFICULTIES,
    resolveLoggerFlow: resolveLoggerFlow,
    loggerPhase: loggerPhase,
    metricCellsHtml: metricCellsHtml,
    formatRowMetricsSummary: formatRowMetricsSummary,
    renderTask: renderTask,
    renderSupersetTask: renderSupersetTask,
    onDifficultySlide: onDifficultySlide,
    selectStrengthDifficulty: selectStrengthDifficulty,
    nextStrengthSet: nextStrengthSet,
    nextSupersetSet: nextSupersetSet,
    beginRest: beginRest,
    beginWork: beginWork,
    startHold: startHold,
    finishRest: finishRest,
    finishWorkPhase: finishWorkPhase,
    finishWorkEarly: finishWorkEarly,
    retryAttempt: retryAttempt,
    isTimePrimaryHold: isTimePrimaryHold,
    isSidePerRound: isSidePerRound,
    sideLabel: sideLabel,
    setChipHtml: setChipHtml,
    clearRestPhase: clearRestPhase,
    seedActiveRow: seedActiveRow,
    syncActiveRowFromDom: syncActiveRowFromDom,
  };
  global.selectStrengthDifficulty = selectStrengthDifficulty;
  global.nextStrengthSet = nextStrengthSet;
})(typeof window !== 'undefined' ? window : globalThis);
