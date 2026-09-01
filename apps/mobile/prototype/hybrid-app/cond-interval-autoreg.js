/**
 * Conditioning interval autoreg — RPE slider on rest + decideNextPhase between work phases.
 */
(function (global) {
  var FELT_OPTIONS = [
    { key: 'easy', label: 'Too easy', rpe: 4 },
    { key: 'on', label: 'On target', rpe: 6.5 },
    { key: 'hard', label: 'Too hard', rpe: 8.5 },
    { key: 'max', label: 'Max', rpe: 9.5 },
    { key: 'stopped', label: 'Stopped early', rpe: 10 },
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

  function feltIndex(rpe) {
    if (rpe == null) return 1;
    var best = 1;
    var bestDiff = Infinity;
    for (var i = 0; i < FELT_OPTIONS.length; i++) {
      var diff = Math.abs(FELT_OPTIONS[i].rpe - num(rpe));
      if (diff < bestDiff) {
        bestDiff = diff;
        best = i;
      }
    }
    return best;
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

  function sliderInner(t, idPrefix, oninput, title) {
    idPrefix = idPrefix || 'condFelt';
    oninput = oninput || 'CondIntervalAutoreg.onFeltSlide(this.value)';
    title = title || 'How hard was that interval?';
    var autoreg = ensureAutoreg(t);
    var idx = feltIndex(autoreg.pendingFelt);
    var label = FELT_OPTIONS[idx].label;
    var hint =
      t.targetWatts != null && t.targetWatts !== ''
        ? 'Next interval target: ' + t.targetWatts + ' W'
        : 'Slide if it felt easier or harder — <b>Next interval</b> adjusts pace and HR target.';
    return (
      '<div class=sliderhead><b>' +
      title +
      '</b><span id="' +
      idPrefix +
      'Label" class=slidervalue>' +
      (global.esc ? global.esc(label) : label) +
      '</span></div>' +
      '<input type="range" id="' +
      idPrefix +
      '" min="0" max="' +
      (FELT_OPTIONS.length - 1) +
      '" step="1" value="' +
      idx +
      '" aria-label="Interval difficulty" oninput="' +
      oninput +
      '">' +
      '<div class=sliderlabels>' +
      '<span>Very easy</span><span>Easy</span><span>Medium</span><span>Hard</span><span>Max</span><span>Stopped</span>' +
      '</div>' +
      '<div class=slider-hint>' +
      hint +
      '</div>'
    );
  }

  function restSliderHtml(t, iv) {
    if (!iv || iv.phase !== 'rest' || iv.finished) return '';
    return (
      '<div class="slider-card">' +
      sliderInner(t, 'condFelt', 'CondIntervalAutoreg.onFeltSlide(this.value)') +
      '</div>'
    );
  }

  function restSliderInner(t) {
    return sliderInner(t, 'condFelt', 'CondIntervalAutoreg.onFeltSlide(this.value)');
  }

  function recapSliderHtml(t) {
    return (
      '<div class="slider-card">' +
      sliderInner(t, 'condRecapFelt', 'CondIntervalAutoreg.onRecapSlide(this.value)', 'Overall session feel') +
      '</div>'
    );
  }

  function restPanelHtml(t, iv) {
    return restSliderHtml(t, iv);
  }

  function onFeltSlide(value) {
    var idx = Number(value);
    if (!Number.isFinite(idx)) idx = 1;
    idx = Math.max(0, Math.min(FELT_OPTIONS.length - 1, idx));
    var opt = FELT_OPTIONS[idx];
    var label = global.document && global.document.getElementById('condFeltLabel');
    if (label) label.textContent = opt.label;
    setIntervalFelt(opt.rpe);
  }

  function onRecapSlide(value) {
    var idx = Number(value);
    if (!Number.isFinite(idx)) idx = 1;
    idx = Math.max(0, Math.min(FELT_OPTIONS.length - 1, idx));
    var opt = FELT_OPTIONS[idx];
    var label = global.document && global.document.getElementById('condRecapFeltLabel');
    if (label) label.textContent = opt.label;
    var t = global.current && global.current();
    if (!t) return;
    t.result = t.result || {};
    t.result.sessionRpe = opt.rpe;
    if (typeof global.save === 'function') global.save();
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
    restSliderHtml: restSliderHtml,
    restSliderInner: restSliderInner,
    recapSliderHtml: recapSliderHtml,
    intervalHtmlExtra: intervalHtmlExtra,
    setIntervalFelt: setIntervalFelt,
    onFeltSlide: onFeltSlide,
    onRecapSlide: onRecapSlide,
    zoneComplianceForTask: zoneComplianceForTask,
  };
  global.setIntervalFelt = setIntervalFelt;
})(typeof window !== 'undefined' ? window : globalThis);
