/**
 * Conditioning interval autoreg — felt RPE on rest + decideNextPhase between work phases.
 * Coach builder unchanged; hooks existing interval clock in index.html.
 */
(function (global) {
  var FELT_OPTIONS = [
    { key: 'easy', label: 'Too easy', rpe: 4 },
    { key: 'on', label: 'On target', rpe: 6.5 },
    { key: 'hard', label: 'Too hard', rpe: 8.5 },
  ];

  function num(v) {
    var n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function emptyZones() {
    return { recovery: 0, aerobic: 0, anaerobic: 0, peak: 0 };
  }

  function ensureAutoreg(t) {
    if (!t.autoreg) t.autoreg = { pendingFelt: null, lastWorkZones: null, workZoneBaseline: null };
    return t.autoreg;
  }

  function snapshotZones(source) {
    var z = source || emptyZones();
    return {
      recovery: num(z.recovery),
      aerobic: num(z.aerobic),
      anaerobic: num(z.anaerobic),
      peak: num(z.peak),
    };
  }

  function zoneDelta(current, baseline) {
    var out = emptyZones();
    current = current || emptyZones();
    baseline = baseline || emptyZones();
    ['recovery', 'aerobic', 'anaerobic', 'peak'].forEach(function (k) {
      out[k] = Math.max(0, num(current[k]) - num(baseline[k]));
    });
    return out;
  }

  function onWorkPhaseStart(t) {
    if (!t) return;
    var autoreg = ensureAutoreg(t);
    var zones = global.bleHr && global.bleHr.zoneSeconds ? snapshotZones(global.bleHr.zoneSeconds) : emptyZones();
    autoreg.workZoneBaseline = zones;
    autoreg.pendingFelt = null;
  }

  function onWorkEnd(t) {
    if (!t) return;
    var autoreg = ensureAutoreg(t);
    var current = global.bleHr && global.bleHr.zoneSeconds ? snapshotZones(global.bleHr.zoneSeconds) : emptyZones();
    autoreg.lastWorkZones = zoneDelta(current, autoreg.workZoneBaseline || emptyZones());
    autoreg.pendingFelt = null;
  }

  function zoneComplianceForTask(t) {
    if (!global.condEffortMeta) return 'borderline';
    var effort = global.condEffortMeta(t.effort || 'medium');
    var zones = (t.autoreg && t.autoreg.lastWorkZones) || emptyZones();
    var targetKey = effort.zoneKey || 'aerobic';
    var targetSec = num(zones[targetKey]);
    var total =
      num(zones.recovery) + num(zones.aerobic) + num(zones.anaerobic) + num(zones.peak);
    if (total <= 0) return 'borderline';
    var frac = targetSec / total;
    if (frac >= 0.45) return 'met';
    if (frac >= 0.25) return 'borderline';
    return 'not_met';
  }

  function restPanelHtml(t, iv) {
    if (!iv || iv.phase !== 'rest' || iv.finished) return '';
    if (!global.EngineAdapter || !global.EngineAdapter.suggestNextPhase) return '';
    var autoreg = ensureAutoreg(t);
    var btns = FELT_OPTIONS.map(function (o) {
      var sel = autoreg.pendingFelt === o.rpe ? ' primary' : '';
      return (
        '<button type="button" class="btn small' +
        sel +
        '" onclick="CondIntervalAutoreg.setIntervalFelt(' +
        o.rpe +
        ')">' +
        (global.esc ? global.esc(o.label) : o.label) +
        '</button>'
      );
    }).join('');
    var hint =
      t.targetWatts != null && t.targetWatts !== ''
        ? 'Next interval target: ' + t.targetWatts + ' W'
        : 'Engine adjusts next interval from feel + HR zones';
    var cue =
      global.CoachAI && global.CoachAI.athleteCueHtml && typeof global.activeSession === 'function'
        ? global.CoachAI.athleteCueHtml(global.activeSession())
        : '';
    return (
      '<div class="card" style="margin-top:10px;padding:12px">' +
      '<div class=title>Rest · how did that interval feel?</div>' +
      '<div class=meta>' +
      hint +
      ' · pick before the next work phase</div>' +
      cue +
      '<div class=btns style="flex-wrap:wrap;justify-content:flex-start;margin-top:8px">' +
      btns +
      '</div></div>'
    );
  }

  function setIntervalFelt(rpe) {
    var t = global.current && global.current();
    if (!t) return;
    ensureAutoreg(t).pendingFelt = num(rpe);
    if (typeof global.save === 'function') global.save();
    if (typeof global.refreshCondLogOrTrain === 'function') global.refreshCondLogOrTrain();
  }

  function beforeNextWork(t, iv) {
    if (!t || !global.EngineAdapter) return;
    var autoreg = ensureAutoreg(t);
    if (autoreg.pendingFelt == null) return;
    var decision = global.EngineAdapter.suggestNextPhase(t, {
      felt: autoreg.pendingFelt,
      zoneCompliance: zoneComplianceForTask(t),
      incomplete: false,
    });
    if (decision && decision.action !== 'noop') {
      global.EngineAdapter.applyNextPhaseDecision(t, decision);
    }
    autoreg.lastPhaseDecision = decision;
    autoreg.pendingFelt = null;
    autoreg.workZoneBaseline = null;
    autoreg.lastWorkZones = null;
  }

  function intervalHtmlExtra(t, iv) {
    return restPanelHtml(t, iv);
  }

  global.CondIntervalAutoreg = {
    FELT_OPTIONS: FELT_OPTIONS,
    onWorkPhaseStart: onWorkPhaseStart,
    onWorkEnd: onWorkEnd,
    beforeNextWork: beforeNextWork,
    restPanelHtml: restPanelHtml,
    intervalHtmlExtra: intervalHtmlExtra,
    setIntervalFelt: setIntervalFelt,
    zoneComplianceForTask: zoneComplianceForTask,
  };
  global.setIntervalFelt = setIntervalFelt;
})(typeof window !== 'undefined' ? window : globalThis);
