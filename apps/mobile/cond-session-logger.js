/**
 * The Engine session logger — mockup UI: work phase, rest overlay, steady, recap.
 */
(function (global) {
  function escHtml(value) {
    if (typeof global.esc === 'function') return global.esc(value);
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function num(v) {
    var n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function fmtSec(totalSec) {
    if (typeof global.fmt === 'function') return global.fmt(totalSec);
    var n = Math.max(0, Math.floor(Number(totalSec) || 0));
    var m = Math.floor(n / 60);
    var s = n % 60;
    return m + ':' + String(s).padStart(2, '0');
  }

  function sessionElapsedSec() {
    if (typeof global.activeSession !== 'function' || typeof global.workElapsed !== 'function') return 0;
    var x = global.activeSession();
    return x ? global.workElapsed(x) : 0;
  }

  function sessionChromeHtml(t, subtitle, weekLabel) {
    if (!global.SessionChrome) return '';
    var title = t.heading || (global.condSummary ? global.condSummary(t) : 'Conditioning');
    return global.SessionChrome.render({
      product: 'engine',
      title: title,
      subtitle: subtitle,
      weekLabel: weekLabel || 'INTERVALS',
      elapsedSec: sessionElapsedSec(),
    });
  }

  function planLine(t) {
    if (typeof global.condPlanLineTask === 'function') return global.condPlanLineTask(t);
    return '';
  }

  function effortMeta(t) {
    if (typeof global.condEffortMeta === 'function') return global.condEffortMeta(t.effort || 'medium');
    return { name: 'Medium', zoneKey: 'aerobic' };
  }

  function liveHr() {
    var t = global.current && global.current();
    var r = (t && t.result) || {};
    return num(global.bleHr && global.bleHr.liveBpm) || num(r.liveHr) || num(r.avgHr) || null;
  }

  function liveWatts(t) {
    var r = (t && t.result) || {};
    if (global.echoBike && global.echoBike.live && global.echoBike.live.power_w != null) {
      return Math.round(global.echoBike.live.power_w);
    }
    if (r.liveWatts != null) return Math.round(num(r.liveWatts));
    if (r.avgWatts != null) return Math.round(num(r.avgWatts));
    if (t && t.targetWatts != null && t.targetWatts !== '') return Math.round(num(t.targetWatts));
    return null;
  }

  function zoneLabel(t) {
    var effort = effortMeta(t);
    var zones =
      typeof global.athZonesForReadiness === 'function' && typeof global.athHomeMetrics === 'function'
        ? global.athZonesForReadiness(global.athHomeMetrics().recovery)
        : [];
    var z = zones.find(function (x) {
      return x.key === effort.zoneKey;
    });
    return z ? z.label || z.name || effort.name : effort.name;
  }

  function hrRingHtml(hr) {
    if (hr == null) {
      return '<div class=engine-hr-ring aria-hidden=true><span class=engine-hr-num>—</span><span class=engine-hr-lab>HR</span></div>';
    }
    return (
      '<div class=engine-hr-ring aria-label="Heart rate"><span class=engine-hr-num>' +
      Math.round(hr) +
      '</span><span class=engine-hr-lab>bpm</span></div>'
    );
  }

  function workGridHtml(t, watts, hr) {
    var targetW = t.targetWatts != null && t.targetWatts !== '' ? Math.round(num(t.targetWatts)) + 'W' : '—';
    return (
      '<div class=engine-work-grid>' +
      '<div class=engine-work-stat><small>Watts</small><b>' +
      escHtml(watts != null ? watts + 'W' : targetW) +
      '</b></div>' +
      '<div class=engine-work-stat><small>Target</small><b>' +
      escHtml(targetW) +
      '</b></div>' +
      '<div class=engine-work-stat><small>Zone</small><b>' +
      escHtml(zoneLabel(t)) +
      '</b></div></div>' +
      '<div class=engine-work-hr-row>' +
      hrRingHtml(hr) +
      '<div class=engine-work-hr-copy>On target · Strap ' +
      (global.bleHr && global.bleHr.status === 'live' ? 'live' : 'optional') +
      '</div></div>'
    );
  }

  function intervalIv(t) {
    if (typeof global.ensureTaskInterval === 'function') return global.ensureTaskInterval(t);
    if (typeof global.normaliseInterval === 'function') return global.normaliseInterval(t);
    return t.interval || null;
  }

  function workSubtitle(t, iv) {
    if (!iv || iv.finished) return 'Complete';
    if (iv.phase === 'rest') return 'Rest · interval ' + Math.min(iv.round, num(t.rounds) || 1);
    if (iv.phase === 'ready') return 'Ready';
    return 'Work ' + Math.min(iv.round, num(t.rounds) || 1) + '/' + (num(t.rounds) || 1);
  }

  function renderWorkPhase(t, iv) {
    var remaining =
      typeof global.intervalRemaining === 'function' ? global.intervalRemaining(iv) : num(iv.remaining);
    var watts = liveWatts(t);
    var hr = liveHr();
    var plan = planLine(t);
    var controls =
      '<div class=btns style="margin-top:12px;justify-content:flex-start">' +
      '<button type=button class="btn small primary" onclick=toggleIntervals()>' +
      (iv.running ? 'Pause' : 'Start') +
      '</button>' +
      '<button type=button class="btn small" onclick=skipInterval()>Skip phase</button>' +
      '<button type=button class="btn small danger" onclick=endIntervals()>End early</button></div>';
    return (
      '<div class="card task-shell engine-session dial-engine">' +
      sessionChromeHtml(t, workSubtitle(t, iv), 'INTERVALS · ' + escHtml(t.modality || 'Mixed')) +
      (plan ? '<div class=logger-hero-meta style="text-align:left;margin-bottom:8px">' + escHtml(plan) + '</div>' : '') +
      '<div class=engine-work-countdown id=intervalClock>' +
      fmtSec(remaining) +
      '</div>' +
      workGridHtml(t, watts, hr) +
      controls +
      '</div>'
    );
  }

  function renderRestPhase(t, iv) {
    var restSec = num(t.restSec) || 90;
    var remaining = global.RestOverlay ? global.RestOverlay.remainingSec() : restSec;
    if (global.RestOverlay && !global.RestOverlay.remainingSec()) {
      global.RestOverlay.startRest(restSec, function () {
        if (global.CondSessionLogger && global.CondSessionLogger.finishRest) global.CondSessionLogger.finishRest();
      });
    }
    var summary =
      escHtml(t.modality || 'Intervals') +
      '<br>Interval ' +
      Math.min(iv.round, num(t.rounds) || 1) +
      ' done · ' +
      (liveWatts(t) != null ? liveWatts(t) + 'W avg' : 'work logged') +
      (liveHr() != null ? ' · HR ' + Math.round(liveHr()) : '');
    var nextRound = Math.min(iv.round + 1, num(t.rounds) || 1);
    var upNext =
      '<b>Up next: Work ' +
      nextRound +
      '/' +
      (num(t.rounds) || 1) +
      '</b><span>' +
      escHtml(planLine(t)) +
      '</span>';
    var slider =
      global.CondIntervalAutoreg && global.CondIntervalAutoreg.restSliderHtml
        ? global.CondIntervalAutoreg.restSliderHtml(t, iv)
        : '';
    var overlay = global.RestOverlay
      ? global.RestOverlay.render({
          mode: 'engine',
          visible: true,
          remainingSec: remaining,
          totalSec: restSec,
          phaseLabel: 'REST',
          summaryHtml: summary,
          upNextHtml: upNext + slider,
          skipLabel: 'Skip · start work ' + nextRound,
          skipOnclick: 'CondSessionLogger.finishRest()',
          addOnclick: 'RestOverlay.addRest(30)',
        })
      : '';
    return overlay;
  }

  function renderSteady(t) {
    var r = t.result || {};
    var mins = r.duration ? Math.round((num(r.duration) / 60) * 10) / 10 : t.targetDurationMin || '';
    var effort = effortMeta(t);
    return (
      '<div class="card task-shell engine-session dial-engine">' +
      sessionChromeHtml(
        t,
        'Steady · ' + escHtml(t.modality || 'Mixed') + ' · ' + escHtml(effort.name),
        'STEADY',
      ) +
      '<div class=engine-work-countdown id=blockClock>' +
      fmtSec(typeof global.blockElapsed === 'function' ? global.blockElapsed(t) : 0) +
      '</div>' +
      '<div class=logger-hero-meta>Hold conversational pace · target zone ' +
      escHtml(zoneLabel(t)) +
      '</div>' +
      workGridHtml(t, liveWatts(t), liveHr()) +
      '<div class="mph-twin-fields" style="margin-top:12px"><div class=field><label>Minutes</label><input id=condMin type=number min=0 step=.5 value="' +
      escHtml(mins) +
      '"></div><div class=field><label>Avg HR</label><input id=condHr type=number min=30 max=250 value="' +
      escHtml(r.avgHr || '') +
      '" oninput="setSimpleCondHr(this.value)"></div></div>' +
      '<div class=btns style="margin-top:10px"><button type=button class="btn small primary" onclick=toggleSimpleCondClock()>' +
      (t.blockTimer && t.blockTimer.on ? 'Pause' : 'Start') +
      '</button></div></div>'
    );
  }

  function renderRecap(t, iv) {
    var r = t.result || {};
    var rounds = iv ? num(iv.completedRounds) : num(r.roundsCompleted);
    return (
      '<div class="card task-shell engine-session dial-engine">' +
      sessionChromeHtml(t, 'Session recap', 'THE ENGINE') +
      '<div class=engine-recap-card>' +
      '<div class=engine-recap-row><span>Intervals</span><b>' +
      rounds +
      '</b></div>' +
      '<div class=engine-recap-row><span>Avg HR</span><b>' +
      escHtml(r.avgHr || liveHr() || '—') +
      '</b></div>' +
      '<div class=engine-recap-row><span>Duration</span><b>' +
      fmtSec(r.duration || (iv && iv.elapsed) || 0) +
      '</b></div></div>' +
      (global.CondIntervalAutoreg && global.CondIntervalAutoreg.recapSliderHtml
        ? global.CondIntervalAutoreg.recapSliderHtml(t)
        : '') +
      '<button type=button class="btn primary block logger-next-btn" style="margin-top:14px" onclick=completeSimpleCond()>Save · update progression</button></div>'
    );
  }

  function renderIntervalCore(t) {
    var iv = intervalIv(t);
    if (!iv) return renderSteady(t);
    if (iv.finished) return renderRecap(t, iv);
    if (iv.phase === 'rest' && !iv.finished) {
      ensureAutoreg(t).restPhase = true;
      return renderRestPhase(t, iv);
    }
    ensureAutoreg(t).restPhase = false;
    return renderWorkPhase(t, iv);
  }

  function ensureAutoreg(t) {
    if (!t.autoreg) t.autoreg = { restPhase: false };
    return t.autoreg;
  }

  function finishRest() {
    var t = global.current && global.current();
    if (!t) return;
    ensureAutoreg(t).restPhase = false;
    if (global.RestOverlay) global.RestOverlay.skipRest();
    var iv = intervalIv(t);
    if (iv && iv.phase === 'rest' && typeof global.skipInterval === 'function') global.skipInterval();
    if (typeof global.save === 'function') global.save();
    if (typeof global.refreshCondLogOrTrain === 'function') global.refreshCondLogOrTrain();
  }

  function renderSimpleCond(t) {
    if (!t) return '';
    var iv = intervalIv(t);
    var core =
      taskNeedsInterval(t) && iv ? renderIntervalCore(t) : renderSteady(t);
    var connectLabel =
      global.bleHr && global.bleHr.status === 'live'
        ? 'Strap live'
        : global.bleHr && global.bleHr.status === 'connecting'
          ? 'Listening…'
          : 'Connect strap';
    var echoBtn =
      typeof global.modalityWantsEcho === 'function' && global.modalityWantsEcho(t.modality)
        ? '<button type=button class="btn small" onclick=toggleEchoBike()>' +
          (global.echoBike && global.echoBike.status === 'live' ? 'Echo live' : 'Connect Echo') +
          '</button>'
        : '';
    return (
      '<div class="mph-shell dial-engine">' +
      '<button type=button class=mph-back onclick="leaveSimpleCond()">← Back</button>' +
      core +
      '<div class=btns style="margin-top:9px;justify-content:flex-start">' +
      '<button type=button class="btn small" onclick=connectSimpleCondHr()>' +
      connectLabel +
      '</button>' +
      echoBtn +
      '</div>' +
      (iv && !iv.finished
        ? ''
        : '<button type=button class="btn primary block" style="margin-top:14px" onclick=completeSimpleCond()>Complete</button>') +
      '</div>'
    );
  }

  function taskNeedsInterval(t) {
    if (typeof global.taskNeedsIntervalClock === 'function') return global.taskNeedsIntervalClock(t);
    return t.conditioningType === 'intervals' || t.condFmt === 'intervals';
  }

  function renderIntervalTask(t) {
    var iv = intervalIv(t);
    if (iv && iv.finished) {
      var r = t.result || {};
      return (
        renderRecap(t, iv) +
        '<div class=card style="margin-top:12px">' +
        (typeof global.conditioningNotesBox === 'function' ? global.conditioningNotesBox(t) : '') +
        (typeof global.resultInputs === 'function'
          ? global.resultInputs(r, global.resultFields(t.modality, t))
          : '') +
        '<button type=button class="btn primary block" style="margin-top:12px" onclick=completeConditioning()>Save results and complete block</button></div>'
      );
    }
    return renderIntervalCore(t);
  }

  global.CondSessionLogger = {
    renderSimpleCond: renderSimpleCond,
    renderIntervalTask: renderIntervalTask,
    finishRest: finishRest,
  };
})(typeof window !== 'undefined' ? window : globalThis);
