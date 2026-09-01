/**
 * One-set strength logger — mockup UI: hero card, session chrome, rest overlay, autoreg slider.
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
    if (!t.autoreg) {
      t.autoreg = {
        setOrdinal: 0,
        sessionAnchorKg: null,
        selectedDifficulty: null,
        restPhase: false,
        restSec: 90,
      };
    }
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

  function sessionElapsedSec() {
    if (typeof global.activeSession !== 'function' || typeof global.workElapsed !== 'function') return 0;
    var x = global.activeSession();
    return x ? global.workElapsed(x) : 0;
  }

  function sessionChromeHtml(t, subtitle) {
    if (!global.SessionChrome) return '';
    return global.SessionChrome.render({
      product: 'strength',
      title: t.name,
      subtitle: subtitle,
      weekLabel: 'STRENGTH',
      elapsedSec: sessionElapsedSec(),
    });
  }

  function targetRir(t) {
    return global.StrengthAdapter ? global.StrengthAdapter.targetRirForExercise(t) : 2;
  }

  function difficultySliderHtml(t, autoreg) {
    var idx = autoreg.selectedDifficulty != null ? difficultyIndex(autoreg.selectedDifficulty) : 2;
    var label = DIFFICULTIES[idx].label;
    var rir = targetRir(t);
    return (
      '<div class="one-set-difficulty sliderfield dial-strength">' +
      '<div class=sliderhead><b>How hard was that set?</b><span id="oneSetDiffLabel" class=slidervalue>' +
      escHtml(label) + '</span></div>' +
      '<input type="range" id="oneSetDifficulty" min="0" max="' + (DIFFICULTIES.length - 1) + '" step="1" value="' +
      idx + '" aria-label="Set difficulty" oninput="StrengthOneSetLogger.onDifficultySlide(this.value)">' +
      '<div class=sliderlabels><span>Very easy</span><span>Max</span></div>' +
      '<div class=logger-hero-meta style="margin-top:8px;text-align:left">Prescribed <b>RIR ' + rir +
      '</b>. Slide if it felt easier or harder — <b>Next</b> updates the next set load.</div></div>'
    );
  }

  function renderGhostStack(planned, ordinal) {
    var html = '';
    for (var i = 0; i < planned.length; i++) {
      if (i === ordinal) continue;
      var row = planned[i];
      var vals = rowValues(row);
      var state = row.done ? 'done' : 'ghost';
      html +=
        '<div class="one-set-ghost-row one-set-' + state + '">' +
        '<span class=one-set-ghost-num>Set ' + (i + 1) + '</span>' +
        '<span class=one-set-ghost-val>' +
        escHtml(String(row.done ? row.weight : vals.weightVal || '—')) + ' kg × ' +
        escHtml(String(row.done ? row.reps : vals.repsVal || row.target || '—')) +
        '</span>' +
        (row.done ? '<span class=one-set-check aria-hidden=true>✓</span>' : '') +
        '</div>';
    }
    if (!html) return '';
    return '<div class="one-set-ghost-stack">' + html + '</div>';
  }

  function renderHeroCard(t, planned, i, row, autoreg) {
    var ri = rowIndex(t, row);
    var vals = rowValues(row);
    var rir = targetRir(t);
    var missed = autoreg.selectedDifficulty === 'did_not_complete' ||
      difficultyIndex(autoreg.selectedDifficulty) === DIFFICULTIES.length - 1;
    var wDisplay = vals.weightVal === '' ? '—' : vals.weightVal;
    var rDisplay = vals.repsVal === '' ? '—' : vals.repsVal;
    if (missed) {
      return (
        '<div class="logger-hero-card dial-strength">' +
        '<div class=logger-hero-hint>Did not complete — log reps done</div>' +
        '<div class="logger-hero-metric" style="font-size:18px;margin-bottom:10px">' +
        escHtml(String(wDisplay)) + ' kg × ' + escHtml(String(parseTargetReps(row) || row.target || '—')) + ' target</div>' +
        '<div><span class=mini>Reps done</span>' +
        '<input type="number" class="one-set-hero-input logger-hero-reps-input" id="oneSetReps" value="' +
        String(vals.repsVal).replace(/"/g, '&quot;') + '" onchange="updateSet(' + ri + ',\'reps\',this.value)"></div>' +
        '<input type="hidden" id="oneSetWeight" value="' + String(vals.weightVal).replace(/"/g, '&quot;') + '">' +
        '<div class=logger-hero-meta>Next set capped from reps you log — load unchanged unless engine adjusts.</div></div>'
      );
    }
    return (
      '<div class="logger-hero-card dial-strength">' +
      '<div class=logger-hero-hint>Tap to edit</div>' +
      '<div class=logger-hero-metric>' +
      '<span class=logger-hero-weight-wrap><input type="number" class="one-set-hero-input logger-hero-weight-input" id="oneSetWeight" value="' +
      String(vals.weightVal).replace(/"/g, '&quot;') + '" onchange="updateSet(' + ri + ',\'weight\',this.value)"><span class=logger-hero-unit>kg</span></span>' +
      '<span class=logger-hero-x>×</span>' +
      '<span class=logger-hero-reps-wrap><input type="number" class="one-set-hero-input logger-hero-reps-input" id="oneSetReps" value="' +
      String(vals.repsVal).replace(/"/g, '&quot;') + '" onchange="updateSet(' + ri + ',\'reps\',this.value)"><span class=logger-hero-unit>reps</span></span>' +
      '</div>' +
      '<div class=logger-hero-meta>Target: <b>RIR ' + rir + '</b> — next set adjusts from slider</div>' +
      (t.lastSuggestion && t.lastSuggestion.reasonCodes && t.lastSuggestion.reasonCodes.length
        ? '<div class=logger-hero-meta style="color:var(--copper2)">Adjusted from last set · ' +
          escHtml(String(t.lastSuggestion.loadKg)) + ' kg × ' + escHtml(String(t.lastSuggestion.reps)) + '</div>'
        : '') +
      '</div>'
    );
  }

  function renderRestPhase(t, autoreg, planned) {
    var ordinal = autoreg.setOrdinal;
    var prev = planned[ordinal - 1];
    var next = planned[ordinal];
    var restSec = autoreg.restSec || (typeof global.restSeconds === 'function' ? global.restSeconds(t.restSec) : 90);
    var remaining = global.RestOverlay ? global.RestOverlay.remainingSec() : restSec;
    var summary = prev
      ? escHtml(t.name) + '<br>Set ' + ordinal + ' logged · ' + escHtml(String(prev.weight)) + ' kg × ' + escHtml(String(prev.reps))
      : escHtml(t.name);
    var upNext = next
      ? '<b>Up next: Set ' + (ordinal + 1) + ' / ' + planned.length + '</b><span>' +
        escHtml(String(next.weight || '—')) + ' kg × ' + escHtml(String(next.reps || next.target || '—')) +
        ' · RIR ' + targetRir(t) + '</span>'
      : '';
    if (!global.RestOverlay) return '';
    return global.RestOverlay.render({
      mode: 'strength',
      visible: true,
      remainingSec: remaining,
      totalSec: restSec,
      phaseLabel: 'REST · BETWEEN SETS',
      summaryHtml: summary,
      upNextHtml: upNext,
      skipOnclick: 'StrengthOneSetLogger.finishRest()',
      addOnclick: 'RestOverlay.addRest(30)',
    });
  }

  function renderActiveLogger(t, planned, ordinal, autoreg) {
    var row = planned[ordinal];
    var rir = targetRir(t);
    var nextLabel = ordinal + 1 >= planned.length ? 'Done · finish exercise' : 'Next set';
    var loadHead = typeof global.strengthLoadHeadlineHtml === 'function'
      ? global.strengthLoadHeadlineHtml(t, global.activeSession && typeof global.activeSession === 'function' ? global.activeSession()?.date : undefined)
      : '';
    var coachCue =
      global.CoachAI && typeof global.activeSession === 'function' && global.CoachAI.athleteCueHtml
        ? global.CoachAI.athleteCueHtml(global.activeSession())
        : '';
    var progressLink = typeof global.exerciseLinkHtml === 'function'
      ? '<div class=meta style="margin-top:4px">' + global.exerciseLinkHtml(t.name, t.exerciseId, t.category, 'View progress') + '</div>'
      : '';

    return (
      '<div class="card task-shell one-set-card dial-strength">' +
      sessionChromeHtml(t, 'Set ' + (ordinal + 1) + ' / ' + planned.length) +
      progressLink +
      loadHead +
      coachCue +
      renderGhostStack(planned, ordinal) +
      renderHeroCard(t, planned, ordinal, row, autoreg) +
      difficultySliderHtml(t, autoreg) +
      '<button type="button" class="btn primary block logger-next-btn" style="margin-top:14px" onclick="nextStrengthSet()">' +
      nextLabel + '</button>' +
      '<button type="button" class="btn block" style="margin-top:8px" onclick="addExtra()">+ Extra set</button>' +
      '<button type="button" class="btn block" style="margin-top:8px" onclick="completeStrength()">' +
      (t.complete ? 'Reopen exercise' : 'Complete exercise early') + '</button></div>'
    );
  }

  function renderTask(t) {
    if (typeof global.current !== 'function') return '';
    syncAutoregOrdinal(t);
    var autoreg = ensureAutoreg(t);
    var planned = plannedRows(t);
    var ordinal = autoreg.setOrdinal;
    if (!planned.length || ordinal >= planned.length) {
      return (
        '<div class="card task-shell one-set-card dial-strength">' +
        sessionChromeHtml(t, 'Complete') +
        '<div class=title>All sets logged</div>' +
        '<button class="btn primary block" style="margin-top:12px" onclick="completeStrength()">Complete exercise</button></div>'
      );
    }
    if (autoreg.restPhase) return renderRestPhase(t, autoreg, planned);
    return renderActiveLogger(t, planned, ordinal, autoreg);
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
    if (global.RestOverlay) {
      global.RestOverlay.stopRest();
      global.RestOverlay.hide();
    }
    if (typeof global.save === 'function') global.save();
    if (typeof global.train === 'function') global.train();
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
    if (ensureAutoreg(t).restPhase) return;
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
      beginRest(typeof global.restSeconds === 'function' ? global.restSeconds(t.restSec) : 90);
      return;
    }
    t.complete = true;
    if (typeof global.save === 'function') global.save();
    if (global.RestOverlay) global.RestOverlay.stopRest();
    if (typeof global.stopRest === 'function') global.stopRest();
    if (typeof global.nextTask === 'function') global.nextTask();
  }

  function clearRestPhase() {
    var t = global.current && global.current();
    if (t && t.autoreg) t.autoreg.restPhase = false;
  }

  global.StrengthOneSetLogger = {
    DIFFICULTIES: DIFFICULTIES,
    renderTask: renderTask,
    onDifficultySlide: onDifficultySlide,
    selectStrengthDifficulty: selectStrengthDifficulty,
    nextStrengthSet: nextStrengthSet,
    beginRest: beginRest,
    finishRest: finishRest,
    clearRestPhase: clearRestPhase,
  };
  global.selectStrengthDifficulty = selectStrengthDifficulty;
  global.nextStrengthSet = nextStrengthSet;
})(typeof window !== 'undefined' ? window : globalThis);
