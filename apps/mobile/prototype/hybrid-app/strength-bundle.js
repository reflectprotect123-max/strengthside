var HybridStrength = (() => {
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

  // strength-entry.ts
  var strength_entry_exports = {};
  __export(strength_entry_exports, {
    Volume: () => volumeBudget_exports
  });

  // ../../../../packages/strength-engine/src/volumeBudget.ts
  var volumeBudget_exports = {};
  __export(volumeBudget_exports, {
    auditSessionWorkingSets: () => auditSessionWorkingSets,
    computeVolumeBudget: () => computeVolumeBudget,
    maxSetsForExerciseInSession: () => maxSetsForExerciseInSession
  });
  var DEFAULT_WARMUP_MINUTES = 10;
  var DEFAULT_MINUTES_PER_SET = 4;
  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }
  function perMuscleSessionCapForSplit(splitType, sessionCap) {
    switch (splitType) {
      case "full_body":
        return clamp(Math.min(4, Math.floor(sessionCap / 3)), 3, 4);
      case "upper_lower":
        return clamp(Math.min(8, Math.floor(sessionCap / 2)), 4, 8);
      case "push_pull_legs":
        return clamp(Math.min(10, Math.floor(sessionCap * 0.55)), 5, 10);
    }
  }
  function computeVolumeBudget(input) {
    const sessionsPerWeek = clamp(Math.round(input.sessionsPerWeek), 1, 7);
    const minutesPerSession = clamp(Math.round(input.minutesPerSession), 20, 180);
    const warmupMinutes = input.warmupMinutes ?? DEFAULT_WARMUP_MINUTES;
    const minutesPerWorkingSet = input.minutesPerWorkingSet ?? DEFAULT_MINUTES_PER_SET;
    const available = Math.max(0, minutesPerSession - warmupMinutes);
    const rawSessionCap = Math.floor(available / minutesPerWorkingSet);
    const sessionWorkingSetCap = clamp(rawSessionCap, 8, 20);
    const weeklyWorkingSetCap = sessionWorkingSetCap * sessionsPerWeek;
    const perMuscleSessionCap = perMuscleSessionCapForSplit(input.splitType, sessionWorkingSetCap);
    const emphasize = Math.min(
      perMuscleSessionCap * sessionsPerWeek,
      Math.max(6, Math.floor(weeklyWorkingSetCap * 0.32))
    );
    const grow = Math.max(6, emphasize - 2);
    const maintain = Math.max(4, Math.floor(emphasize * 0.55));
    return {
      sessionsPerWeek,
      minutesPerSession,
      splitType: input.splitType,
      sessionWorkingSetCap,
      weeklyWorkingSetCap,
      perMuscleSessionCap,
      perMuscleWeeklyCap: { maintain, grow, emphasize },
      reasonCodes: ["volume.timeBudget.v1", `volume.split.${input.splitType}`]
    };
  }
  function auditSessionWorkingSets(workingSets, budget) {
    const sets = Math.max(0, Math.round(workingSets));
    const overSessionCap = sets > budget.sessionWorkingSetCap;
    const warnings = [];
    const reasonCodes = [...budget.reasonCodes];
    if (overSessionCap) {
      warnings.push(
        `${sets} working sets is above the ~${budget.sessionWorkingSetCap}-set guide for a typical ${budget.minutesPerSession}-minute session \u2014 fine if you had extra time.`
      );
      reasonCodes.push("volume.session_guide_exceeded");
    }
    return {
      workingSets: sets,
      sessionCap: budget.sessionWorkingSetCap,
      overSessionCap,
      warnings,
      reasonCodes
    };
  }
  function maxSetsForExerciseInSession(currentSessionWorkingSets, currentExerciseSets, budget) {
    const sessionSets = Math.max(0, Math.round(currentSessionWorkingSets));
    const exerciseSets = Math.max(0, Math.round(currentExerciseSets));
    const remainingSession = Math.max(0, budget.sessionWorkingSetCap - (sessionSets - exerciseSets));
    return Math.min(budget.perMuscleSessionCap, remainingSession);
  }
  return __toCommonJS(strength_entry_exports);
})();
