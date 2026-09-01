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

  function difficultyByKey(key) {
    for (var i = 0; i < DIFFICULTIES.length; i++) {
      if (DIFFICULTIES[i].key === key) return DIFFICULTIES[i];
    }
    return DIFFICULTIES[2];
  }

  function difficultyIndex(key) {
    for (var i = 0; i < DIFFICULTIES.length; i++) {
      if (DIFFICULTIES[i].key === key) return i;
    }
    return 2;
  }

  function rowValues(row) {
    var weightVal = row.weight == null ? '' : row.weight;
    var repsVal = row.reps == null ? '' : row.reps;
    if (!String(repsVal).trim() && row.target) repsVal = parseTargetReps(row) || row.target;
    return { weightVal: weightVal, repsVal: repsVal };
  }

  function difficultySliderHtml(selectedKey) {
    var idx = selectedKey != null ? difficultyIndex(selectedKey) : 2;
    var label = DIFFICULTIES[idx].label;
    return (
      '<div class="one-set-difficulty sliderfield">' +
      '<div class=sliderhead><b>Difficulty</b><span id="oneSetDiffLabel" class=slidervalue>' + escHtml(label) + '</span></div>' +
      '<input type="range" id="oneSetDifficulty" min="0" max="' + (DIFFICULTIES.length - 1) + '" step="1" value="' + idx + '" ' +
      'aria-label="Set difficulty" oninput="StrengthOneSetLogger.onDifficultySlide(this.value)">' +
      '<div class=sliderlabels><span>Easy</span><span>Max</span></div></div>'
    );
  }

  function renderGhostRow(i, row, state) {
    var vals = rowValues(row);
    var diffLabel = row.difficulty ? difficultyByKey(row.difficulty).label : '';
    var weightDisplay = state === 'done'
      ? escHtml(String(row.weight == null ? '—' : row.weight))
      : escHtml(String(vals.weightVal || '—'));
    var repsDisplay = state === 'done'
      ? escHtml(String(row.reps == null ? '—' : row.reps))
      : escHtml(String(vals.repsVal || row.target || '—'));
    return (
      '<div class="setrow builder-setrow one-set-row one-set-' + state + (state === 'done' ? ' done' : '') + '">' +
      '<div class=setnum>' + (i + 1) + '<span class=target>' + escHtml(String(row.target || '—')) + '</span></div>' +
      '<div><span class=mini>Weight</span><div class=one-set-readout>' + weightDisplay + '</div></div>' +
      '<div><span class=mini>Reps</span><div class=one-set-readout>' + repsDisplay + '</div></div>' +
      '<div><span class=mini>Difficulty</span><div class=one-set-readout one-set-readout-diff>' +
      escHtml(diffLabel || (state === 'done' ? '—' : 'Up next')) + '</div></div>' +
      '<div class=one-set-row-action>' + (state === 'done' ? '<span class=one-set-check aria-hidden=true>✓</span>' : '') + '</div></div>'
    );
  }

  function renderActiveRow(t, planned, i, row, autoreg) {
    var ri = rowIndex(t, row);
    var vals = rowValues(row);
    var nextLabel = i + 1 >= planned.length ? 'Done' : 'Next';
    return (
      '<div class="setrow builder-setrow one-set-row one-set-active last-set one-set-row-active">' +
      '<div class=setnum>' + (i + 1) + '<span class=target>' + escHtml(String(row.target || '—')) + '</span></div>' +
      '<div><span class=mini>Weight</span><input type="number" class=one-set-hero-input id="oneSetWeight" value="' +
      String(vals.weightVal).replace(/"/g, '&quot;') + '" onchange="updateSet(' + ri + ',\'weight\',this.value)"></div>' +
      '<div><span class=mini>Reps</span><input type="number" class=one-set-hero-input id="oneSetReps" value="' +
      String(vals.repsVal).replace(/"/g, '&quot;') + '" onchange="updateSet(' + ri + ',\'reps\',this.value)"></div>' +
      '<div class=one-set-difficulty-wrap>' + difficultySliderHtml(autoreg.selectedDifficulty) + '</div>' +
      '<div class=one-set-row-action><button type="button" class="btn small primary" onclick="nextStrengthSet()">' + nextLabel + '</button></div></div>'
    );
  }

  function renderSetStack(t, planned, ordinal, autoreg) {
    var html = '';
    for (var i = 0; i < planned.length; i++) {
      if (i < ordinal) html += renderGhostRow(i, planned[i], 'done');
      else if (i === ordinal) html += renderActiveRow(t, planned, i, planned[i], autoreg);
      else html += renderGhostRow(i, planned[i], 'ghost');
    }
    return '<div class="one-set-stack">' + html + '</div>';
  }

  function renderTask(t) {
    if (typeof global.current !== 'function') return '';
    syncAutoregOrdinal(t);
    var autoreg = ensureAutoreg(t);
    var planned = plannedRows(t);
    var ordinal = autoreg.setOrdinal;
    var row = planned[ordinal];
    if (!row) {
      return '<div class="card task-shell one-set-card"><div class=title>All sets logged</div><button class="btn primary block" style="margin-top:12px" onclick="completeStrength()">Complete exercise</button></div>';
    }
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
    var progressLink = typeof global.exerciseLinkHtml === 'function'
      ? '<div class=meta style="margin-top:4px">' + global.exerciseLinkHtml(t.name, t.exerciseId, t.category, 'View progress') + '</div>'
      : '';

    return (
      '<div class="card task-shell one-set-card">' +
      '<div class=row><div>' +
      '<div class=title>' + escHtml(t.name) + '</div>' +
      progressLink +
      '<div class=meta>One set at a time · Target ' + targetRir + ' RIR · Rest ' +
      (typeof global.fmt === 'function' ? global.fmt(rest) : rest + 's') + ' after Next</div>' +
      prevHtml +
      '</div><div class=btns style="margin-top:0">' +
      (typeof global.restBtn === 'function' ? global.restBtn(rest) : '') +
      '</div></div>' +
      loadHead +
      coachCue +
      '<div class=guardrail>Athlete rates <b>difficulty after each set</b> — the engine adjusts load for the next set.</div>' +
      '<div class=divider></div>' +
      renderSetStack(t, planned, ordinal, autoreg) +
      '<button class="btn block" style="margin-top:12px" onclick="completeStrength()">' +
      (t.complete ? 'Reopen exercise' : 'Complete exercise early') + '</button></div>'
    );
  }

  function onDifficultySlide(value) {
    var idx = Number(value);
    if (!Number.isFinite(idx)) idx = 2;
    idx = Math.max(0, Math.min(DIFFICULTIES.length - 1, idx));
    var d = DIFFICULTIES[idx];
    var label = global.document && global.document.getElementById('oneSetDiffLabel');
    if (label) label.textContent = d.label;
    selectStrengthDifficulty(d.key);
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
      var slider = global.document && global.document.getElementById('oneSetDifficulty');
      if (slider) onDifficultySlide(slider.value);
    }
    if (!autoreg.selectedDifficulty) {
      if (global.alert) global.alert('Rate difficulty on the slider first.');
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
    onDifficultySlide: onDifficultySlide,
    selectStrengthDifficulty: selectStrengthDifficulty,
    nextStrengthSet: nextStrengthSet,
  };
  global.selectStrengthDifficulty = selectStrengthDifficulty;
  global.nextStrengthSet = nextStrengthSet;
})(typeof window !== 'undefined' ? window : globalThis);
