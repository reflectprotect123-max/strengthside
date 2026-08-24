/**
 * Collect domain receipts and render weekly Coordinator sheet.
 * Depends on HybridStrength.Coordinator, RecoveryEngine, EngineAdapter, NutritionUI.
 */
(function (global) {
  'use strict';

  function num(v) {
    var n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function isoDate(d) {
    return new Date(d).toISOString().slice(0, 10);
  }

  function weekStart(endDate) {
    var end = Date.parse(String(endDate) + 'T12:00:00');
    var start = end - 6 * 86400000;
    return isoDate(start);
  }

  function daysInWindow(endDate, days) {
    var out = [];
    var end = Date.parse(String(endDate) + 'T12:00:00');
    for (var i = 0; i < days; i++) out.push(isoDate(end - i * 86400000));
    return out;
  }

  function checkinComplete(c) {
    if (!c) return false;
    var fuelChanged = String(c.fuel || 'okay') !== 'okay';
    return !!(num(c.steps) || num(c.workDifficulty) || num(c.workStress) || num(c.sleepQuality) ||
      num(c.energy) || num(c.muscleSoreness) || num(c.jointStress) || num(c.mentalStress) ||
      fuelChanged || num(c.whoopRecovery) || num(c.restingHr) || num(c.hrv) || num(c.bodyweight) ||
      num(c.sleepHours) || num(c.heatLoad) || String(c.notes || '').trim());
  }

  function collectReceipts(state, endDate, days) {
    state = state || {};
    days = days || 7;
    endDate = endDate || isoDate(Date.now());
    var windowDates = daysInWindow(endDate, days);
    var startMs = Date.parse(windowDates[windowDates.length - 1] + 'T00:00:00');
    var endMs = Date.parse(endDate + 'T23:59:59');

    var audit = (state.meta && state.meta.progressionAudit) || [];
    var auditWindow = audit.filter(function (e) {
      var t = Date.parse(e.at);
      return t >= startMs && t <= endMs;
    });

    var sessions = (state.sessions || []).filter(function (s) {
      return s && s.status === 'completed' && num(s.completedAt) >= startMs && num(s.completedAt) <= endMs;
    });

    var painFlags = sessions.filter(function (s) { return s.sessionPain === 'yes'; }).map(function (s) {
      return { sessionId: s.id, level: s.sessionPain, at: new Date(s.completedAt).toISOString() };
    });

    var weeklyZone = { recovery: 0, aerobic: 0, anaerobic: 0, peak: 0 };
    if (global.EngineAdapter && global.EngineAdapter.weeklyZoneSeconds) {
      weeklyZone = global.EngineAdapter.weeklyZoneSeconds(state.sessions || [], endDate, days);
    }

    var condSessions = sessions.filter(function (s) {
      return (s.tasks || []).some(function (t) { return t.kind === 'conditioning'; });
    }).length;

    var recovery = windowDates.map(function (date) {
      var c = (state.dailyCheckins || []).find(function (x) { return x.date === date; });
      var complete = checkinComplete(c);
      var painSession = sessions.find(function (s) { return s.date === date && s.sessionPain; });
      var recentCheckins = (state.dailyCheckins || []).filter(function (x) {
        return x && x.date <= date;
      }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }).slice(0, 7);
      var input = {
        checkin: c,
        checkinComplete: complete,
        whoopRecovery: c && num(c.whoopRecovery),
        sessionPain: painSession && painSession.sessionPain,
        recentCheckins: recentCheckins,
        recentSessions: sessions,
        allSessions: state.sessions || [],
        allCheckins: state.dailyCheckins || [],
        endDate: date,
      };
      var posture = global.RecoveryEngine && global.RecoveryEngine.recoveryPosture
        ? global.RecoveryEngine.recoveryPosture(input)
        : { band: complete ? 'build' : 'insufficient_data', gate: complete ? 'ok' : 'hold' };
      return { date: date, band: posture.band, gate: posture.gate };
    });

    var nutritionDays = 0;
    if (global.NutritionUI && typeof global.NutritionUI.load === 'function') {
      try {
        var db = global.NutritionUI.load();
        var entries = (db && db.logEntries) || [];
        var dates = {};
        entries.forEach(function (e) {
          if (e && !e.deletedAt && e.date && windowDates.indexOf(e.date) >= 0) dates[e.date] = true;
        });
        nutritionDays = Object.keys(dates).length;
      } catch (_) {}
    }

    return {
      strength: { progressionAudit: auditWindow, sessionPainFlags: painFlags },
      conditioning: { weeklyZoneSeconds: weeklyZone, sessionsCompleted: condSessions },
      recovery: recovery,
      nutrition: { daysLogged: nutritionDays, daysInWindow: days },
    };
  }

  function planWeek(state, endDate, days) {
    if (!global.HybridStrength || !global.HybridStrength.Coordinator || !global.HybridStrength.Coordinator.planCoordinator) {
      return null;
    }
    var receipts = collectReceipts(state, endDate, days);
    return global.HybridStrength.Coordinator.planCoordinator(receipts, {
      weekStart: weekStart(endDate || isoDate(Date.now())),
      generatedAt: new Date().toISOString(),
    });
  }

  function weeklySheetHtml(receipt) {
    if (!receipt) return '<p class=lead>Coordinator unavailable — strength bundle missing.</p>';
    var items = (receipt.items || []).map(function (it) {
      return '<div class=card><div class=eyebrow>' + esc(it.domain) + ' · ' + esc(it.kind) + '</div><div class=meta>' + esc(it.message) + '</div></div>';
    }).join('');
    return '<p class=lead>' + esc(receipt.headline) + '</p><div class=stack>' + items + '</div>' +
      '<button class="btn block" style="margin-top:14px" onclick="closeSheet()">Done</button>';
  }

  function applySilentReceipt(state, receipt) {
    if (!state || !receipt) return state;
    state.meta = state.meta || {};
    var applied = [];
    var now = receipt.generatedAt || new Date().toISOString();
    (receipt.items || []).forEach(function (it) {
      if (!it.silentApply) return;
      if (it.domain === 'conditioning' && it.kind === 'ease') {
        state.meta.condPrescriptionEase = { effort: 'easy', at: now, reason: it.message };
        applied.push({ domain: it.domain, kind: it.kind, at: now });
      } else if (it.domain === 'strength' || it.domain === 'recovery') {
        applied.push({ domain: it.domain, kind: it.kind, message: it.message, at: now });
      }
    });
    if (applied.length) state.meta.coordinatorApplied = applied;
    state.meta.coordinatorLastReceipt = {
      weekStart: receipt.weekStart,
      generatedAt: now,
      headline: receipt.headline,
    };
    return state;
  }

  function bootstrapSilent(state, endDate, days) {
    var receipt = planWeek(state, endDate, days);
    if (!receipt) return state;
    return applySilentReceipt(state, receipt);
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  global.CoordinatorAdapter = {
    collectReceipts: collectReceipts,
    planWeek: planWeek,
    weeklySheetHtml: weeklySheetHtml,
    applySilentReceipt: applySilentReceipt,
    bootstrapSilent: bootstrapSilent,
  };
})(typeof window !== 'undefined' ? window : globalThis);
