"use strict";
var HybridAdaptive = (() => {
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

  // packages/adaptive/src/index.ts
  var index_exports = {};
  __export(index_exports, {
    BAND_SPLIT_OFFSET_INTERVALS: () => BAND_SPLIT_OFFSET_INTERVALS,
    BAND_SPLIT_OFFSET_STEADY: () => BAND_SPLIT_OFFSET_STEADY,
    BAND_SPLIT_OFFSET_TEMPO: () => BAND_SPLIT_OFFSET_TEMPO,
    BAND_SPLIT_OFFSET_THRESHOLD: () => BAND_SPLIT_OFFSET_THRESHOLD,
    BAND_WATTS_RATIO_EASY: () => BAND_WATTS_RATIO_EASY,
    CONCEPT2_WATTS_FACTOR: () => CONCEPT2_WATTS_FACTOR,
    closeCond: () => closeCond,
    decideNextCond: () => decideNextCond,
    mapBandFrom2k: () => mapBandFrom2k,
    openCond: () => openCond,
    softenOpen: () => softenOpen,
    splitSecFrom2k: () => splitSecFrom2k,
    wattsFromSplitSec: () => wattsFromSplitSec
  });

  // packages/adaptive/src/decide-next-cond.ts
  function condBand(actual, target, stopped, cooked) {
    if (stopped || actual >= 10) return "cut";
    if (cooked) return "down";
    if (actual < target.min) return "up";
    if (actual > target.max) return "down";
    return "hold";
  }
  function baseline(actual, current) {
    if (actual != null && Number.isFinite(actual)) return actual;
    if (current != null && Number.isFinite(current)) return current;
    return void 0;
  }
  function nextWatts(w, band) {
    if (band === "hold") return { ok: true, watts: w };
    if (band === "up") return { ok: true, watts: Math.round(w * 1.03) };
    if (band === "down") return { ok: true, watts: Math.round(w * 0.95) };
    return { ok: true, watts: Math.round(w * 0.92) };
  }
  function nextSplit(s, band) {
    if (band === "hold") return { ok: true, splitSec: s };
    if (band === "up") return { ok: true, splitSec: s - 1 };
    if (band === "down") return { ok: true, splitSec: s + 1 };
    return { ok: true, splitSec: s + 3 };
  }
  function nextRpm(r, band) {
    if (band === "hold") return { ok: true, rpm: r };
    if (band === "up") return { ok: true, rpm: Math.round(r * 1.03) };
    if (band === "down") return { ok: true, rpm: Math.round(r * 0.95) };
    return { ok: true, rpm: Math.round(r * 0.92) };
  }
  function decideNextCond(input) {
    if (input.dayKind !== "conditioning") return { ok: false, reason: "wrong_day" };
    const band = condBand(input.actualRpe, input.targetRpe, input.stopped, input.cooked);
    if (input.modality === "split") {
      const split = baseline(input.actualSplitSec, input.currentSplitSec);
      if (split == null) return { ok: true, skipped: true };
      return nextSplit(split, band);
    }
    if (input.modality === "rpm") {
      const rpm = baseline(input.actualRpm, input.currentRpm);
      if (rpm == null) return { ok: true, skipped: true };
      return nextRpm(rpm, band);
    }
    const watts = baseline(input.actualWatts, input.currentWatts);
    if (watts == null) return { ok: true, skipped: true };
    return nextWatts(watts, band);
  }

  // packages/adaptive/src/open-cond.ts
  function pick(typed, closed) {
    if (typed != null && Number.isFinite(typed)) return typed;
    if (closed != null && Number.isFinite(closed)) return closed;
    return null;
  }
  function openCond(input) {
    if (input.dayKind !== "conditioning") return { ok: false, reason: "wrong_day" };
    if (input.modality === "split") {
      return {
        ok: true,
        splitSec: pick(input.typedSplitSec, input.lastClose?.splitSec)
      };
    }
    if (input.modality === "rpm") {
      return {
        ok: true,
        rpm: pick(input.typedRpm, input.lastClose?.rpm)
      };
    }
    return {
      ok: true,
      watts: pick(input.typedWatts, input.lastClose?.watts)
    };
  }

  // packages/adaptive/src/close-cond.ts
  function closeCond(input) {
    if (input.lastMade.rpm != null) return { ok: true, rpm: input.lastMade.rpm };
    if (input.lastMade.watts != null) return { ok: true, watts: input.lastMade.watts };
    return { ok: true, splitSec: input.lastMade.splitSec };
  }

  // packages/adaptive/src/map-from-2k.ts
  var BAND_SPLIT_OFFSET_STEADY = 22.5;
  var BAND_SPLIT_OFFSET_TEMPO = 13.5;
  var BAND_SPLIT_OFFSET_THRESHOLD = 8.5;
  var BAND_SPLIT_OFFSET_INTERVALS = 2.5;
  var BAND_WATTS_RATIO_EASY = 0.6;
  var CONCEPT2_WATTS_FACTOR = 2.8;
  var SPLIT_OFFSET = {
    steady: BAND_SPLIT_OFFSET_STEADY,
    tempo: BAND_SPLIT_OFFSET_TEMPO,
    threshold: BAND_SPLIT_OFFSET_THRESHOLD,
    intervals: BAND_SPLIT_OFFSET_INTERVALS
  };
  function splitSecFrom2k(totalSec) {
    return totalSec / 4;
  }
  function wattsFromSplitSec(splitSec) {
    const pace = splitSec / 500;
    return Math.round(CONCEPT2_WATTS_FACTOR / (pace * pace * pace));
  }
  function mapBandFrom2k(totalSec, band) {
    const raceSplit = splitSecFrom2k(totalSec);
    const raceWatts = wattsFromSplitSec(raceSplit);
    if (band === "easy") {
      return {
        splitSec: Math.round(raceSplit),
        watts: Math.round(raceWatts * BAND_WATTS_RATIO_EASY)
      };
    }
    const splitSec = Math.round(raceSplit + SPLIT_OFFSET[band]);
    return {
      splitSec,
      watts: wattsFromSplitSec(splitSec)
    };
  }
  function softenOpen(value, modality, recovery) {
    if (recovery == null || recovery === 0) return Math.round(value);
    if (recovery >= 67) return Math.round(value);
    const mid = recovery >= 34;
    if (modality === "split") {
      const factor2 = mid ? 1.02 : 1.04;
      return Math.round(value * factor2);
    }
    const factor = mid ? 0.97 : 0.94;
    return Math.round(value * factor);
  }
  return __toCommonJS(index_exports);
})();
