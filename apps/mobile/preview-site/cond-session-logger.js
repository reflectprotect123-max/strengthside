/**
 * The Engine session logger — 1:1 with conditioning-one-phase-mockup.html
 * Covers intervals work/rest, steady, recovery skin, and session recap.
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
    // Mockup clocks: m:ss (no leading zero on minutes).
    if (typeof global.formatMmSs === 'function') return global.formatMmSs(totalSec);
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

  function planLine(t) {
    if (typeof global.condPlanLineTask === 'function') return global.condPlanLineTask(t);
    return '';
  }

  function effortMeta(t) {
    if (typeof global.condEffortMeta === 'function') return global.condEffortMeta(t.effort || 'medium');
    return { name: 'Medium', zoneKey: 'aerobic', key: t && t.effort ? t.effort : 'medium' };
  }

  function zoneTarget(t) {
    var effort = effortMeta(t);
    var recovery =
      typeof global.athHomeMetrics === 'function' ? global.athHomeMetrics().recovery : 71;
    var zones =
      typeof global.athZonesForReadiness === 'function' ? global.athZonesForReadiness(recovery) : [];
    var z =
      (zones || []).find(function (x) {
        return x.key === effort.zoneKey || x.name === effort.name;
      }) ||
      zones[1] ||
      zones[0] ||
      null;
    var zoneName = { easy: 'Zone 2', medium: 'Zone 3', hard: 'Zone 4' };
    var title = zoneName[effort.key || t.effort || 'medium'] || (z && z.name) || 'Zone 3';
    var sub = z ? z.lo + '–' + z.hi + ' bpm' : '142–158 bpm';
    return { title: title, sub: sub, lo: z && z.lo, hi: z && z.hi };
  }

  function isRecovery(t) {
    return !!(t && (t.recoverySession || String(t.category || '').toLowerCase() === 'recovery'));
  }

  /** Live delivery debt + estimated repay — recap only, not during active logging. */
  function recoveryDebtRecapRows(t) {
    if (!isRecovery(t)) return '';
    var snap =
      typeof global.athRecoveryDebtSnapshot === 'function' ? global.athRecoveryDebtSnapshot() : null;
    if (!snap || !snap.debt || num(snap.debt.score) <= 0) return '';
    var debt = snap.debt;
    var score = Math.round(num(debt.score));
    var scoreClass = score >= 55 ? '' : score >= 30 ? '' : ' class=good';
    var mins = Math.round((num((t.result || {}).duration) / 60) * 10) / 10;
    if (mins <= 0) mins = num(t.targetDurationMin) || 0;
    var repayEst = 0;
    if (global.RecoveryEngine && global.RecoveryEngine.recoveryRepayFromSession) {
      repayEst = num(global.RecoveryEngine.recoveryRepayFromSession({}, t));
    } else if (global.RecoveryEngine && global.RecoveryEngine.recoveryRepayEstimateMinutes && mins > 0) {
      repayEst = num(global.RecoveryEngine.recoveryRepayEstimateMinutes(mins));
    }
    var rows =
      '<div class=recap-row><span>Recovery debt</span><b' +
      scoreClass +
      '>' +
      score +
      '</b></div>';
    if (repayEst > 0) {
      rows +=
        '<div class=recap-row><span>Repay this session</span><b class=good>~' +
        escHtml(repayEst) +
        '</b></div>';
    }
    return rows;
  }

  function applyChrome(t, week, badge) {
    if (global.SessionChrome && global.SessionChrome.applyBrand) {
      global.SessionChrome.applyBrand({
        product: 'engine',
        weekLabel: week || 'Intervals · ' + (t.modality || 'Mixed'),
        elapsedSec: sessionElapsedSec(),
        badge: badge || '',
      });
    }
  }

  function liveHr() {
    var t = global.current && global.current();
    var r = (t && t.result) || {};
    var bpm = num(global.bleHr && global.bleHr.liveBpm) || num(r.liveHr) || num(r.avgHr) || null;
    return bpm > 0 ? bpm : null;
  }

  function hrZoneName(t, bpm) {
    if (bpm != null && typeof global.mphZoneForHr === 'function' && typeof global.athZonesForReadiness === 'function') {
      var recovery = typeof global.athHomeMetrics === 'function' ? global.athHomeMetrics().recovery : 71;
      var zones = global.athZonesForReadiness(recovery);
      return global.mphZoneForHr(bpm, zones).name;
    }
    return zoneTarget(t).title;
  }

  function hrMetaHtml(t, hr) {
    var live = global.bleHr && global.bleHr.status === 'live';
    var connecting = global.bleHr && global.bleHr.status === 'connecting';
    var primary = live ? 'On target' : connecting ? 'Listening…' : hr != null ? 'Live' : 'Strap optional';
    var secondary = live
      ? 'Strap live · ' + hrZoneName(t, hr)
      : connecting
        ? 'Waiting for bpm…'
        : hr != null
          ? Math.round(hr) + ' bpm · connect for live'
          : 'Connect when ready';
    return (
      '<div class=hr-meta><b id=loggerHrMeta>' +
      escHtml(primary) +
      '</b><span id=loggerHrMetaSub>' +
      escHtml(secondary) +
      '</span></div>'
    );
  }

  function hrGaugeBlockHtml(t) {
    var hr = liveHr();
    return (
      '<div class=live-hr><div class=hr-gauge id=loggerHrGauge>' +
      (hr != null ? Math.round(hr) : '—') +
      '</div>' +
      hrMetaHtml(t, hr) +
      '</div>'
    );
  }

  function targetHrBoxHtml(t) {
    var hr = liveHr();
    var zt = zoneTarget(t);
    return (
      '<div class=target-box><b id=loggerHrTarget>' +
      (hr != null ? Math.round(hr) : '—') +
      '</b><span>' +
      escHtml(hr != null ? hrZoneName(t, hr) : zt.title) +
      ' · HR bpm</span></div>'
    );
  }

  function steadyHrBoxHtml(t, recovery) {
    var hr = liveHr();
    var zt = zoneTarget(recovery ? Object.assign({}, t, { effort: 'easy' }) : t);
    var display =
      hr != null ? String(Math.round(hr)) : zt.lo ? zt.lo + '–' + zt.hi : recovery ? '100–120' : '120–135';
    var sub = hr != null ? hrZoneName(t, hr) + ' · live' : 'Target · HR bpm';
    return (
      '<div class=target-box><b id=loggerHrTarget>' +
      escHtml(display) +
      '</b><span>' +
      escHtml(sub) +
      '</span></div>'
    );
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
    return zoneTarget(t).title;
  }

  function intervalIv(t) {
    if (typeof global.ensureTaskInterval === 'function') return global.ensureTaskInterval(t);
    if (typeof global.normaliseInterval === 'function') return global.normaliseInterval(t);
    return t.interval || null;
  }

  function taskNeedsInterval(t) {
    if (typeof global.taskNeedsIntervalClock === 'function') return global.taskNeedsIntervalClock(t);
    return t.conditioningType === 'intervals' || t.condFmt === 'intervals' || t.condFmt === 'tempo';
  }

  function ensureAutoreg(t) {
    if (!t.autoreg) t.autoreg = { restPhase: false };
    return t.autoreg;
  }

  function deltaBadgeHtml(t) {
    var d = t.autoreg && t.autoreg.lastPhaseDecision;
    if (!d || d.nextTargetWatts == null || d.action === 'hold' || d.action === 'noop') return '';
    var sign = d.action === 'decrease' ? '−' : '+';
    var prev = num(t._prevTargetWatts);
    var delta = prev ? Math.abs(Math.round(d.nextTargetWatts - prev)) : null;
    if (delta == null) return '<span class=engine-delta>' + sign + 'W adjusted</span>';
    return '<span class=engine-delta>' + sign + delta + 'W</span>';
  }

  function adaptNoteHtml(t) {
    var d = t.autoreg && t.autoreg.lastPhaseDecision;
    if (!d || d.action === 'noop' || d.action === 'hold') return '';
    var msg =
      d.action === 'decrease'
        ? 'Previous interval rated <b>too hard</b> → eased' +
          (d.nextTargetWatts != null ? ' to ' + d.nextTargetWatts + 'W' : '')
        : 'Previous interval rated <b>too easy</b> → raised' +
          (d.nextTargetWatts != null ? ' to ' + d.nextTargetWatts + 'W' : '');
    return '<div class="adapt-note' + (d.action === 'decrease' ? ' warn' : '') + '">' + msg + '</div>';
  }

  function renderWorkPhase(t, iv) {
    var remaining =
      typeof global.intervalRemaining === 'function' ? global.intervalRemaining(iv) : num(iv.remaining);
    var watts = liveWatts(t);
    var hr = liveHr();
    var rounds = num(t.rounds) || 1;
    var round = Math.min(Math.max(1, iv.round || 1), rounds);
    var phase = iv.phase || 'ready';
    applyChrome(t, 'Intervals · ' + (t.modality || 'Mixed'), 'Work ' + round + '/' + rounds);
    var targetW = t.targetWatts != null && t.targetWatts !== '' ? Math.round(num(t.targetWatts)) : null;
    var primary =
      phase === 'ready'
        ? '<button type=button class="btn primary" onclick=toggleIntervals()>Start work</button>'
        : iv.running
          ? '<button type=button class="btn primary" onclick=skipInterval()>End interval</button>'
          : '<button type=button class="btn primary" onclick=toggleIntervals()>Resume</button>';
    return (
      '<div class="logger-screen dial-engine">' +
      '<div class=eyebrow>Conditioning · intervals</div>' +
      '<div class=task>' +
      escHtml(t.heading || t.modality || 'Intervals') +
      '</div>' +
      '<div class=progressline>' +
      escHtml(planLine(t)) +
      '</div>' +
      '<div class=phasechip>Interval <b>' +
      round +
      '</b> / ' +
      rounds +
      ' · work</div>' +
      '<div class="hero work">' +
      '<div class=hero-label>Work time remaining</div>' +
      '<div class=timer-big id=intervalClock>' +
      fmtSec(remaining) +
      '</div>' +
      '<div class=timer-sub>stay in target zone</div>' +
      '<div class=target-row>' +
      '<div class=target-box><b>' +
      (watts != null ? watts : targetW != null ? targetW : '—') +
      '</b><span>Watts</span></div>' +
      '<div class=target-box><b>' +
      escHtml(t.targetPace || '—') +
      '</b><span>/500m</span></div>' +
      targetHrBoxHtml(t) +
      '</div>' +
      hrGaugeBlockHtml(t) +
      '<div class=hero-target>Target effort: <b>RIR 2 equivalent · ' +
      escHtml(effortMeta(t).name) +
      '</b></div></div>' +
      adaptNoteHtml(t) +
      '<div class=next-wrap>' +
      primary +
      '</div></div>'
    );
  }

  function renderRestPhase(t, iv) {
    var restSec = num(t.restSec) || 90;
    var remaining = global.RestOverlay ? global.RestOverlay.remainingSec() : restSec;
    if (global.RestOverlay && remaining <= 0) {
      global.RestOverlay.startRest(restSec, function () {
        finishRest();
      });
      remaining = restSec;
    }
    var rounds = num(t.rounds) || 1;
    var nextRound = Math.min(iv.round + 1, rounds);
    applyChrome(t, 'Intervals · ' + (t.modality || 'Mixed'), 'Rest');
    var sliderHtml =
      global.CondIntervalAutoreg && global.CondIntervalAutoreg.restSliderHtml
        ? global.CondIntervalAutoreg.restSliderHtml(t, iv)
        : '';
    var upNext =
      'Up next · Interval ' +
      nextRound +
      '/' +
      rounds +
      '<b>' +
      (t.targetWatts != null ? t.targetWatts + 'W' : '—') +
      ' · ' +
      (function () {
        var pace = String(t.targetPace || '—');
        if (pace !== '—' && pace.indexOf('/500') < 0) pace = pace + '/500m';
        return escHtml(pace);
      })() +
      ' · ' +
      escHtml(zoneTarget(t).title) +
      ' ' +
      deltaBadgeHtml(t) +
      '</b>';
    var restHr = hrGaugeBlockHtml(t);
    var ring = global.RestOverlay
      ? global.RestOverlay.render({
          mode: 'engine',
          remainingSec: remaining,
          upNextHtml: upNext,
          skipLabel: 'Next interval',
          skipOnclick: 'CondSessionLogger.finishRest()',
          addOnclick: 'RestOverlay.addRest(30)',
          sliderHtml: sliderHtml,
        })
      : '';
    return (
      '<div class="logger-screen dial-engine">' +
      '<div class=eyebrow>Recover · between work</div>' +
      '<div class=task>' +
      escHtml(t.heading || t.modality || 'Intervals') +
      '</div>' +
      '<div class=progressline>Interval ' +
      Math.min(iv.round, rounds) +
      ' done' +
      (liveWatts(t) != null ? ' · ' + liveWatts(t) + 'W avg' : '') +
      (liveHr() != null ? ' · HR ' + Math.round(liveHr()) : '') +
      '</div>' +
      restHr +
      ring +
      '</div>'
    );
  }

  function renderSteady(t) {
    var r = t.result || {};
    var effort = effortMeta(t);
    var recovery = isRecovery(t);
    applyChrome(
      t,
      recovery ? 'Recovery · ' + (t.modality || 'Mixed') : 'Steady · ' + (t.modality || 'Mixed'),
      recovery ? 'Zone 1–2' : 'Zone 2',
    );
    var left = typeof global.blockElapsed === 'function' ? global.blockElapsed(t) : 0;
    var target = num(t.targetDurationMin) * 60;
    var remain = target > 0 ? Math.max(0, target - left) : left;
    var eyebrow = recovery ? 'Conditioning · recovery' : 'Conditioning · steady-state';
    var sub = recovery ? 'easy flush · stop before fatigue' : 'conversational pace';
    var finishLabel = recovery ? 'Finish recovery' : 'Finish · rate session';
    return (
      '<div class="logger-screen dial-engine">' +
      '<div class=eyebrow>' +
      eyebrow +
      '</div>' +
      '<div class=task>' +
      escHtml(t.heading || (recovery ? 'Recovery' : t.modality || 'Steady')) +
      '</div>' +
      '<div class=progressline>' +
      escHtml(planLine(t)) +
      (t.recoveryPct != null ? ' · debt repay ' + Math.round(num(t.recoveryPct) * 100) + '%' : '') +
      '</div>' +
      '<div class=phasechip>' +
      (recovery ? 'Recovery' : 'Steady') +
      ' · <b>' +
      fmtSec(remain) +
      '</b> left</div>' +
      '<div class="hero work">' +
      '<div class=hero-label>' +
      (recovery ? 'Recovery time remaining' : 'Session time remaining') +
      '</div>' +
      '<div class=timer-big id=blockClock>' +
      fmtSec(remain) +
      '</div>' +
      '<div class=timer-sub>' +
      sub +
      '</div>' +
      '<div class=target-row>' +
      steadyHrBoxHtml(t, recovery) +
      '<div class=target-box><b>' +
      escHtml(recovery ? 'Zone 2' : zoneTarget(t).title) +
      '</b><span>' +
      escHtml(recovery ? 'Easy' : effort.name) +
      '</span></div>' +
      '<div class=target-box><b>' +
      (recovery ? 'RPE 2–3' : 'RPE 3–4') +
      '</b><span>Target</span></div></div>' +
      hrGaugeBlockHtml(t) +
      '</div>' +
      '<input type=hidden id=condMin value="' +
      escHtml(r.duration ? Math.round((num(r.duration) / 60) * 10) / 10 : t.targetDurationMin || '') +
      '">' +
      '<input type=hidden id=condHr value="' +
      escHtml(r.avgHr || '') +
      '">' +
      '<div class=next-wrap>' +
      '<button type=button class="btn primary" onclick=' +
      (recovery ? 'beginCondRecap()' : 'completeSimpleCond()') +
      '>' +
      finishLabel +
      '</button>' +
      '<button type=button class="btn ghost" onclick=connectSimpleCondHr()>Connect strap</button></div></div>'
    );
  }

  function renderRecap(t, iv) {
    var r = t.result || {};
    var rounds = iv ? num(iv.completedRounds) : num(r.roundsCompleted);
    var planned = num(t.rounds) || rounds || 0;
    var duration = r.duration || (iv && iv.elapsed) || 0;
    var recovery = isRecovery(t);
    var rpe = r.sessionRpe != null ? r.sessionRpe : 6.5;
    var rpeLabel = rpe >= 9 ? 'Max' : rpe >= 8 ? 'Hard' : rpe >= 6 ? 'Medium (6)' : rpe >= 4 ? 'Easy' : 'Very easy';
    applyChrome(t, recovery ? 'Recovery complete' : 'Complete', 'Done');
    var progressNote = recovery
      ? '<div class="adapt-note">Recovery logged — no load progression. Debt repay recorded.</div>'
      : '<div class="adapt-note warn"><b>Next session:</b> +1 round OR +5s work when earned.</div>';
    return (
      '<div class="logger-screen dial-engine">' +
      '<div class=eyebrow>Session recap</div>' +
      '<div class=task>' +
      escHtml(t.heading || (recovery ? 'Recovery' : 'Conditioning')) +
      '</div>' +
      '<div class=progressline>' +
      (recovery ? fmtSec(duration) + ' easy movement' : planned + ' rounds · ' + fmtSec(duration) + ' total') +
      '</div>' +
      '<div class="hero" style="text-align:left;padding:18px">' +
      '<div style="font-size:12px;color:var(--muted);margin-bottom:12px">' +
      (recovery ? 'Recovery summary' : 'Cardio completion') +
      '</div>' +
      '<div class=recap-grid>' +
      (recovery
        ? ''
        : '<div class=recap-row><span>Time in target zone</span><b class=good>' +
          escHtml(r.timeInZonePct != null ? Math.round(num(r.timeInZonePct)) + '%' : '—') +
          '</b></div>') +
      '<div class=recap-row><span>Avg HR</span><b>' +
      escHtml(r.avgHr || liveHr() || '—') +
      '</b></div>' +
      (recovery
        ? recoveryDebtRecapRows(t) +
          '<div class=recap-row><span>Duration</span><b class=good>' +
          fmtSec(duration) +
          '</b></div>'
        : '<div class=recap-row><span>Intervals completed</span><b class=good>' +
          rounds +
          '/' +
          planned +
          '</b></div>' +
          '<div class=recap-row><span>Avg pace</span><b>' +
          escHtml(t.targetPace || r.pace || '—') +
          '</b></div>') +
      '<div class=recap-row><span>Session RPE</span><b>' +
      escHtml(rpeLabel) +
      '</b></div></div></div>' +
      progressNote +
      (global.CondIntervalAutoreg && global.CondIntervalAutoreg.recapSliderHtml
        ? global.CondIntervalAutoreg.recapSliderHtml(t)
        : '') +
      '<div class=next-wrap><button type=button class="btn primary" onclick=completeSimpleCond()>' +
      (recovery ? 'Save recovery' : 'Save · update progression') +
      '</button></div></div>'
    );
  }

  function renderIntervalCore(t) {
    var iv = intervalIv(t);
    if (!iv) return renderSteady(t);
    if (iv.finished) return renderRecap(t, iv);
    if (iv.phase === 'rest' && !iv.finished) {
      ensureAutoreg(t).restPhase = true;
      if (global.RestOverlay && global.RestOverlay.remainingSec() <= 0) {
        global.RestOverlay.startRest(num(t.restSec) || 90, function () {
          finishRest();
        });
      }
      return renderRestPhase(t, iv);
    }
    ensureAutoreg(t).restPhase = false;
    return renderWorkPhase(t, iv);
  }

  function finishRest() {
    var t = global.current && global.current();
    if (!t) return;
    ensureAutoreg(t).restPhase = false;
    if (t.targetWatts != null) t._prevTargetWatts = num(t.targetWatts);
    if (global.RestOverlay) global.RestOverlay.stopRest();
    var iv = intervalIv(t);
    if (iv && iv.phase === 'rest' && typeof global.skipInterval === 'function') global.skipInterval();
    if (typeof global.save === 'function') global.save();
    if (typeof global.refreshCondLogOrTrain === 'function') global.refreshCondLogOrTrain();
  }

  function renderSimpleCond(t) {
    if (!t) return '';
    if (t.condRecap && isRecovery(t)) return renderRecap(t, null);
    var iv = intervalIv(t);
    if (taskNeedsInterval(t) && iv) return renderIntervalCore(t);
    return renderSteady(t);
  }

  function renderIntervalTask(t) {
    return renderIntervalCore(t);
  }

  function builderFmtNeedsInterval(fmtKey) {
    return fmtKey === 'intervals' || fmtKey === 'tempo' || fmtKey === 'custom';
  }

  function builderFormats() {
    return (
      global.COND_FORMATS || [
        { key: 'steady', name: 'Steady-state' },
        { key: 'intervals', name: 'Intervals' },
        { key: 'tempo', name: 'Tempo' },
        { key: 'free', name: 'Free run' },
        { key: 'custom', name: 'Custom' },
      ]
    );
  }

  function builderModalities() {
    return global.COND_MODALITIES || ['Run', 'Walk', 'Bike', 'Rower', 'Ski erg', 'Circuit', 'Other'];
  }

  function builderEfforts() {
    return (
      global.COND_EFFORTS || [
        { key: 'easy', name: 'Easy', zoneKey: 'recovery', cue: 'full sentences' },
        { key: 'medium', name: 'Medium', zoneKey: 'aerobic', cue: 'short sentences' },
        { key: 'hard', name: 'Hard', zoneKey: 'anaerobic', cue: 'a few words' },
      ]
    );
  }

  function builderSelectHtml(list, selected, onChangeName) {
    return list
      .map(function (item) {
        var k = item.key || item;
        var name = item.name || item;
        return (
          '<option value="' +
          escHtml(k) +
          '"' +
          (k === selected ? ' selected' : '') +
          '>' +
          escHtml(name) +
          '</option>'
        );
      })
      .join('');
  }

  function builderEffortChipsHtml(opts) {
    var recoveryPct =
      typeof global.athHomeMetrics === 'function' ? global.athHomeMetrics().recovery : 71;
    var zones =
      typeof global.athZonesForReadiness === 'function'
        ? global.athZonesForReadiness(recoveryPct)
        : [];
    return builderEfforts()
      .map(function (e) {
        var z = zones.find(function (x) {
          return x.key === e.zoneKey;
        }) || zones[0];
        var on = opts.effort === e.key;
        return (
          '<button type=button class="mph-eff ' +
          escHtml(e.key) +
          (on ? ' on' : '') +
          '" aria-pressed="' +
          (on ? 'true' : 'false') +
          '" onclick="setCondEffort(\'' +
          e.key +
          '\')">' +
          escHtml(e.name) +
          '<small>' +
          (z ? z.lo + '–' + z.hi : escHtml(e.cue || '')) +
          '</small></button>'
        );
      })
      .join('');
  }

  function builderStaticHrHtml() {
    return (
      '<div class="live-hr eng-builder-static">' +
      '<div class=hr-gauge>—</div>' +
      '<div class=hr-meta><b>Strap optional</b><span>Connect when ready</span></div></div>'
    );
  }

  /** Static rest screen preview for Engine builder (intervals only). */
  function builderRestPreviewHtml(opts) {
    opts = opts || {};
    var restSec = num(opts.restSec) || 180;
    var rounds = Math.max(1, num(opts.rounds) || 8);
    var modality = opts.modality || 'Bike';
    var effortKey = opts.effort || 'medium';
    var zt = zoneTarget({ effort: effortKey });
    var wattsDisplay =
      opts.targetWatts != null && opts.targetWatts !== '' ? Math.round(num(opts.targetWatts)) : '—';
    var upNext =
      'Up next · Interval 2/' +
      rounds +
      '<b>' +
      wattsDisplay +
      'W · —/500m · ' +
      escHtml(zt.title) +
      '</b>';
    var ring = global.RestOverlay
      ? global.RestOverlay.render({
          mode: 'engine',
          remainingSec: restSec,
          upNextHtml: upNext,
          skipLabel: 'Next interval',
          skipOnclick: 'return false',
          addOnclick: 'return false',
        })
      : '<div class="logger-rest dial-engine"><div class=rest-ring><div><div class=rest-time>' +
        fmtSec(restSec) +
        '</div><div class=rest-label>remaining</div></div></div></div>';
    return (
      '<div class="eng-builder-phase eng-builder-static">' +
      '<div class="logger-screen dial-engine">' +
      '<div class=eyebrow>Recover · between work</div>' +
      '<div class=task>' +
      escHtml(opts.name || modality) +
      '</div>' +
      '<div class=progressline>Interval 1 done</div>' +
      builderStaticHrHtml() +
      ring +
      '</div></div>'
    );
  }

  /** Static recap screen preview for Engine builder. */
  function builderRecapPreviewHtml(opts) {
    opts = opts || {};
    var recovery = !!(opts.recoverySession || opts.isRecovery);
    var rounds = Math.max(1, num(opts.rounds) || 8);
    var mins = num(opts.minutes || opts.targetDurationMin) || 20;
    var interval = builderFmtNeedsInterval(String(opts.condFmt || opts.fmt || 'steady')) && !recovery;
    var durationLabel = recovery ? fmtSec(mins * 60) + ' easy movement' : rounds + ' rounds · — total';
    var progressNote = recovery
      ? '<div class="adapt-note">Recovery logged — no load progression. Debt repay recorded.</div>'
      : '<div class="adapt-note warn"><b>Next session:</b> +1 round OR +5s work when earned.</div>';
    var recapRows = recovery
      ? '<div class=recap-row><span>Duration</span><b class=good>' +
        fmtSec(mins * 60) +
        '</b></div>'
      : '<div class=recap-row><span>Time in target zone</span><b class=good>—</b></div>' +
        '<div class=recap-row><span>Intervals completed</span><b class=good>' +
        rounds +
        '/' +
        rounds +
        '</b></div>' +
        '<div class=recap-row><span>Avg pace</span><b>—</b></div>';
    return (
      '<div class="eng-builder-phase eng-builder-static">' +
      '<div class="logger-screen dial-engine">' +
      '<div class=eyebrow>Session recap</div>' +
      '<div class=task>' +
      escHtml(opts.name || (recovery ? 'Recovery' : 'Conditioning')) +
      '</div>' +
      '<div class=progressline>' +
      escHtml(durationLabel) +
      '</div>' +
      '<div class="hero" style="text-align:left;padding:18px">' +
      '<div style="font-size:12px;color:var(--muted);margin-bottom:12px">' +
      (recovery ? 'Recovery summary' : 'Cardio completion') +
      '</div>' +
      '<div class=recap-grid>' +
      recapRows +
      '<div class=recap-row><span>Avg HR</span><b>—</b></div>' +
      '<div class=recap-row><span>Session RPE</span><b>Medium (6)</b></div></div></div>' +
      progressNote +
      '<div class="next-wrap eng-builder-static">' +
      '<button type=button class="btn primary" disabled>' +
      (recovery ? 'Save recovery' : 'Save · update progression') +
      '</button></div></div></div>'
    );
  }

  function builderFieldsHtml(opts, interval) {
    var wattsRow =
      typeof global.modalityWantsEcho === 'function' && global.modalityWantsEcho(opts.modality)
        ? '<div class=field><label for=engCondWatts>Target watts <span class=muted>(optional)</span></label>' +
          '<input id=engCondWatts type=number min=0 step=5 placeholder="180" value="' +
          escHtml(opts.targetWatts == null ? '' : opts.targetWatts) +
          '" onchange="setCondBuilderNum(\'targetWatts\',this)"></div>'
        : '';
    var intervalFields = interval
      ? '<div class="eng-builder-interval" style="grid-template-columns:1fr 1fr 1fr">' +
        '<div class=field><label for=engCondRounds>Rounds</label>' +
        '<input id=engCondRounds type=number min=1 step=1 value="' +
        escHtml(num(opts.rounds) || 1) +
        '" onchange="setCondBuilderNum(\'rounds\',this)"></div>' +
        '<div class=field><label for=engCondWork>Work</label>' +
        '<input id=engCondWork inputmode=numeric placeholder="4:00" value="' +
        escHtml(fmtSec(num(opts.workSec) || 240)) +
        '" onchange="setCondBuilderMmSs(\'workSec\',this)"></div>' +
        '<div class=field><label for=engCondRest>Rest</label>' +
        '<input id=engCondRest inputmode=numeric placeholder="3:00" value="' +
        escHtml(fmtSec(num(opts.restSec) || 180)) +
        '" onchange="setCondBuilderMmSs(\'restSec\',this)"></div></div>' +
        (typeof global.condIntervalTotalMin === 'function'
          ? '<p class=mph-hint>Total ≈ ' + global.condIntervalTotalMin() + ' min · stored as seconds.</p>'
          : '')
      : '<div class=field><label>Minutes</label><div class=mph-mins>' +
        '<button type=button class=mph-step aria-label="fewer minutes" onclick="nudgeCondMinutes(-5)">−</button>' +
        '<b aria-live=polite>' +
        escHtml(opts.minutes == null || opts.minutes === '' ? '—' : opts.minutes) +
        '</b>' +
        '<button type=button class=mph-step aria-label="more minutes" onclick="nudgeCondMinutes(5)">+</button></div></div>';
    return (
      '<div class=eng-builder-fields>' +
      '<div class="mph-twin-fields"><div class=field><label>Format</label>' +
      '<select aria-label="Format" onchange="setCondFmt(this.value)">' +
      builderSelectHtml(builderFormats(), opts.fmt || opts.condFmt, 'setCondFmt') +
      '</select></div><div class=field><label>Modality</label>' +
      '<select aria-label="Modality" onchange="setCondMod(this.value)">' +
      builderSelectHtml(
        builderModalities().map(function (m) {
          return { key: m, name: m };
        }),
        opts.modality,
        'setCondMod',
      ) +
      '</select></div></div>' +
      '<div class=field style="margin-top:8px"><label>Effort</label></div>' +
      '<div class=mph-efforts role=group aria-label="Effort">' +
      builderEffortChipsHtml(opts) +
      '</div>' +
      intervalFields +
      wattsRow +
      '</div>'
    );
  }

  /** Athlete Engine builder — full logger card with inline prescription fields. */
  function builderAthleteHtml(opts) {
    opts = opts || {};
    var recovery = !!(opts.recoverySession || opts.isRecovery);
    var fmtKey = String(opts.condFmt || opts.fmt || opts.conditioningType || 'steady');
    var interval = builderFmtNeedsInterval(fmtKey) && !recovery;
    var rounds = Math.max(1, num(opts.rounds) || 8);
    var workSec = num(opts.workSec) || 240;
    var restSec = num(opts.restSec) || 180;
    var mins = num(opts.minutes || opts.targetDurationMin) || 20;
    var modality = opts.modality || (recovery ? 'Mixed' : 'Bike');
    var effortKey = opts.effort || (recovery ? 'easy' : 'medium');
    var effort = effortMeta({ effort: effortKey });
    var plan =
      typeof global.condPlanLineFromParts === 'function'
        ? global.condPlanLineFromParts({
            modality: modality,
            effort: effortKey,
            fmt: fmtKey,
            rounds: rounds,
            workSec: workSec,
            restSec: restSec,
            minutes: mins,
          })
        : modality + ' · preview';
    var name = escHtml(opts.name || '');
    var placeholder = recovery ? 'Recovery' : 'Easy bike 20';
    var zt = zoneTarget({ effort: recovery ? 'easy' : effortKey });
    var wattsDisplay =
      opts.targetWatts != null && opts.targetWatts !== '' ? Math.round(num(opts.targetWatts)) : '—';

    if (interval) {
      return (
        '<div class="eng-builder-stack">' +
        '<div class="logger-screen dial-engine eng-builder-twin" id="builderEngineCard">' +
        '<div class=eyebrow>The Engine · builder</div>' +
        '<input class="task eng-builder-name" type="text" value="' +
        name +
        '" placeholder="' +
        escHtml(placeholder) +
        '" aria-label="Workout name" oninput="condBuilder.name=this.value">' +
        '<div class=progressline data-plan-line>' +
        escHtml(plan) +
        '</div>' +
        builderFieldsHtml(
          {
            fmt: fmtKey,
            condFmt: fmtKey,
            modality: modality,
            effort: effortKey,
            rounds: rounds,
            workSec: workSec,
            restSec: restSec,
            minutes: mins,
            targetWatts: opts.targetWatts,
          },
          true,
        ) +
        '<div class=phasechip>Interval <b>1</b> / ' +
        rounds +
        ' · work</div>' +
        '<div class="hero work">' +
        '<div class=hero-label>Work time remaining</div>' +
        '<div class="timer-big eng-builder-static">' +
        fmtSec(workSec) +
        '</div>' +
        '<div class=timer-sub>stay in target zone</div>' +
        '<div class=target-row>' +
        '<div class=target-box><b>' +
        wattsDisplay +
        '</b><span>Watts</span></div>' +
        '<div class=target-box><b>—</b><span>/500m</span></div>' +
        '<div class=target-box><b>—</b><span>' +
        escHtml(zt.title) +
        ' · HR bpm</span></div></div>' +
        builderStaticHrHtml() +
        '<div class=hero-target>Target effort: <b>RIR 2 equivalent · ' +
        escHtml(effort.name) +
        '</b></div></div>' +
        '<div class="next-wrap eng-builder-static">' +
        '<button type=button class="btn primary" disabled>End interval</button></div></div>' +
        builderRestPreviewHtml(opts) +
        builderRecapPreviewHtml(opts) +
        '</div>'
      );
    }

    return (
      '<div class="eng-builder-stack">' +
      '<div class="logger-screen dial-engine eng-builder-twin" id="builderEngineCard">' +
      '<div class=eyebrow>' +
      (recovery ? 'Conditioning · recovery' : 'Conditioning · steady-state') +
      ' · builder</div>' +
      '<input class="task eng-builder-name" type="text" value="' +
      name +
      '" placeholder="' +
      escHtml(placeholder) +
      '" aria-label="Workout name" oninput="condBuilder.name=this.value">' +
      '<div class=progressline data-plan-line>' +
      escHtml(plan) +
      '</div>' +
      builderFieldsHtml(
        {
          fmt: fmtKey,
          condFmt: fmtKey,
          modality: modality,
          effort: effortKey,
          rounds: rounds,
          workSec: workSec,
          restSec: restSec,
          minutes: mins,
          targetWatts: opts.targetWatts,
        },
        false,
      ) +
      '<div class=phasechip>' +
      (recovery ? 'Recovery' : 'Steady') +
      ' · <b>' +
      fmtSec(mins * 60) +
      '</b> left</div>' +
      '<div class="hero work">' +
      '<div class=hero-label>' +
      (recovery ? 'Recovery time remaining' : 'Session time remaining') +
      '</div>' +
      '<div class="timer-big eng-builder-static">' +
      fmtSec(mins * 60) +
      '</div>' +
      '<div class=timer-sub>' +
      (recovery ? 'easy flush · stop before fatigue' : 'conversational pace') +
      '</div>' +
      '<div class=target-row>' +
      '<div class=target-box><b>' +
      (zt.lo ? zt.lo + '–' + zt.hi : '—') +
      '</b><span>Target · HR bpm</span></div>' +
      '<div class=target-box><b>' +
      escHtml(recovery ? 'Zone 2' : zt.title) +
      '</b><span>' +
      escHtml(recovery ? 'Easy' : effort.name) +
      '</span></div>' +
      '<div class=target-box><b>' +
      (recovery ? 'RPE 2–3' : 'RPE 3–4') +
      '</b><span>Target</span></div></div>' +
      builderStaticHrHtml() +
      '</div>' +
      '<div class="next-wrap eng-builder-static">' +
      '<button type=button class="btn primary" disabled>' +
      (recovery ? 'Finish recovery' : 'Finish · rate session') +
      '</button>' +
      '<button type=button class="btn ghost" disabled>Connect strap</button></div></div>' +
      builderRecapPreviewHtml(opts) +
      '</div>'
    );
  }

  function builderTwinHtml(opts) {
    return builderAthleteHtml(opts);
  }

  global.CondSessionLogger = {
    renderSimpleCond: renderSimpleCond,
    renderIntervalTask: renderIntervalTask,
    renderSteady: renderSteady,
    renderRecap: renderRecap,
    builderTwinHtml: builderTwinHtml,
    builderAthleteHtml: builderAthleteHtml,
    builderRestPreviewHtml: builderRestPreviewHtml,
    builderRecapPreviewHtml: builderRecapPreviewHtml,
    finishRest: finishRest,
    isRecovery: isRecovery,
  };
})(typeof window !== 'undefined' ? window : globalThis);
