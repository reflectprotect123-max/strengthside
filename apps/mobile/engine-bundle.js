var HybridEngine = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // engine-entry.ts
  var engine_entry_exports = {};
  __export(engine_entry_exports, {
    Concept2: () => concept2_exports,
    Conditioning: () => conditioning_exports,
    Constants: () => Constants,
    DecideInitialCondPrescription: () => decideInitialCondPrescription_exports,
    DecideNextPhase: () => decideNextPhase_exports,
    Hr: () => hr_exports
  });

  // ../../../../packages/engine/src/hr.ts
  var hr_exports = {};
  __export(hr_exports, {
    conDownsample: () => conDownsample,
    conHrr: () => conHrr,
    conMaxHr: () => conMaxHr,
    conZoneOf: () => conZoneOf,
    conZones: () => conZones,
    hrMaxBandSeconds: () => hrMaxBandSeconds,
    recoveryBand: () => recoveryBand,
    restingHr: () => restingHr,
    todayHrv: () => todayHrv,
    todayRecovery: () => todayRecovery,
    todaySleepPerformance: () => todaySleepPerformance,
    todayStrain: () => todayStrain,
    zoneKeyOf: () => zoneKeyOf,
    zoneSeconds: () => zoneSeconds
  });

  // ../../../../packages/engine/src/constants.ts
  var MODES = {
    reps_kg: { label: "Reps + Kilos", unit: "", ph: "reps" },
    amrap: { label: "Max reps", unit: "", ph: "max" },
    seconds: { label: "Seconds", unit: "s", ph: "secs" },
    reps_seconds: { label: "Reps + Seconds", unit: "s", ph: "secs" },
    reps: { label: "Reps only", unit: "", ph: "reps" },
    completion: { label: "For completion", unit: "", ph: "" }
  };
  var MODE_KEYS = Object.keys(MODES);
  var RECOVERY_BANDS = { good: 67, watch: 34 };
  var REZONE_PROVISIONAL = {
    lowOnRed: 0.03,
    modOnRed: -0.05,
    lowOnGreen: -0.03,
    modOnGreen: 0.04
  };
  var CON_EFFORTS = {
    easy: { key: "easy", name: "Easy", zone: "low", rpe: [3, 4], center: 3.5, cue: "full sentences" },
    medium: { key: "medium", name: "Medium", zone: "mod", rpe: [5, 7], center: 6, cue: "short sentences" },
    hard: { key: "hard", name: "Hard", zone: "high", rpe: [8, 9.5], center: 8.5, cue: "a few words at a time" }
  };
  var CON_EFFORT_KEYS = ["easy", "medium", "hard"];
  var ZONE_TO_EFFORT = { low: "easy", mod: "medium", high: "hard" };
  var ZONE_NAMES = {
    low: "Recovery",
    mod: "Conditioning",
    high: "Overload"
  };
  var HRR_WINDOW_SEC = 60;
  var HRR_TOLERANCE_SEC = 6;
  var CON_MAX_POINTS = 2700;
  var CON_RETENTION = 200;
  var CON_TRACE_KEEP = 12;
  var PROGRESSED_FORMATS = ["steady", "intervals", "tempo"];

  // ../../../../packages/engine/src/hr.ts
  function conMaxHr(profile) {
    const p = profile || {};
    const age = parseInt(String(p.age ?? ""), 10) || 30;
    const manual = parseInt(String(p.maxHr ?? ""), 10) || 0;
    if (manual > 0) return manual;
    const est = Math.round(208 - 0.7 * age);
    const obs = parseInt(String(p.obsMaxHr ?? ""), 10) || 0;
    return Math.max(est, obs);
  }
  function restingHr(profile, whoop) {
    const p = profile || {};
    const manual = parseInt(String(p.restingHr ?? ""), 10) || 0;
    if (manual > 0) return manual;
    const w = whoop ? parseInt(String(whoop.restingHr ?? ""), 10) || 0 : 0;
    return w > 0 ? w : null;
  }
  function recoveryBand(v) {
    if (v == null || v === "") return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    const r = Math.max(0, Math.min(100, Math.round(n)));
    return r >= RECOVERY_BANDS.good ? "good" : r >= RECOVERY_BANDS.watch ? "watch" : "low";
  }
  function todayRecovery(whoop) {
    const n = whoop ? Number(whoop.recoveryScore) : NaN;
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  function todayStrain(whoop) {
    const n = whoop ? Number(whoop.strain) : NaN;
    return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
  }
  function todayHrv(whoop) {
    const n = whoop ? Number(whoop.hrvMs) : NaN;
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  function todaySleepPerformance(whoop) {
    const n = whoop ? Number(whoop.sleepPerformance) : NaN;
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  function conZones(ctx = {}) {
    const m = conMaxHr(ctx.profile);
    const rest = restingHr(ctx.profile, ctx.whoop);
    const rec = todayRecovery(ctx.whoop);
    const band = recoveryBand(rec);
    let dLow = 0;
    let dMod = 0;
    if (band === "low") {
      dLow = REZONE_PROVISIONAL.lowOnRed;
      dMod = REZONE_PROVISIONAL.modOnRed;
    } else if (band === "good") {
      dLow = REZONE_PROVISIONAL.lowOnGreen;
      dMod = REZONE_PROVISIONAL.modOnGreen;
    }
    let floor;
    let lowTop;
    let modTop;
    let method;
    if (rest && rest > 0 && rest < m - 20) {
      const R = m - rest;
      method = "hrr";
      floor = Math.round(rest + R * 0.3);
      lowTop = Math.round(rest + R * (0.6 + dLow));
      modTop = Math.round(rest + R * (0.85 + dMod));
    } else {
      method = "pctmax";
      floor = Math.round(m * 0.5);
      lowTop = Math.round(m * (0.7 + dLow));
      modTop = Math.round(m * (0.88 + dMod));
    }
    lowTop = Math.max(floor + 4, Math.min(lowTop, m - 6));
    modTop = Math.max(lowTop + 4, Math.min(modTop, m - 2));
    const list = [
      { key: "low", name: ZONE_NAMES.low, lo: floor, hi: lowTop },
      { key: "mod", name: ZONE_NAMES.mod, lo: lowTop, hi: modTop },
      { key: "high", name: ZONE_NAMES.high, lo: modTop, hi: m }
    ];
    return { floor, max: m, rest: rest || null, rec, adj: dMod, method, list };
  }
  function conZoneOf(bpm, z) {
    return bpm < z.list[0].hi ? z.list[0] : bpm < z.list[1].hi ? z.list[1] : z.list[2];
  }
  function zoneKeyOf(bpm, z) {
    return conZoneOf(bpm, z).key;
  }
  function conHrr(ds) {
    const pts = ds && ds.pts || [];
    const every = ds && ds.every || 2;
    let peakI = -1;
    pts.forEach((b, i) => {
      if (b != null && (peakI < 0 || b > pts[peakI])) peakI = i;
    });
    if (peakI < 0) return { hrr: null, win: null };
    const want = peakI + Math.round(HRR_WINDOW_SEC / every);
    const tol = Math.max(1, Math.round(HRR_TOLERANCE_SEC / every));
    let bestI = -1;
    for (let d = 0; d <= tol; d++) {
      if (want - d > peakI && pts[want - d] != null) {
        bestI = want - d;
        break;
      }
      if (want + d < pts.length && pts[want + d] != null) {
        bestI = want + d;
        break;
      }
    }
    if (bestI < 0) return { hrr: null, win: null };
    return { hrr: Math.max(0, pts[peakI] - pts[bestI]), win: (bestI - peakI) * every };
  }
  function conDownsample(samples, dur) {
    const every = Math.max(2, Math.ceil(Math.max(0, dur) / (CON_MAX_POINTS - 1)));
    const n = Math.max(1, Math.min(Math.ceil(dur / every) + 1, CON_MAX_POINTS));
    const sum = new Array(n).fill(0);
    const cnt = new Array(n).fill(0);
    samples.forEach((s) => {
      const i = Math.max(0, Math.min(n - 1, Math.floor(s.t / every)));
      sum[i] += s.bpm;
      cnt[i] += 1;
    });
    return { every, pts: sum.map((v, i) => cnt[i] ? Math.round(v / cnt[i]) : null) };
  }
  function zoneSeconds(ds, z) {
    const out = { low: 0, mod: 0, high: 0 };
    ds.pts.forEach((b) => {
      if (b == null) return;
      out[zoneKeyOf(b, z)] += ds.every;
    });
    return out;
  }
  function hrMaxBandSeconds(ds, maxHr) {
    const out = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 };
    if (!ds || !Array.isArray(ds.pts) || !Number.isFinite(maxHr) || maxHr <= 0) return out;
    ds.pts.forEach((b) => {
      if (b == null || !Number.isFinite(b)) return;
      const pct = b / maxHr * 100;
      if (pct < 50) return;
      const band = pct < 60 ? "z1" : pct < 70 ? "z2" : pct < 80 ? "z3" : pct < 90 ? "z4" : "z5";
      out[band] += ds.every;
    });
    return out;
  }

  // ../../../../packages/engine/src/conditioning.ts
  var conditioning_exports = {};
  __export(conditioning_exports, {
    CON_FORMATS: () => CON_FORMATS,
    CON_FORMAT_KEYS: () => CON_FORMAT_KEYS,
    cardioCompletionFor: () => cardioCompletionFor,
    conAdapt: () => conAdapt,
    conPrescription: () => conPrescription,
    conProgLevel: () => conProgLevel,
    condEffort: () => condEffort,
    condEffortGap: () => condEffortGap,
    condEffortRpe: () => condEffortRpe,
    customFmtBase: () => customFmtBase,
    effortForFelt: () => effortForFelt,
    isProgressedFmt: () => isProgressedFmt,
    painHoldFor: () => painHoldFor,
    paramsFor: () => paramsFor,
    progressionKey: () => progressionKey,
    pushCondHistory: () => pushCondHistory,
    withFeltZones: () => withFeltZones
  });

  // ../../../../packages/engine/src/num.ts
  function fmtRpe(v) {
    return String(Math.round(v * 10) / 10);
  }

  // ../../../../packages/engine/src/session.ts
  function isCond(b) {
    return !!b && b.kind === "conditioning";
  }

  // ../../../../packages/engine/src/balance.ts
  function condEfforts(sessions, settings = {}) {
    const inline = (sessions || []).flatMap(
      (s) => (s.blocks || []).filter(isCond).map((b) => b.condResult).filter(Boolean)
    );
    const standalone = Array.isArray(settings.conditioning) ? settings.conditioning : [];
    return [...standalone, ...inline].sort((a, b) => (a.startedAt || 0) - (b.startedAt || 0));
  }

  // ../../../../packages/engine/src/conditioning.ts
  var roundsFormat = (p) => {
    const s = [{ name: "Warm-up", dur: 180, kind: "warm" }];
    const rounds = p.rounds ?? 8;
    for (let i = 1; i <= rounds; i++) {
      s.push({ name: "Work " + i, dur: p.work ?? 30, kind: "work", round: i });
      s.push({ name: "Recover", dur: p.rest ?? 90, kind: "rest", round: i });
    }
    s.push({ name: "Cool-down", dur: 120, kind: "cool" });
    return s;
  };
  var CON_FORMATS = {
    steady: {
      key: "steady",
      name: "Steady-state",
      desc: "Zone 2 \xB7 20 min",
      base: { minutes: 20 },
      build(p) {
        const q = p || this.base || {};
        return [
          { name: "Warm-up", dur: 120, kind: "warm" },
          { name: "Zone 2", dur: (q.minutes || 20) * 60, kind: "work2" },
          { name: "Cool-down", dur: 120, kind: "cool" }
        ];
      }
    },
    intervals: {
      key: "intervals",
      name: "Intervals",
      desc: "8\xD730s / 90s",
      base: { rounds: 8, work: 30, rest: 90 },
      build(p) {
        return roundsFormat(p || this.base || {});
      }
    },
    tempo: {
      key: "tempo",
      name: "Tempo",
      desc: "10\xD715s / 60s",
      base: { rounds: 10, work: 15, rest: 60 },
      build(p) {
        return roundsFormat(p || this.base || {});
      }
    },
    custom: {
      key: "custom",
      name: "Custom",
      desc: "your rounds",
      build(p) {
        return roundsFormat(p || { rounds: 6, work: 40, rest: 80 });
      }
    },
    free: {
      key: "free",
      name: "Free run",
      desc: "just track HR",
      build() {
        return [{ name: "Free run", dur: 8 * 3600, kind: "work2" }];
      }
    }
  };
  var CON_FORMAT_KEYS = Object.keys(CON_FORMATS);
  function isProgressedFmt(k) {
    return PROGRESSED_FORMATS.includes(k);
  }
  function progressionKey(fmtKey, modality) {
    return modality ? fmtKey + ":" + modality : fmtKey;
  }
  var NOT_HELD = { held: false, reasonCode: null, note: "" };
  function painHoldFor(fmtKey, sessions, settings, modality) {
    const key = progressionKey(fmtKey, modality);
    const bucket = condEfforts(sessions, settings).filter(
      (r) => r && !r.sim && progressionKey(r.fmt || "free", r.modality) === key
    );
    const last = bucket[bucket.length - 1];
    if (!last || last.mechanicalCompletion !== "pain_stop") return NOT_HELD;
    const since = last.startedAt || 0;
    const ackAt = (settings.conditioningAck || {})[key] || 0;
    if (ackAt >= since) return NOT_HELD;
    return {
      held: true,
      reasonCode: "pain_stop_pending_ack",
      note: "Your last session in this format ended early for reported pain. Confirm you\u2019re ready to continue before starting another.",
      since
    };
  }
  function customFmtBase(settings) {
    const c = settings && settings.customFmt || {};
    return {
      rounds: Math.max(1, Math.min(30, parseInt(String(c.rounds ?? ""), 10) || 6)),
      work: Math.max(10, Math.min(600, parseInt(String(c.work ?? ""), 10) || 40)),
      rest: Math.max(0, Math.min(600, parseInt(String(c.rest ?? ""), 10) || 80))
    };
  }
  function conProgLevel(fmtKey, settings, modality) {
    const cp = settings && settings.conProgress || {};
    const f = cp[progressionKey(fmtKey, modality)];
    return f && Number.isFinite(f.level) ? Math.max(0, f.level | 0) : 0;
  }
  function condEffort(b) {
    const e = b && b.effort;
    if (e && Object.prototype.hasOwnProperty.call(CON_EFFORTS, e)) return CON_EFFORTS[e];
    const zone = b && b.targetZone;
    if (zone && Object.prototype.hasOwnProperty.call(ZONE_TO_EFFORT, zone)) return CON_EFFORTS[ZONE_TO_EFFORT[zone]];
    return CON_EFFORTS.medium;
  }
  function effortForFelt(felt) {
    const n = typeof felt === "number" ? felt : parseFloat(String(felt ?? ""));
    if (!Number.isFinite(n)) return null;
    if (n <= CON_EFFORTS.easy.rpe[1]) return "easy";
    if (n >= CON_EFFORTS.hard.rpe[0]) return "hard";
    return "medium";
  }
  function withFeltZones(rec) {
    const z = rec.zsec || { low: 0, mod: 0, high: 0 };
    if ((z.low || 0) + (z.mod || 0) + (z.high || 0) > 0) return rec;
    const effort = effortForFelt(rec.felt);
    const dur = Math.max(0, Math.round(rec.dur || 0));
    if (!effort || dur <= 0) return rec;
    return {
      ...rec,
      zsec: { low: 0, mod: 0, high: 0, [CON_EFFORTS[effort].zone]: dur },
      zsrc: "felt"
    };
  }
  function condEffortGap(e, felt) {
    const f = parseFloat(String(felt));
    if (!e || !Number.isFinite(f)) return null;
    if (f > e.rpe[1]) return f - e.rpe[1];
    if (f < e.rpe[0]) return f - e.rpe[0];
    return 0;
  }
  function condEffortRpe(e) {
    return fmtRpe(e.rpe[0]) + "-" + fmtRpe(e.rpe[1]);
  }
  function conPrescription(fmtKey, ctx = {}) {
    const { settings, whoop, ignoreDaily } = ctx;
    const rec = todayRecovery(whoop);
    if (fmtKey === "free") return { level: 0, dailyAdj: 0, rec, note: "open-ended" };
    const fmt = CON_FORMATS[fmtKey] || CON_FORMATS.intervals;
    const base = fmtKey === "custom" ? customFmtBase(settings) : fmt.base || {};
    const level = isProgressedFmt(fmtKey) ? conProgLevel(fmtKey, settings, ctx.modality) : 0;
    const p = { level: 0, dailyAdj: 0, rec, note: "" };
    if (fmtKey === "custom") {
      p.rounds = base.rounds;
      p.work = base.work;
      p.rest = base.rest;
      let dailyAdj2 = 0;
      if (rec != null && !ignoreDaily && recoveryBand(rec) === "low") {
        dailyAdj2 = -1;
        if ((p.rounds ?? 0) > 3) p.rounds = (p.rounds ?? 0) - 1;
        else p.rest = (p.rest ?? 0) + 10;
      }
      p.level = 0;
      p.dailyAdj = dailyAdj2;
      p.note = dailyAdj2 < 0 ? "eased today" + (rec != null ? " for " + rec + "% recovery" : "") : "your format";
      return p;
    }
    if (fmtKey === "steady") {
      p.minutes = Math.min(40, (base.minutes || 20) + 2 * level);
    } else {
      let rounds = base.rounds ?? 8;
      let work = base.work ?? 30;
      let rest = base.rest ?? 90;
      for (let i = 0; i < level; i++) {
        const m = i % 3;
        if (m === 0) rounds = Math.min(12, rounds + 1);
        else if (m === 1) work = Math.min((base.work ?? 30) * 2, work + 5);
        else rest = Math.max(Math.round((base.rest ?? 90) * 0.6), rest - 5);
      }
      p.rounds = rounds;
      p.work = work;
      p.rest = rest;
    }
    let dailyAdj = 0;
    if (rec != null && !ignoreDaily && recoveryBand(rec) === "low") {
      dailyAdj = -1;
      if (fmtKey === "steady") p.minutes = Math.max(10, (p.minutes ?? 20) - 5);
      else if ((p.rounds ?? 0) > 3) p.rounds = (p.rounds ?? 0) - 1;
      else p.rest = (p.rest ?? 0) + 10;
    }
    p.level = level;
    p.dailyAdj = dailyAdj;
    let note = "";
    if (level > 0) note = "Level " + level;
    if (dailyAdj < 0) note = (note ? note + " \xB7 " : "") + "eased today" + (rec != null ? " for " + rec + "% recovery" : "");
    p.note = note;
    return p;
  }
  function paramsFor(fmtKey, p) {
    if (fmtKey === "steady") return { minutes: p.minutes };
    if (fmtKey === "free") return {};
    return { rounds: p.rounds, work: p.work, rest: p.rest };
  }
  function cardioCompletionFor(fmtKey, zsec, dur) {
    const z = zsec || { low: 0, mod: 0, high: 0 };
    const total = Math.max(1, (z.low || 0) + (z.mod || 0) + (z.high || 0) || dur || 0);
    const workSec = fmtKey === "steady" ? (z.low || 0) + (z.mod || 0) : (z.mod || 0) + (z.high || 0);
    const frac = workSec / total;
    const target = fmtKey === "steady" ? 0.6 : 0.45;
    if (frac >= target) return "met";
    if (frac >= target * 0.7) return "borderline";
    return "not_met";
  }
  function conAdapt(rec, settings = {}) {
    const cp = Object.assign({}, settings.conProgress);
    const none = { delta: 0, conProgress: cp };
    if (!rec || rec.sim) return none;
    const fmtKey = rec.fmt;
    if (!fmtKey || !CON_FORMATS[fmtKey] || !isProgressedFmt(fmtKey)) return none;
    const z = rec.zsec || { low: 0, mod: 0, high: 0 };
    const zoned = (z.low || 0) + (z.mod || 0) + (z.high || 0);
    if (zoned <= 0) return none;
    const total = Math.max(1, zoned || rec.dur || 0);
    const workSec = fmtKey === "steady" ? (z.low || 0) + (z.mod || 0) : (z.mod || 0) + (z.high || 0);
    const frac = fmtKey === "steady" ? 0.6 : 0.45;
    const zoneOnTarget = workSec / total >= frac;
    let onTarget = zoneOnTarget;
    if (fmtKey !== "steady" && rec.felt != null) {
      const eff = condEffort(rec);
      const gap = condEffortGap(eff, rec.felt);
      onTarget = gap != null ? gap >= 0 : zoneOnTarget;
    }
    const overcooked = (z.high || 0) / total > 0.6;
    const hrrOk = true;
    const sessionRec = Number.isFinite(rec.rec) ? rec.rec : null;
    const notRed = sessionRec == null || recoveryBand(sessionRec) !== "low";
    const progKey = progressionKey(fmtKey, rec.modality);
    const cur = cp[progKey] || { level: 0, miss: 0 };
    let level = cur.level | 0;
    let miss = cur.miss | 0;
    let delta = 0;
    if (onTarget && hrrOk && !overcooked && notRed) {
      level = Math.min(20, level + 1);
      miss = 0;
      delta = 1;
    } else {
      miss += 1;
      if (miss >= 2) {
        level = Math.max(0, level - 1);
        miss = 0;
        delta = -1;
      }
    }
    cp[progKey] = { level, miss };
    return { delta, conProgress: cp };
  }
  function pushCondHistory(settings, rec) {
    const list = Array.isArray(settings.conditioning) ? settings.conditioning.slice() : [];
    list.push(rec);
    list.sort((a, b) => (a.startedAt || 0) - (b.startedAt || 0));
    return list.slice(-CON_RETENTION);
  }

  // ../../../../packages/engine/src/concept2.ts
  var concept2_exports = {};
  __export(concept2_exports, {
    CONCEPT2_MATCH_WINDOW_MS: () => CONCEPT2_MATCH_WINDOW_MS,
    applyConcept2Import: () => applyConcept2Import,
    concept2ImportSummary: () => concept2ImportSummary,
    concept2RecordId: () => concept2RecordId,
    concept2ToCondResult: () => concept2ToCondResult,
    importedConcept2Ids: () => importedConcept2Ids,
    matchConcept2Result: () => matchConcept2Result,
    planConcept2Import: () => planConcept2Import
  });
  var CONCEPT2_MATCH_WINDOW_MS = 2 * 60 * 60 * 1e3;
  var CONCEPT2_TYPE_TO_MODALITY = {
    rower: "row",
    skierg: "ski",
    bike: "bike"
  };
  function matchConcept2Result(result, sessions, windowMs = CONCEPT2_MATCH_WINDOW_MS) {
    if (!result.startedAt) return null;
    const resultTime = Date.parse(result.startedAt);
    if (!Number.isFinite(resultTime)) return null;
    const modality = result.modality ? CONCEPT2_TYPE_TO_MODALITY[result.modality] : void 0;
    if (!modality) return null;
    let best = null;
    let bestDiff = Infinity;
    for (const session of sessions) {
      for (const block of session.blocks) {
        if (block.kind !== "conditioning") continue;
        if (block.modality !== modality) continue;
        const refTime = block.condResult?.startedAt ?? session.startedAt;
        if (refTime == null || !Number.isFinite(refTime)) continue;
        const diff = Math.abs(refTime - resultTime);
        if (diff <= windowMs && diff < bestDiff) {
          bestDiff = diff;
          best = { session, block };
        }
      }
    }
    return best;
  }
  var CONCEPT2_TYPE_TO_MODEL = {
    rower: "RowErg",
    skierg: "SkiErg",
    bike: "BikeErg"
  };
  function splitsOf(result) {
    const w = result.workout;
    const splits = w && Array.isArray(w.splits) ? w.splits : void 0;
    return splits && splits.length ? splits : void 0;
  }
  function concept2ToCondResult(result) {
    const out = {
      device: {
        manufacturer: "Concept2",
        model: result.modality ? CONCEPT2_TYPE_TO_MODEL[result.modality] : void 0,
        consoleMetric: "pace"
      }
    };
    const modality = result.modality ? CONCEPT2_TYPE_TO_MODALITY[result.modality] : void 0;
    if (modality) out.modality = modality;
    const splits = splitsOf(result);
    if (splits) out.splits = splits;
    if (result.startedAt) {
      const t = Date.parse(result.startedAt);
      if (Number.isFinite(t)) out.startedAt = t;
    }
    if (result.durationRaw != null) out.dur = result.durationRaw / 10;
    if (result.distanceRaw != null) out.deviceDistanceM = result.distanceRaw;
    return out;
  }
  function concept2RecordId(externalId) {
    return "c2-" + externalId;
  }
  function importedConcept2Ids(db) {
    const ids = /* @__PURE__ */ new Set();
    const conditioning = db.settings?.conditioning;
    if (Array.isArray(conditioning)) {
      for (const r of conditioning) if (r?.externalId) ids.add(r.externalId);
    }
    for (const s of db.sessions || []) {
      for (const b of s.blocks || []) {
        if (b.kind === "conditioning" && b.condResult?.externalId) ids.add(b.condResult.externalId);
      }
    }
    return ids;
  }
  function planConcept2Import(results, db, windowMs = CONCEPT2_MATCH_WINDOW_MS) {
    const seen = importedConcept2Ids(db);
    const claimed = /* @__PURE__ */ new Set();
    const plan = { merges: [], standalone: [], skipped: 0 };
    for (const result of results || []) {
      const externalId = result?.externalId;
      if (!externalId || seen.has(externalId)) {
        plan.skipped += 1;
        continue;
      }
      seen.add(externalId);
      const converted = concept2ToCondResult(result);
      if (converted.startedAt == null || converted.modality == null) {
        plan.skipped += 1;
        continue;
      }
      const match = matchConcept2Result(result, db.sessions || [], windowMs);
      const block = match && !claimed.has(match.session.id + "\0" + match.block.id) ? match.block : null;
      if (match && block && !block.condResult) {
        claimed.add(match.session.id + "\0" + match.block.id);
        plan.merges.push({
          sessionId: match.session.id,
          blockId: block.id,
          mode: "attach",
          patch: {
            ...converted,
            id: concept2RecordId(externalId),
            externalId,
            // The block's own prescription, so the attached result reads like
            // one logged in-app rather than format-less.
            fmt: block.condFmt
          }
        });
        continue;
      }
      if (match && block && block.condResult && !block.condResult.externalId) {
        claimed.add(match.session.id + "\0" + match.block.id);
        const existing = block.condResult;
        const patch = { externalId };
        if (existing.splits == null && converted.splits != null) patch.splits = converted.splits;
        if (existing.deviceDistanceM == null && converted.deviceDistanceM != null)
          patch.deviceDistanceM = converted.deviceDistanceM;
        if (existing.device == null && converted.device != null) patch.device = converted.device;
        plan.merges.push({ sessionId: match.session.id, blockId: block.id, mode: "enrich", patch });
        continue;
      }
      plan.standalone.push({
        ...converted,
        id: concept2RecordId(externalId),
        externalId,
        // No in-app prescription existed for this effort, and 'free' is exactly
        // that format.
        fmt: "free"
      });
    }
    return plan;
  }
  function concept2ImportSummary(c) {
    const total = c.attached + c.enriched + c.standalone;
    if (!total) return "Nothing new to add \u2014 everything synced is already in your history.";
    const parts = [];
    if (c.attached) parts.push(`${c.attached} matched to a session`);
    if (c.enriched) parts.push(`${c.enriched} added detail to a logged session`);
    if (c.standalone) parts.push(`${c.standalone} filed on ${c.standalone === 1 ? "its" : "their"} own`);
    return `Added ${total} \u2014 ${parts.join(", ")}.`;
  }
  function applyConcept2Import(db, plan, now = Date.now()) {
    const counts = { attached: 0, enriched: 0, standalone: 0 };
    for (const m of plan.merges) {
      const session = (db.sessions || []).find((s) => s.id === m.sessionId);
      const block = session?.blocks.find((b) => b.id === m.blockId);
      if (!session || !block || block.kind !== "conditioning") continue;
      if (m.mode === "attach") {
        if (block.condResult) continue;
        block.condResult = m.patch;
        counts.attached += 1;
      } else {
        if (!block.condResult || block.condResult.externalId) continue;
        Object.assign(block.condResult, m.patch);
        counts.enriched += 1;
      }
      session.updatedAt = now;
    }
    for (const rec of plan.standalone) {
      db.settings.conditioning = pushCondHistory(db.settings, rec);
      counts.standalone += 1;
    }
    if (counts.standalone) db.settings.updatedAt = now;
    return counts;
  }

  // ../../../../packages/engine/src/decideNextPhase.ts
  var decideNextPhase_exports = {};
  __export(decideNextPhase_exports, {
    IN_SESSION_CONDITIONING: () => IN_SESSION_CONDITIONING,
    decideNextPhase: () => decideNextPhase,
    isIntrasessionAutoregFormat: () => isIntrasessionAutoregFormat
  });
  var IN_SESSION_CONDITIONING = {
    wattsPushPct: 0.03,
    wattsEaseMetPct: 0.05,
    wattsEaseMissPct: 0.08,
    hrCeilBumpBpm: 2,
    hrCeilTrimBpm: 4,
    workDurationCutPct: 0.1,
    minWatts: 40,
    maxWatts: 600,
    minHrBpm: 90,
    maxHrBpm: 195
  };
  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }
  function roundWatts(w) {
    return Math.round(w / 5) * 5;
  }
  function isIntrasessionAutoregFormat(fmtKey) {
    return fmtKey !== "steady" && fmtKey !== "free";
  }
  function decideNextPhase(input) {
    const c = IN_SESSION_CONDITIONING;
    if (!isIntrasessionAutoregFormat(input.formatKey)) {
      return { action: "noop", reasonCodes: ["steady_or_free_no_intrsession"] };
    }
    if (input.incomplete) {
      const reasons2 = ["incomplete_stop"];
      let nextRounds = input.roundsRemaining;
      let nextWorkDurationSec = input.workDurationSec;
      if (nextRounds != null && nextRounds > 1) {
        nextRounds -= 1;
        reasons2.push("rounds_minus_one");
      } else if (nextWorkDurationSec != null) {
        nextWorkDurationSec = Math.round(nextWorkDurationSec * (1 - c.workDurationCutPct));
        reasons2.push("work_duration_cut");
      }
      return {
        action: "decrease",
        reasonCodes: reasons2,
        nextTargetWatts: input.targetWatts,
        nextTargetHrCeilingBpm: input.targetHrCeilingBpm,
        nextRounds,
        nextWorkDurationSec
      };
    }
    const gap = condEffortGap(input.effort, input.felt);
    if (gap == null) {
      return {
        action: "hold",
        reasonCodes: ["missing_felt_or_effort"],
        nextTargetWatts: input.targetWatts,
        nextTargetHrCeilingBpm: input.targetHrCeilingBpm
      };
    }
    if (gap === 0) {
      return {
        action: "hold",
        reasonCodes: ["on_target_hold"],
        nextTargetWatts: input.targetWatts,
        nextTargetHrCeilingBpm: input.targetHrCeilingBpm
      };
    }
    if (gap < 0) {
      const reasons2 = ["felt_easier_than_prescribed"];
      let nextWatts2 = input.targetWatts;
      let nextHr2 = input.targetHrCeilingBpm;
      if (nextWatts2 != null) {
        nextWatts2 = clamp(roundWatts(nextWatts2 * (1 + c.wattsPushPct)), c.minWatts, c.maxWatts);
        reasons2.push("watts_push");
      } else if (nextHr2 != null) {
        nextHr2 = clamp(nextHr2 + c.hrCeilBumpBpm, c.minHrBpm, c.maxHrBpm);
        reasons2.push("hr_ceiling_bump");
      }
      return {
        action: "increase",
        reasonCodes: reasons2,
        nextTargetWatts: nextWatts2,
        nextTargetHrCeilingBpm: nextHr2
      };
    }
    const reasons = ["felt_harder_than_prescribed"];
    const zoneMiss = input.zoneCompliance === "not_met";
    const cutPct = zoneMiss ? c.wattsEaseMissPct : c.wattsEaseMetPct;
    let nextWatts = input.targetWatts;
    let nextHr = input.targetHrCeilingBpm;
    if (nextWatts != null) {
      nextWatts = clamp(roundWatts(nextWatts * (1 - cutPct)), c.minWatts, c.maxWatts);
      reasons.push(zoneMiss ? "watts_ease_miss" : "watts_ease_met");
    }
    if (nextHr != null && (zoneMiss || nextWatts == null)) {
      nextHr = clamp(nextHr - c.hrCeilTrimBpm, c.minHrBpm, c.maxHrBpm);
      reasons.push("hr_ceiling_trim");
    }
    return {
      action: "decrease",
      reasonCodes: reasons,
      nextTargetWatts: nextWatts,
      nextTargetHrCeilingBpm: nextHr
    };
  }

  // ../../../../packages/engine/src/decideInitialCondPrescription.ts
  var decideInitialCondPrescription_exports = {};
  __export(decideInitialCondPrescription_exports, {
    decideInitialCondPrescription: () => decideInitialCondPrescription
  });
  function coachNumPinned(v) {
    return v != null && Number.isFinite(Number(v)) && Number(v) > 0;
  }
  function coachMinPinned(v) {
    return v != null && Number.isFinite(Number(v)) && Number(v) >= 0;
  }
  function isIntervalFormat(fmtKey) {
    return fmtKey === "intervals" || fmtKey === "tempo" || fmtKey === "custom";
  }
  function decideInitialCondPrescription(input) {
    const reasons = [];
    const fmtKey = input.formatKey || "steady";
    const interval = isIntervalFormat(fmtKey);
    const pinnedRounds = coachNumPinned(input.coachRounds);
    const pinnedWork = coachMinPinned(input.coachWorkSec) && Number(input.coachWorkSec) > 0;
    const pinnedRest = coachMinPinned(input.coachRestSec);
    const pinnedMinutes = coachMinPinned(input.coachMinutes) && Number(input.coachMinutes) > 0;
    const allIntervalPinned = interval && pinnedRounds && pinnedWork && pinnedRest;
    const allSteadyPinned = fmtKey === "steady" && pinnedMinutes;
    const allFreePinned = fmtKey === "free";
    if (allIntervalPinned || allSteadyPinned || allFreePinned) {
      const rounds2 = pinnedRounds ? Math.max(1, Math.round(Number(input.coachRounds))) : 1;
      const workSec2 = pinnedWork ? Math.max(0, Math.round(Number(input.coachWorkSec))) : 0;
      const restSec2 = pinnedRest ? Math.max(0, Math.round(Number(input.coachRestSec))) : 0;
      const minutes2 = pinnedMinutes ? Math.max(1, Math.round(Number(input.coachMinutes))) : interval ? Math.max(1, Math.round(rounds2 * (workSec2 + restSec2) / 60)) : 20;
      return {
        rounds: rounds2,
        workSec: workSec2,
        restSec: restSec2,
        minutes: minutes2,
        targetDurationMin: minutes2,
        autopilotCond: false,
        condRxLevel: 0,
        condRxDailyAdj: 0,
        condRxNote: "",
        reasonCodes: ["coach_pinned_volume"]
      };
    }
    reasons.push("autopilot_cond");
    const rx = conPrescription(fmtKey, {
      whoop: input.whoop ?? null,
      settings: input.settings,
      modality: input.modality
    });
    let rounds = Math.max(1, Math.round(Number(rx.rounds) || 8));
    let workSec = Math.max(0, Math.round(Number(rx.work) || 30));
    let restSec = Math.max(0, Math.round(Number(rx.rest) || 90));
    let minutes = Math.max(1, Math.round(Number(rx.minutes) || 20));
    if (rx.level > 0) reasons.push("progression_level_" + rx.level);
    if (rx.dailyAdj < 0) reasons.push("daily_recovery_ease");
    if (input.lastSession) {
      if (interval && input.lastSession.rounds != null && input.lastSession.rounds > 0) {
        rounds = Math.max(1, Math.min(12, Math.round(input.lastSession.rounds)));
        reasons.push("history_last_session");
      }
      if (interval && input.lastSession.workSec != null && input.lastSession.workSec > 0) {
        workSec = Math.max(0, Math.round(input.lastSession.workSec));
      }
      if (!interval && input.lastSession.minutes != null && input.lastSession.minutes > 0) {
        minutes = Math.max(10, Math.min(60, Math.round(input.lastSession.minutes)));
        reasons.push("history_last_session");
      }
    }
    if (input.recoveryGate === "hold") {
      if (interval && rounds > 3) {
        rounds -= 1;
        reasons.push("recovery_hold_reduce_rounds");
      } else if (fmtKey === "steady") {
        minutes = Math.max(10, minutes - 5);
        reasons.push("recovery_hold_reduce_minutes");
      }
    } else if (input.recoveryGate === "caution") {
      if (interval && rounds > 4) {
        rounds -= 1;
        reasons.push("recovery_caution_reduce_rounds");
      }
    }
    if (pinnedRounds) {
      rounds = Math.max(1, Math.min(12, Math.round(Number(input.coachRounds))));
      reasons.push("coach_pinned_rounds");
    }
    if (pinnedWork) {
      workSec = Math.max(0, Math.round(Number(input.coachWorkSec)));
      reasons.push("coach_pinned_work");
    }
    if (pinnedRest) {
      restSec = Math.max(0, Math.round(Number(input.coachRestSec)));
      reasons.push("coach_pinned_rest");
    }
    if (pinnedMinutes) {
      minutes = Math.max(1, Math.round(Number(input.coachMinutes)));
      reasons.push("coach_pinned_minutes");
    }
    if (interval) {
      minutes = Math.max(1, Math.round(rounds * (workSec + restSec) / 60));
    }
    return {
      rounds,
      workSec,
      restSec,
      minutes,
      targetDurationMin: minutes,
      autopilotCond: true,
      condRxLevel: rx.level || 0,
      condRxDailyAdj: rx.dailyAdj || 0,
      condRxNote: rx.note || "",
      reasonCodes: reasons
    };
  }

  // engine-entry.ts
  var Constants = {
    RECOVERY_BANDS,
    REZONE_PROVISIONAL,
    CON_EFFORTS,
    CON_EFFORT_KEYS,
    ZONE_TO_EFFORT,
    ZONE_NAMES,
    HRR_WINDOW_SEC,
    HRR_TOLERANCE_SEC,
    CON_MAX_POINTS,
    CON_RETENTION,
    CON_TRACE_KEEP,
    PROGRESSED_FORMATS
  };
  return __toCommonJS(engine_entry_exports);
})();
