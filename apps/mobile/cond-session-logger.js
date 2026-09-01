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
    if (typeof global.fmt === 'function') return global.fmt(totalSec);
    var n = Math.max(0, Math.floor(Number(totalSec) || 0));
    var m = Math.floor(n / 60);
    var s = n % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
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
    return { name: 'Medium', zoneKey: 'aerobic' };
  }

  function isRecovery(t) {
    return !!(t && (t.recoverySession || String(t.category || '').toLowerCase() === 'recovery'));
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
    return effort.name || 'Zone';
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

  function handoffHtml() {
    if (!global.SessionFlow || !global.SessionFlow.nextNodePreviewHtml) return '';
    return global.SessionFlow.nextNodePreviewHtml() || '';
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
      '<div class=target-box><b>' +
      escHtml(zoneLabel(t)) +
      '</b><span>effort</span></div></div>' +
      '<div class=live-hr><div class=hr-gauge>' +
      (hr != null ? Math.round(hr) : '—') +
      '</div><div class=hr-meta><b>' +
      (global.bleHr && global.bleHr.status === 'live' ? 'On target' : 'Strap optional') +
      '</b>' +
      (global.bleHr && global.bleHr.status === 'live' ? 'Strap live' : 'Connect when ready') +
      '</div></div>' +
      '<div class=hero-target>Target effort: <b>' +
      escHtml(effortMeta(t).name) +
      '</b></div></div>' +
      adaptNoteHtml(t) +
      handoffHtml() +
      '<div class=next-wrap>' +
      primary +
      '<button type=button class="btn ghost" onclick=skipInterval()>Skip phase</button>' +
      '<button type=button class="btn ghost" onclick=leaveSimpleCond()>← Back</button></div></div>'
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
      'Up next · Work ' +
      nextRound +
      '/' +
      rounds +
      '<b>' +
      (t.targetWatts != null ? t.targetWatts + 'W' : '—') +
      ' · ' +
      escHtml(zoneLabel(t)) +
      ' ' +
      deltaBadgeHtml(t) +
      '</b>';
    var ring = global.RestOverlay
      ? global.RestOverlay.render({
          mode: 'engine',
          remainingSec: remaining,
          upNextHtml: upNext,
          skipLabel: 'Skip · start work ' + nextRound,
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
      '<div class=target-box><b>' +
      (liveHr() != null ? Math.round(liveHr()) : '—') +
      '</b><span>HR bpm</span></div>' +
      '<div class=target-box><b>' +
      escHtml(recovery ? 'Easy' : effort.name) +
      '</b><span>Zone</span></div>' +
      '<div class=target-box><b>' +
      (recovery ? 'RPE 2–3' : 'RPE 3–4') +
      '</b><span>Target</span></div></div>' +
      '<div class=live-hr><div class=hr-gauge>' +
      (liveHr() != null ? Math.round(liveHr()) : '—') +
      '</div><div class=hr-meta><b>' +
      (recovery ? 'Keep it easy' : 'In zone') +
      '</b>Strap optional</div></div></div>' +
      '<div class="mph-twin-fields" style="margin-top:12px"><div class=field><label>Minutes</label><input id=condMin type=number min=0 step=.5 value="' +
      escHtml(r.duration ? Math.round((num(r.duration) / 60) * 10) / 10 : t.targetDurationMin || '') +
      '"></div><div class=field><label>Avg HR</label><input id=condHr type=number min=30 max=250 value="' +
      escHtml(r.avgHr || '') +
      '" oninput="setSimpleCondHr(this.value)"></div></div>' +
      handoffHtml() +
      '<div class=next-wrap>' +
      '<button type=button class="btn primary" onclick=completeSimpleCond()>' +
      finishLabel +
      '</button>' +
      '<button type=button class="btn ghost" onclick=connectSimpleCondHr()>Connect strap</button>' +
      '<button type=button class="btn ghost" onclick=leaveSimpleCond()>← Back</button></div></div>'
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
      : '<div class="adapt-note warn"><b>Next session:</b> engine will adjust rounds or work time when earned.</div>';
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
      '<div class=recap-row><span>Avg HR</span><b>' +
      escHtml(r.avgHr || liveHr() || '—') +
      '</b></div>' +
      (recovery
        ? '<div class=recap-row><span>Duration</span><b class=good>' + fmtSec(duration) + '</b></div>'
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
      '<div class=next-wrap><button type=button class="btn primary" onclick=completeSimpleCond()>Save · update progression</button></div></div>'
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
    var iv = intervalIv(t);
    if (taskNeedsInterval(t) && iv) return renderIntervalCore(t);
    return renderSteady(t);
  }

  function renderIntervalTask(t) {
    return renderIntervalCore(t);
  }

  /** Static builder preview twin — mirrors work / steady / recovery logger chrome. */
  function builderTwinHtml(opts) {
    opts = opts || {};
    var recovery = !!(opts.recoverySession || opts.isRecovery);
    var fmt = String(opts.condFmt || opts.fmt || opts.conditioningType || 'steady');
    var interval = fmt === 'intervals' || fmt === 'tempo' || fmt === 'custom';
    var rounds = num(opts.rounds) || 8;
    var workSec = num(opts.workSec) || 240;
    var restSec = num(opts.restSec) || 180;
    var mins = num(opts.minutes || opts.targetDurationMin) || 20;
    var modality = opts.modality || (recovery ? 'Mixed' : 'Bike');
    var heading = opts.heading || (recovery ? 'Recovery' : modality);
    var plan =
      typeof global.condPlanLineFromParts === 'function'
        ? global.condPlanLineFromParts({
            modality: modality,
            effort: opts.effort || (recovery ? 'easy' : 'medium'),
            fmt: fmt,
            rounds: rounds,
            workSec: workSec,
            restSec: restSec,
            minutes: mins,
          })
        : modality + ' · preview';
    var watts = opts.targetWatts != null && opts.targetWatts !== '' ? Math.round(num(opts.targetWatts)) : '—';
    if (interval && !recovery) {
      return (
        '<div class="logger-screen dial-engine" id="builderEngineCard" style="min-height:0;margin-top:14px;padding:16px;border:1px solid var(--line);border-radius:20px;background:var(--panel)">' +
        '<div class=eyebrow>Athlete logger preview</div>' +
        '<div class=task>' +
        escHtml(heading) +
        '</div>' +
        '<div class=progressline>' +
        escHtml(plan) +
        '</div>' +
        '<div class=phasechip>Interval <b>1</b> / ' +
        rounds +
        ' · work</div>' +
        '<div class="hero work">' +
        '<div class=hero-label>Work time remaining</div>' +
        '<div class=timer-big>' +
        fmtSec(workSec) +
        '</div>' +
        '<div class=timer-sub>stay in target zone</div>' +
        '<div class=target-row>' +
        '<div class=target-box><b>' +
        watts +
        '</b><span>Watts</span></div>' +
        '<div class=target-box><b>—</b><span>/500m</span></div>' +
        '<div class=target-box><b>' +
        escHtml(zoneLabel({ effort: opts.effort || 'medium' })) +
        '</b><span>effort</span></div></div></div>' +
        '<div class=next-wrap><button type=button class="btn primary" disabled>End interval</button></div></div>'
      );
    }
    return (
      '<div class="logger-screen dial-engine" id="builderEngineCard" style="min-height:0;margin-top:14px;padding:16px;border:1px solid var(--line);border-radius:20px;background:var(--panel)">' +
      '<div class=eyebrow>Athlete logger preview</div>' +
      '<div class=task>' +
      escHtml(heading) +
      '</div>' +
      '<div class=progressline>' +
      escHtml(plan) +
      '</div>' +
      '<div class=phasechip>' +
      (recovery ? 'Recovery' : 'Steady') +
      ' · <b>' +
      fmtSec(mins * 60) +
      '</b> left</div>' +
      '<div class="hero work">' +
      '<div class=hero-label>' +
      (recovery ? 'Recovery time remaining' : 'Session time remaining') +
      '</div>' +
      '<div class=timer-big>' +
      fmtSec(mins * 60) +
      '</div>' +
      '<div class=timer-sub>' +
      (recovery ? 'easy flush · stop before fatigue' : 'conversational pace') +
      '</div>' +
      '<div class=target-row>' +
      '<div class=target-box><b>—</b><span>HR bpm</span></div>' +
      '<div class=target-box><b>' +
      (recovery ? 'Easy' : escHtml(zoneLabel({ effort: opts.effort || 'easy' }))) +
      '</b><span>Zone</span></div>' +
      '<div class=target-box><b>' +
      (recovery ? 'RPE 2–3' : 'RPE 3–4') +
      '</b><span>Target</span></div></div></div>' +
      '<div class=next-wrap><button type=button class="btn primary" disabled>' +
      (recovery ? 'Finish recovery' : 'Finish · rate session') +
      '</button></div></div>'
    );
  }

  global.CondSessionLogger = {
    renderSimpleCond: renderSimpleCond,
    renderIntervalTask: renderIntervalTask,
    renderSteady: renderSteady,
    renderRecap: renderRecap,
    builderTwinHtml: builderTwinHtml,
    finishRest: finishRest,
    isRecovery: isRecovery,
  };
})(typeof window !== 'undefined' ? window : globalThis);
