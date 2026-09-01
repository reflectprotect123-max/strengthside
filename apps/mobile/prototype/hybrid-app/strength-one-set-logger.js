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

  /** Persist prescribed reps on the active row — display fallback alone is not enough for Next set. */
  function seedActiveRow(row) {
    if (!row || row.done || row.extra) return false;
    var changed = false;
    if (row.reps === '' || row.reps == null) {
      var fromTarget = parseTargetReps(row);
      if (fromTarget != null) {
        row.reps = String(fromTarget);
        changed = true;
      }
    }
    return changed;
  }

  function syncActiveRowFromDom(row) {
    if (!row || !global.document) return;
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

  function rowValues(row) {
    seedActiveRow(row);
    var weightVal = row.weight == null ? '' : row.weight;
    var repsVal = row.reps == null ? '' : row.reps;
    return { weightVal: weightVal, repsVal: repsVal };
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
    var vals = rowValues(row);
    var rir = targetRir(t);
    var missed = autoreg.selectedDifficulty === 'did_not_complete';
    if (missed) {
      var targetReps = parseTargetReps(row) || row.target || '—';
      var wLabel = vals.weightVal === '' || vals.weightVal === 0 ? 'BW' : vals.weightVal;
      var wUnit = vals.weightVal === '' || vals.weightVal === 0 ? 'bodyweight' : 'kg';
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
      '<div><input type="number" class="metric-val" id="oneSetWeight" value="' +
      String(vals.weightVal).replace(/"/g, '&quot;') +
      '" onchange="updateSet(' +
      ri +
      ',\'weight\',this.value)" oninput="updateSet(' +
      ri +
      ',\'weight\',this.value)" aria-label="Weight kg">' +
      '<span class=metric-unit>kg</span></div>' +
      '<div class=metric-sep>×</div>' +
      '<div><input type="number" class="metric-val" id="oneSetReps" value="' +
      String(vals.repsVal).replace(/"/g, '&quot;') +
      '" onchange="updateSet(' +
      ri +
      ',\'reps\',this.value)" oninput="updateSet(' +
      ri +
      ',\'reps\',this.value)" aria-label="Reps">' +
      '<span class=metric-unit>reps</span></div></div>' +
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

  function renderRestPhase(t, autoreg, planned) {
    var ordinal = autoreg.setOrdinal;
    var prev = planned[ordinal - 1];
    var next = planned[ordinal];
    var restSec = autoreg.restSec || (typeof global.restSeconds === 'function' ? global.restSeconds(t.restSec) : 90);
    var remaining = global.RestOverlay ? global.RestOverlay.remainingSec() : restSec;
    var rir = targetRir(t);
    applyChrome(t, strengthWeekLabel());
    var upNext = next
      ? 'Up next<span class="setchip" style="margin:10px auto 0;display:inline-flex">Set <b>' +
        (ordinal + 1) +
        '</b> / ' +
        planned.length +
        '</span><b>' +
        escHtml(String(next.weight || '—')) +
        ' kg × ' +
        escHtml(String(next.reps || next.target || '—')) +
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
    return (
      '<div class="logger-screen dial-strength">' +
      '<div class=eyebrow>Rest · between sets</div>' +
      '<div class=task>' +
      escHtml(t.name) +
      '</div>' +
      '<div class=progressline>' +
      (prev
        ? 'Set ' + ordinal + ' logged · ' + escHtml(String(prev.weight)) + ' kg × ' + escHtml(String(prev.reps))
        : '') +
      '</div>' +
      ring +
      '</div>'
    );
  }

  function renderActiveLogger(t, planned, ordinal, autoreg) {
    var row = planned[ordinal];
    if (seedActiveRow(row) && typeof global.save === 'function') global.save();
    var missed = autoreg.selectedDifficulty === 'did_not_complete';
    var nextLabel = ordinal + 1 >= planned.length ? 'Next set' : 'Next set';
    applyChrome(t, strengthWeekLabel());
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
      '<div class=setchip>Set <b>' +
      (ordinal + 1) +
      '</b> / ' +
      planned.length +
      '</div>' +
      heroActive(t, row, autoreg) +
      sliderCard(t, autoreg) +
      '<div class=next-wrap>' +
      (missed
        ? '<button type="button" class="btn attempt" onclick="StrengthOneSetLogger.retryAttempt()">Log attempt · try again</button>' +
          '<button type="button" class="btn primary" style="margin-top:10px" onclick="nextStrengthSet()">Next set · lower target</button>'
        : '<button type="button" class="btn primary" onclick="nextStrengthSet()">' +
          nextLabel +
          '</button>' +
          '<button type="button" class="btn ghost" onclick="addExtra()">+ Extra set</button>') +
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
    if (global.RestOverlay) global.RestOverlay.stopRest();
    syncAutoregOrdinal(t);
    var planned = plannedRows(t);
    var row = planned[autoreg.setOrdinal];
    if (seedActiveRow(row) && typeof global.save === 'function') global.save();
    else if (typeof global.save === 'function') global.save();
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
    syncActiveRowFromDom(row);
    seedActiveRow(row);
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
    var vals = rowValues(row);
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
      '<div><input type="number" class="metric-val" id="oneSetWeight" value="' +
      String(vals.weightVal).replace(/"/g, '&quot;') +
      '" onchange="setSupersetValue(\'weight\',this.value)" oninput="setSupersetValue(\'weight\',this.value)" aria-label="Weight kg">' +
      '<span class=metric-unit>kg</span></div>' +
      '<div class=metric-sep>×</div>' +
      '<div><input type="number" class="metric-val" id="oneSetReps" value="' +
      String(vals.repsVal).replace(/"/g, '&quot;') +
      '" onchange="setSupersetValue(\'reps\',this.value)" oninput="setSupersetValue(\'reps\',this.value)" aria-label="Reps">' +
      '<span class=metric-unit>reps</span></div></div>' +
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
      var err = global.validateStrengthRow(item.row);
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
    renderTask: renderTask,
    renderSupersetTask: renderSupersetTask,
    onDifficultySlide: onDifficultySlide,
    selectStrengthDifficulty: selectStrengthDifficulty,
    nextStrengthSet: nextStrengthSet,
    nextSupersetSet: nextSupersetSet,
    beginRest: beginRest,
    finishRest: finishRest,
    retryAttempt: retryAttempt,
    clearRestPhase: clearRestPhase,
    seedActiveRow: seedActiveRow,
    syncActiveRowFromDom: syncActiveRowFromDom,
  };
  global.selectStrengthDifficulty = selectStrengthDifficulty;
  global.nextStrengthSet = nextStrengthSet;
})(typeof window !== 'undefined' ? window : globalThis);
