/**
 * One-set strength logger — difficulty slider + engine suggestNextSet between sets.
 */
(function (global) {
  var DIFFICULTIES = [
    { key: 'very_easy', label: 'Very easy' },
    { key: 'easy', label: 'Easy' },
    { key: 'medium', label: 'On target' },
    { key: 'hard', label: 'Hard' },
    { key: 'max', label: 'Max' },
    { key: 'did_not_complete', label: "Couldn't finish" },
  ];

  function plannedRows(t) {
    return (t.rows || []).filter(function (r) { return !r.extra; });
  }

  function ensureAutoreg(t) {
    if (!t.autoreg) t.autoreg = { setOrdinal: 0, sessionAnchorKg: null, selectedDifficulty: null };
    return t.autoreg;
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

  function escHtml(value) {
    if (typeof global.esc === 'function') return global.esc(value);
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function renderTask(t) {
    if (typeof global.current !== 'function') return '';
    syncAutoregOrdinal(t);
    var autoreg = ensureAutoreg(t);
    var planned = plannedRows(t);
    var ordinal = autoreg.setOrdinal;
    var row = planned[ordinal];
    if (!row) {
      return '<div class="card task-shell"><div class=title>All sets logged</div><button class="btn primary block" style="margin-top:12px" onclick="completeStrength()">Complete exercise</button></div>';
    }
    var ri = rowIndex(t, row);
    var last = typeof global.lastRows === 'function' ? global.lastRows(t.exerciseId, t.name) : [];
    var loadHead = typeof global.strengthLoadHeadlineHtml === 'function'
      ? global.strengthLoadHeadlineHtml(t, global.activeSession && typeof global.activeSession === 'function' ? global.activeSession()?.date : undefined)
      : '';
    var coachCue =
      global.CoachAI && typeof global.activeSession === 'function' && global.CoachAI.athleteCueHtml
        ? global.CoachAI.athleteCueHtml(global.activeSession())
        : '';
    var rest = typeof global.restSeconds === 'function' ? global.restSeconds(t.restSec) : 90;
    var targetRir = global.StrengthAdapter ? global.StrengthAdapter.targetRirForExercise(t) : 2;
    var prev = last[ordinal] || last[last.length - 1] || null;
    var prevHtml = prev
      ? '<div class=meta>Last time: ' + escHtml(String(prev.weight || '—')) + ' kg × ' + escHtml(String(prev.reps || '—')) + '</div>'
      : '<div class=meta>No previous sets logged.</div>';
    var diffBtns = DIFFICULTIES.map(function (d) {
      var sel = autoreg.selectedDifficulty === d.key ? ' primary' : '';
      return '<button type="button" class="btn small' + sel + '" onclick="selectStrengthDifficulty(\'' + d.key + '\')">' + escHtml(d.label) + '</button>';
    }).join('');
    var weightVal = row.weight == null ? '' : row.weight;
    var repsVal = row.reps == null ? '' : row.reps;
    if (!String(repsVal).trim() && row.target) repsVal = parseTargetReps(row) || row.target;
    return '<div class="card task-shell">' +
      '<div class=row><div>' +
      '<div class=title>' + (typeof global.exerciseLinkHtml === 'function'
        ? global.exerciseLinkHtml(t.name, t.exerciseId, t.category, 'Progress')
        : escHtml(t.name)) + '</div>' +
      '<div class=meta>Set ' + (ordinal + 1) + ' of ' + planned.length + ' · target ' + targetRir + ' RIR · Rest ' +
      (typeof global.fmt === 'function' ? global.fmt(rest) : rest + 's') + ' after Next</div>' +
      prevHtml +
      '</div><div class=btns style="margin-top:0">' +
      (typeof global.restBtn === 'function' ? global.restBtn(rest) : '') +
      '</div></div>' +
      loadHead +
      coachCue +
      '<div class=guardrail>Rate difficulty after this set — engine adjusts the next one.</div>' +
      '<div class=divider></div>' +
      '<div class="setrow builder-setrow one-set-row last-set">' +
      '<div class=setnum>' + (ordinal + 1) + '<span class=target>' + escHtml(String(row.target || '—')) + '</span></div>' +
      '<div><span class=mini>Weight</span><input type="number" id="oneSetWeight" value="' + String(weightVal).replace(/"/g, '&quot;') + '" onchange="updateSet(' + ri + ',\'weight\',this.value)"></div>' +
      '<div><span class=mini>Reps</span><input type="number" id="oneSetReps" value="' + String(repsVal).replace(/"/g, '&quot;') + '" onchange="updateSet(' + ri + ',\'reps\',this.value)"></div>' +
      '</div>' +
      '<div class=field style="margin-top:14px"><label>How did that set feel?</label>' +
      '<div class=btns style="flex-wrap:wrap;justify-content:flex-start;margin-top:8px">' + diffBtns + '</div></div>' +
      '<button class="btn primary block" style="margin-top:14px" onclick="nextStrengthSet()">Next set</button>' +
      '<button class="btn block" style="margin-top:8px" onclick="completeStrength()">' + (t.complete ? 'Reopen exercise' : 'Complete exercise early') + '</button>' +
      '</div>';
  }

  function selectStrengthDifficulty(key) {
    var t = global.current && global.current();
    if (!t) return;
    ensureAutoreg(t).selectedDifficulty = key;
    if (typeof global.save === 'function') global.save();
    if (typeof global.train === 'function') global.train();
  }

  function nextStrengthSet() {
    var t = global.current && global.current();
    if (!t || t.kind !== 'strength') return;
    var autoreg = ensureAutoreg(t);
    var planned = plannedRows(t);
    var ordinal = autoreg.setOrdinal;
    var row = planned[ordinal];
    if (!row) return;
    if (!autoreg.selectedDifficulty) {
      if (global.alert) global.alert('Pick how the set felt first.');
      return;
    }
    if (typeof global.validateStrengthRow === 'function') {
      var err = global.validateStrengthRow(row);
      if (err) return global.alert(err);
    }
    row.done = true;
    row.difficulty = autoreg.selectedDifficulty;
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
      if (typeof global.maybeStartRestAfterLog === 'function') {
        var rest = typeof global.restSeconds === 'function' ? global.restSeconds(t.restSec) : 90;
        global.maybeStartRestAfterLog(rest, true);
      }
      if (typeof global.train === 'function') global.train();
      return;
    }
    t.complete = true;
    if (typeof global.save === 'function') global.save();
    if (typeof global.stopRest === 'function') global.stopRest();
    if (typeof global.nextTask === 'function') global.nextTask();
  }

  global.StrengthOneSetLogger = {
    DIFFICULTIES: DIFFICULTIES,
    renderTask: renderTask,
    selectStrengthDifficulty: selectStrengthDifficulty,
    nextStrengthSet: nextStrengthSet,
  };
  global.selectStrengthDifficulty = selectStrengthDifficulty;
  global.nextStrengthSet = nextStrengthSet;
})(typeof window !== 'undefined' ? window : globalThis);
