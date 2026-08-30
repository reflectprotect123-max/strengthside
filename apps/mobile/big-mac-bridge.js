/**
 * BIG MAC five-engine bridge — product deterministic engines (no human review).
 * Builds athlete snapshot → decide → to_athlete_facing_update → domain apply + receipts.
 */
(function (global) {
  'use strict';

  var ENDPOINT = '/.netlify/functions/big-mac-decide';
  var TIMEOUT_MS = 12000;

  function isoNow() {
    return new Date().toISOString();
  }

  function isoDate(d) {
    return new Date(d).toISOString().slice(0, 10);
  }

  function num(v) {
    var n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function athleteIdFromState(state) {
    state = state || {};
    if (state.meta && state.meta.ownerId) return String(state.meta.ownerId);
    if (state.profile && state.profile.email) return String(state.profile.email);
    return 'local-athlete';
  }

  function todayFromState(state) {
    if (typeof global.today === 'function') return global.today();
    var c = (state.dailyCheckins || []).slice(-1)[0];
    return (c && c.date) || isoDate(Date.now());
  }

  function recoveryInputFromState(state, extra) {
    extra = extra || {};
    var endDate = extra.endDate || todayFromState(state);
    var checkin = (state.dailyCheckins || []).find(function (c) { return c && c.date === endDate; });
    var recentCheckins = (state.dailyCheckins || []).filter(function (c) {
      return c && c.date <= endDate;
    }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }).slice(0, 7);
    var startMs = Date.now() - 7 * 86400000;
    var recentSessions = (state.sessions || []).filter(function (s) {
      return s && s.status === 'completed' && num(s.completedAt) >= startMs;
    });
    return {
      checkin: checkin,
      checkinComplete: !!(checkin && (num(checkin.steps) || num(checkin.energy) || checkin.illness === 'yes')),
      whoopRecovery: checkin && num(checkin.whoopRecovery),
      sessionPain: extra.sessionPain || null,
      recentCheckins: recentCheckins,
      recentSessions: recentSessions,
      allSessions: state.sessions || [],
      allCheckins: state.dailyCheckins || [],
      endDate: endDate,
    };
  }

  function buildStrengthDomain(state, session) {
    state = state || {};
    session = session || {};
    var audit = (state.meta && state.meta.progressionAudit) || [];
    var painFlags = (state.sessions || []).filter(function (s) {
      return s && s.status === 'completed' && s.sessionPain === 'yes';
    }).slice(-5).map(function (s) {
      return { sessionId: s.id, level: s.sessionPain, at: new Date(s.completedAt || Date.now()).toISOString() };
    });
    return {
      session_id: session.id || null,
      session_date: session.date || null,
      session_pain: session.sessionPain || 'none',
      progression_audit_count: audit.length,
      recent_audit: audit.slice(-5),
      pain_flags: painFlags,
    };
  }

  function buildConditioningDomain(state, task) {
    var rec = null;
    if (task && global.EngineAdapter && global.EngineAdapter.condResultFromTask) {
      rec = global.EngineAdapter.condResultFromTask(task, state);
    }
    var sessionsCompleted = 0;
    var startMs = Date.now() - 7 * 86400000;
    (state.sessions || []).forEach(function (s) {
      if (s && s.status === 'completed' && num(s.completedAt) >= startMs) {
        if ((s.tasks || []).some(function (t) { return t.kind === 'conditioning'; })) sessionsCompleted++;
      }
    });
    return {
      task_id: task && task.id,
      rec: rec,
      sessions_completed: sessionsCompleted,
      last_delta: state.meta && state.meta.lastConAdapt ? state.meta.lastConAdapt.delta : null,
    };
  }

  function buildRecoveryDomain(state, extra) {
    extra = extra || {};
    var input = recoveryInputFromState(state, extra);
    var posture = global.RecoveryEngine && global.RecoveryEngine.recoveryPosture
      ? global.RecoveryEngine.recoveryPosture(input)
      : null;
    return {
      end_date: input.endDate,
      illness: !!(input.checkin && input.checkin.illness === 'yes'),
      input: input,
      posture: posture,
    };
  }

  function buildNutritionDomain(state, extra) {
    extra = extra || {};
    var endDate = extra.endDate || todayFromState(state);
    var days = num(extra.days) || 7;
    var windowDates = [];
    var end = Date.parse(String(endDate) + 'T12:00:00');
    for (var i = 0; i < days; i++) windowDates.push(isoDate(end - i * 86400000));

    var daysLogged = 0;
    var lowEnergyFlag = false;
    windowDates.forEach(function (date) {
      var c = (state.dailyCheckins || []).find(function (x) { return x && x.date === date; });
      if (c && String(c.fuel || 'okay') === 'poor') lowEnergyFlag = true;
    });

    var offTarget = false;
    var targetInfo = {};
    if (global.NutritionUI && typeof global.NutritionUI.load === 'function') {
      try {
        var db = global.NutritionUI.load();
        var entries = (db && db.logEntries) || [];
        var dates = {};
        entries.forEach(function (e) {
          if (e && !e.deletedAt && e.date && windowDates.indexOf(e.date) >= 0) dates[e.date] = true;
        });
        daysLogged = Object.keys(dates).length;
        if (global.NutritionUI.Core || (global.NutritionCore)) {
          var C = global.NutritionCore || (global.NutritionUI.Core && global.NutritionUI.Core());
          if (C && C.targetForDay && db.program) {
            var target = C.targetForDay(db.program, endDate);
            var totals = C.dayTotals ? C.dayTotals(entries.filter(function (e) {
              return e && !e.deletedAt && e.date === endDate;
            })) : null;
            if (target && totals && target.calories > 0) {
              targetInfo = { calories: target.calories, eaten: totals.calories };
              offTarget = totals.calories > 0 && (totals.calories < target.calories * 0.7 || totals.calories > target.calories * 1.3);
            }
          }
        }
      } catch (_) {}
    }

    return {
      end_date: endDate,
      days_in_window: days,
      days_logged: daysLogged,
      low_energy_flag: lowEnergyFlag,
      off_target: offTarget,
      targets: targetInfo,
      log_date: extra.logDate || endDate,
    };
  }

  function buildCoordinatorDomain(state, extra) {
    extra = extra || {};
    return {
      end_date: extra.endDate || todayFromState(state),
      days: num(extra.days) || 7,
    };
  }

  function buildSnapshot(state, context) {
    context = context || {};
    state = state || {};
    return {
      athlete_id: athleteIdFromState(state),
      as_of: isoNow(),
      product_engines: context.product_engines !== false,
      trigger_domain: context.trigger_domain || null,
      app_state: {
        sessions: state.sessions,
        dailyCheckins: state.dailyCheckins,
        strengthState: state.strengthState,
        settings: state.settings,
        meta: state.meta,
        profile: state.profile,
      },
      strength_domain: buildStrengthDomain(state, context.session),
      conditioning_domain: buildConditioningDomain(state, context.task),
      recovery_domain: buildRecoveryDomain(state, context),
      nutrition_domain: buildNutritionDomain(state, context),
      coordinator_domain: buildCoordinatorDomain(state, context),
    };
  }

  function recordReceipt(state, receipt, athleteFacing, triggerDomain) {
    state.meta = state.meta || {};
    state.meta.bigMacReceipts = state.meta.bigMacReceipts || [];
    state.meta.bigMacReceipts.push({
      at: isoNow(),
      trigger: triggerDomain || null,
      action: receipt.action,
      reason_codes: receipt.reason_codes || [],
      decision_mode: receipt.decision_mode || null,
      has_update: athleteFacing.has_update,
      athlete_action: athleteFacing.action,
    });
    if (state.meta.bigMacReceipts.length > 50) {
      state.meta.bigMacReceipts = state.meta.bigMacReceipts.slice(-50);
    }
    state.meta.bigMacLastAt = isoNow();
    return state;
  }

  function mapBigMacActionToStrength(action) {
    if (action === 'proceed' || action === 'modify') return 'progress';
    if (action === 'trim') return 'deload';
    if (action === 'maintain' || action === 'hold' || action === 'record_only') return 'hold';
    return null;
  }

  function applyStrengthDomain(state, session, athleteFacing, receipt, opts) {
    if (!opts.apply || !athleteFacing.has_update) return { applied: false, reason: 'no_update' };
    var mapped = mapBigMacActionToStrength(athleteFacing.action);
    if (!mapped || !global.StrengthAdapter || !global.StrengthAdapter.applySilentProgression) {
      return { applied: false, reason: 'no_strength_adapter' };
    }
    var recoveryInput = typeof global.recoveryInputForPosture === 'function'
      ? global.recoveryInputForPosture({ sessionPain: session.sessionPain || 'none' })
      : recoveryInputFromState(state, { sessionPain: session.sessionPain || 'none' });
    state.meta = state.meta || {};
    state.meta.bigMacPendingAction = {
      action: mapped,
      source: 'big_mac',
      big_mac_action: athleteFacing.action,
      at: isoNow(),
    };
    var result = global.StrengthAdapter.applySilentProgression(state, session, {
      quiet: true,
      recoveryInput: recoveryInput,
      bigMacOverride: mapped,
    });
    delete state.meta.bigMacPendingAction;
    return { applied: true, mapped: mapped, result: result };
  }

  function applyConditioningDomain(state, athleteFacing, receipt, opts) {
    if (!opts.apply) return { applied: false, reason: 'apply_disabled' };
    state.meta = state.meta || {};
    if (athleteFacing.action === 'trim' || athleteFacing.action === 'hold') {
      state.meta.condPrescriptionEase = {
        effort: 'easy',
        at: isoNow(),
        reason: 'big_mac_' + athleteFacing.action,
        source: 'big_mac',
      };
      return { applied: true, ease: true };
    }
    return { applied: false, reason: 'no_conditioning_meta_change' };
  }

  function applyRecoveryDomain(state, athleteFacing, receipt, opts) {
    if (!opts.apply) return { applied: false, reason: 'apply_disabled' };
    state.meta = state.meta || {};
    state.meta.bigMacRecoveryGate = {
      action: athleteFacing.action,
      at: isoNow(),
      reason_codes: receipt.reason_codes || [],
    };
    return { applied: true };
  }

  function applyNutritionDomain(state, athleteFacing, receipt, opts) {
    if (!opts.apply) return { applied: false, reason: 'apply_disabled' };
    state.meta = state.meta || {};
    state.meta.bigMacNutritionNote = {
      action: athleteFacing.action,
      at: isoNow(),
      reason_codes: receipt.reason_codes || [],
    };
    return { applied: true };
  }

  function applyCoordinatorDomain(state, endDate, days, athleteFacing, receipt, opts) {
    if (!global.CoordinatorAdapter) return { applied: false, reason: 'no_coordinator' };
    if (opts.apply !== false) {
      state = global.CoordinatorAdapter.bootstrapSilent(state, endDate, days);
    }
    state.meta = state.meta || {};
    state.meta.bigMacCoordinatorAt = isoNow();
    state.meta.bigMacCoordinatorAction = athleteFacing.action;
    return { applied: true, state: state };
  }

  function applyDomain(state, context, payload, opts) {
    var domain = context.trigger_domain;
    var athleteFacing = payload.athlete_facing;
    var receipt = payload.receipt;
    var applyResult = null;

    if (domain === 'strength' && context.session) {
      applyResult = applyStrengthDomain(state, context.session, athleteFacing, receipt, opts);
    } else if (domain === 'conditioning') {
      applyResult = applyConditioningDomain(state, athleteFacing, receipt, opts);
    } else if (domain === 'recovery') {
      applyResult = applyRecoveryDomain(state, athleteFacing, receipt, opts);
    } else if (domain === 'nutrition') {
      applyResult = applyNutritionDomain(state, athleteFacing, receipt, opts);
    } else if (domain === 'coordinator') {
      applyResult = applyCoordinatorDomain(state, context.endDate, context.days, athleteFacing, receipt, opts);
      if (applyResult.state) state = applyResult.state;
    }

    recordReceipt(state, receipt, athleteFacing, domain);
    return { state: state, apply: applyResult };
  }

  function fetchWithTimeout(url, options, ms) {
    if (typeof AbortController === 'undefined') {
      return fetch(url, options);
    }
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, ms);
    return fetch(url, Object.assign({}, options, { signal: ctrl.signal }))
      .finally(function () { clearTimeout(timer); });
  }

  function decideLocal(snapshot) {
    if (!global.BigMacDecideShim || !global.BigMacContract) {
      throw new Error('big_mac_shim_missing');
    }
    var receipt = global.BigMacDecideShim.decideShim(snapshot);
    var athleteFacing = global.BigMacContract.toAthleteFacingUpdate(receipt);
    return { receipt: receipt, athlete_facing: athleteFacing, source: 'local_shim' };
  }

  function decideRemote(snapshot) {
    return fetchWithTimeout(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ snapshot: snapshot }),
    }, TIMEOUT_MS).then(function (res) {
      if (!res.ok) throw new Error('big_mac_http_' + res.status);
      return res.json();
    }).then(function (body) {
      if (!body || !body.receipt || !body.athlete_facing) throw new Error('big_mac_invalid_response');
      return body;
    });
  }

  function decide(state, context, opts) {
    opts = opts || {};
    context = context || {};
    var snapshot = buildSnapshot(state, context);
    var run = opts.localOnly ? Promise.resolve(decideLocal(snapshot)) : decideRemote(snapshot).catch(function () {
      return decideLocal(snapshot);
    });
    return run.then(function (payload) {
      var applied = null;
      if (opts.apply !== false && context.trigger_domain) {
        applied = applyDomain(state, context, payload, opts);
        if (applied.state) state = applied.state;
      } else {
        recordReceipt(state, payload.receipt, payload.athlete_facing, context.trigger_domain);
      }
      return {
        snapshot: snapshot,
        receipt: payload.receipt,
        athlete_facing: payload.athlete_facing,
        source: payload.source || 'remote',
        apply: applied,
        state: state,
      };
    });
  }

  function afterStrengthSessionSync(state, session, opts) {
    if (!state || !session) return { skipped: 'no_session' };
    opts = Object.assign({ apply: true }, opts || {});
    try {
      var snapshot = buildSnapshot(state, {
        trigger_domain: 'strength',
        session: session,
        product_engines: true,
      });
      var payload = decideLocal(snapshot);
      applyDomain(state, { trigger_domain: 'strength', session: session }, payload, opts);
      return { ok: true, receipt: payload.receipt, athlete_facing: payload.athlete_facing };
    } catch (err) {
      if (opts.apply !== false && global.StrengthAdapter && global.StrengthAdapter.applySilentProgression) {
        global.StrengthAdapter.applySilentProgression(state, session, {
          recoveryInput: recoveryInputFromState(state, { sessionPain: session.sessionPain || 'none' }),
        });
      }
      return { skipped: 'error', message: String(err && err.message || err) };
    }
  }

  function afterStrengthSession(state, session, opts) {
    if (!state || !session) return Promise.resolve({ skipped: 'no_session' });
    return Promise.resolve(afterStrengthSessionSync(state, session, opts));
  }

  function afterConditioningSessionSync(state, task, opts) {
    if (!state) return { skipped: 'no_state' };
    opts = Object.assign({ apply: true }, opts || {});
    try {
      var snapshot = buildSnapshot(state, {
        trigger_domain: 'conditioning',
        task: task,
        product_engines: true,
      });
      var payload = decideLocal(snapshot);
      applyDomain(state, { trigger_domain: 'conditioning', task: task }, payload, opts);
      return { ok: true, receipt: payload.receipt };
    } catch (err) {
      return { skipped: 'error', message: String(err && err.message || err) };
    }
  }

  function afterConditioningSession(state, task, opts) {
    if (!state) return Promise.resolve({ skipped: 'no_state' });
    return Promise.resolve(afterConditioningSessionSync(state, task, opts));
  }

  function afterCheckin(state, opts) {
    if (!state) return Promise.resolve({ skipped: 'no_state' });
    return decide(state, {
      trigger_domain: 'recovery',
      endDate: todayFromState(state),
      product_engines: true,
    }, Object.assign({ localOnly: true, apply: true }, opts)).catch(function (err) {
      return { skipped: 'error', message: String(err && err.message || err) };
    });
  }

  function afterNutritionLog(state, logDate, opts) {
    if (!state) return Promise.resolve({ skipped: 'no_state' });
    return decide(state, {
      trigger_domain: 'nutrition',
      logDate: logDate || todayFromState(state),
      endDate: logDate || todayFromState(state),
      product_engines: true,
    }, Object.assign({ localOnly: true, apply: false }, opts)).catch(function (err) {
      return { skipped: 'error', message: String(err && err.message || err) };
    });
  }

  function bootstrapCoordinator(state, endDate, days, opts) {
    if (!state) return state;
    opts = opts || {};
    var result = decide(state, {
      trigger_domain: 'coordinator',
      endDate: endDate || todayFromState(state),
      days: days || 7,
      product_engines: true,
    }, Object.assign({ localOnly: true, apply: true }, opts));
    if (result && typeof result.then === 'function') {
      return result.then(function (payload) {
        return payload.state || state;
      }).catch(function () {
        if (global.CoordinatorAdapter && global.CoordinatorAdapter.bootstrapSilent) {
          return global.CoordinatorAdapter.bootstrapSilent(state, endDate, days);
        }
        return state;
      });
    }
    return state;
  }

  function bootstrapCoordinatorSync(state, endDate, days) {
    if (!state) return state;
    endDate = endDate || todayFromState(state);
    days = days || 7;
    try {
      var snapshot = buildSnapshot(state, {
        trigger_domain: 'coordinator',
        endDate: endDate,
        days: days,
        product_engines: true,
      });
      var payload = decideLocal(snapshot);
      var applied = applyDomain(state, {
        trigger_domain: 'coordinator',
        endDate: endDate,
        days: days,
      }, payload, { apply: true });
      return applied.state || state;
    } catch (_) {
      if (global.CoordinatorAdapter && global.CoordinatorAdapter.bootstrapSilent) {
        return global.CoordinatorAdapter.bootstrapSilent(state, endDate, days);
      }
      return state;
    }
  }

  global.BigMacBridge = {
    ENDPOINT: ENDPOINT,
    buildSnapshot: buildSnapshot,
    buildStrengthSnapshot: function (state, session) {
      return buildSnapshot(state, { session: session, trigger_domain: 'strength' });
    },
    decide: decide,
    decideLocal: decideLocal,
    decideStrengthSlice: function (state, session, opts) {
      return decide(state, { trigger_domain: 'strength', session: session, product_engines: true }, opts);
    },
    afterStrengthSession: afterStrengthSession,
    afterStrengthSessionSync: afterStrengthSessionSync,
    afterConditioningSession: afterConditioningSession,
    afterConditioningSessionSync: afterConditioningSessionSync,
    afterCheckin: afterCheckin,
    afterNutritionLog: afterNutritionLog,
    bootstrapCoordinator: bootstrapCoordinatorSync,
    toAthleteFacingUpdate: global.BigMacContract && global.BigMacContract.toAthleteFacingUpdate,
    recordReceipt: recordReceipt,
    applyStrengthDomain: applyStrengthDomain,
  };
})(typeof window !== 'undefined' ? window : globalThis);
