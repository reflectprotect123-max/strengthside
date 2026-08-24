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
    Coordinator: () => coordinator_exports,
    Exposure: () => exposure_exports,
    Performed: () => performed_exports,
    Pr: () => pr_exports,
    Progression: () => progression_exports,
    Rounding: () => rounding_exports,
    Volume: () => volumeBudget_exports,
    WorkingMax: () => workingMax_exports
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

  // ../../../../packages/strength-engine/src/progression.ts
  var progression_exports = {};
  __export(progression_exports, {
    DeterministicDecider: () => DeterministicDecider,
    anchorKgFor: () => anchorKgFor,
    decideProgression: () => decideProgression
  });

  // ../../../../packages/strength-engine/src/calibration.ts
  var MIN_EXPOSURES = 3;
  function calibrationStateFor(exposures) {
    const usable = exposures.filter((e) => e.exposureClass !== "pain_blocked");
    if (usable.length === 0) return "uncalibrated";
    return usable.length >= MIN_EXPOSURES ? "calibrated" : "building";
  }

  // ../../../../packages/strength-engine/src/progression.ts
  function anchorKgFor(exposures) {
    const sorted = [...exposures].sort((a, b) => a.performedAt.localeCompare(b.performedAt));
    for (let i = sorted.length - 1; i >= 0; i--) {
      const e = sorted[i];
      if (e.exposureClass === "successful" || e.exposureClass === "successful_but_uncertain") return e.loadKg;
    }
    return null;
  }
  function base(ctx) {
    return { exerciseId: ctx.exerciseId, source: "deterministic" };
  }
  function decideProgression(exposures, ctx) {
    const sorted = [...exposures].sort((a, b) => a.performedAt.localeCompare(b.performedAt));
    const calibration = calibrationStateFor(sorted);
    if (calibration !== "calibrated") {
      return { ...base(ctx), action: "hold", confidence: 0.3, reasonCodes: ["insufficient_exposure"] };
    }
    const usable = sorted.filter((e) => e.exposureClass !== "pain_blocked");
    const recent = usable.slice(-3);
    const allSuccessful = recent.every((e) => e.exposureClass === "successful" && e.onTarget);
    const repeatedDeterioration = recent.filter((e) => e.exposureClass === "missed").length >= 2;
    const anchor = anchorKgFor(usable);
    if (allSuccessful) {
      const deltaPct = 0.025;
      return {
        ...base(ctx),
        action: "progress",
        deltaPct,
        confidence: 0.9,
        reasonCodes: ["three_on_target"],
        ...anchor != null ? { deltaKg: anchor * deltaPct } : {}
      };
    }
    if (repeatedDeterioration && anchor != null) {
      const deltaPct = -0.05;
      return {
        ...base(ctx),
        action: "deload",
        deltaPct,
        confidence: 0.85,
        reasonCodes: ["repeated_deterioration"],
        deltaKg: anchor * deltaPct
      };
    }
    return { ...base(ctx), action: "hold", confidence: 0.7, reasonCodes: ["mixed_signal"] };
  }
  var DeterministicDecider = {
    async decide(exposures, _calibration, ctx) {
      return decideProgression(exposures, ctx);
    }
  };

  // ../../../../packages/strength-engine/src/exposure.ts
  var exposure_exports = {};
  __export(exposure_exports, {
    strengthExposuresFor: () => strengthExposuresFor
  });

  // ../../../../packages/strength-engine/src/performed.ts
  var performed_exports = {};
  __export(performed_exports, {
    measurementValue: () => measurementValue
  });
  function measurementValue(set, key) {
    return set.measurements.find((m) => m.metricKey === key)?.value ?? null;
  }

  // ../../../../packages/strength-engine/src/exposure.ts
  function strengthExposuresFor(exerciseId, performed, resolvedTargets = {}) {
    const relevant = performed.filter((p) => p.exerciseId === exerciseId);
    const bySession = /* @__PURE__ */ new Map();
    for (const set of relevant) {
      const bucket = bySession.get(set.assignedSessionId);
      if (bucket) bucket.push(set);
      else bySession.set(set.assignedSessionId, [set]);
    }
    const exposures = [];
    for (const [assignedSessionId, sets] of bySession) {
      const representative = [...sets].sort((a, b) => a.performedAt.localeCompare(b.performedAt)).at(-1);
      const loadKg = measurementValue(representative, "load");
      if (loadKg == null) continue;
      const reps = measurementValue(representative, "reps") ?? 0;
      const rated = measurementValue(representative, "rpe") != null;
      const painFlagged = measurementValue(representative, "pain") != null;
      let exposureClass;
      if (painFlagged) exposureClass = "pain_blocked";
      else if (representative.status !== "completed") exposureClass = "missed";
      else exposureClass = rated ? "successful" : "successful_but_uncertain";
      const target = representative.prescribedSetId != null ? resolvedTargets[representative.prescribedSetId] : void 0;
      const onTarget = target == null ? true : (target.targetReps == null || reps >= target.targetReps) && (target.targetLoadKg == null || loadKg >= target.targetLoadKg);
      exposures.push({
        exerciseId,
        assignedSessionId,
        reps,
        loadKg,
        rated,
        painFlagged,
        onTarget,
        exposureClass,
        performedSetId: representative.id,
        performedAt: representative.performedAt
      });
    }
    return exposures.sort((a, b) => a.performedAt.localeCompare(b.performedAt));
  }

  // ../../../../packages/strength-engine/src/pr.ts
  var pr_exports = {};
  __export(pr_exports, {
    detectPr: () => detectPr
  });
  function detectPr(newSet, priorEvents) {
    if (newSet.reps <= 0) return false;
    const priorBest = priorEvents.filter((e) => e.exerciseId === newSet.exerciseId && e.repCount === newSet.reps).reduce((best, e) => best == null || e.valueKg > best ? e.valueKg : best, null);
    return priorBest == null || newSet.loadKg > priorBest;
  }

  // ../../../../packages/strength-engine/src/workingMax.ts
  var workingMax_exports = {};
  __export(workingMax_exports, {
    currentWorkingMax: () => currentWorkingMax
  });
  function currentWorkingMax(events, asOf) {
    const asOfEnd = asOf.length === 10 ? `${asOf}T23:59:59.999Z` : asOf;
    const upTo = events.filter((e) => e.effectiveAt <= asOfEnd).sort((a, b) => b.effectiveAt.localeCompare(a.effectiveAt));
    if (!upTo.length) return null;
    const latest = upTo[0];
    const latestManual = upTo.find((e) => e.source !== "auto_estimate");
    if (latestManual && latestManual.effectiveAt >= latest.effectiveAt) return latestManual;
    return latest;
  }

  // ../../../../packages/strength-engine/src/rounding.ts
  var rounding_exports = {};
  __export(rounding_exports, {
    roundLoadToEquipment: () => roundLoadToEquipment
  });
  function roundLoadToEquipment(value, equipment) {
    if (!Number.isFinite(value)) {
      throw new Error(`roundLoadToEquipment requires a finite load, got: ${value}`);
    }
    if (!equipment) return value;
    if (equipment.rounding === "none") return value;
    if (equipment.rackValuesKg?.length) {
      if (equipment.rounding === "nearest") {
        return equipment.rackValuesKg.reduce(
          (closest, v) => Math.abs(v - value) < Math.abs(closest - value) ? v : closest
        );
      }
      const below = equipment.rackValuesKg.filter((v) => v <= value);
      if (below.length) {
        return Math.max(...below);
      }
      return equipment.rackValuesKg[0];
    }
    if (equipment.incrementKg == null || equipment.incrementKg <= 0) return value;
    const steps = equipment.rounding === "nearest" ? Math.round(value / equipment.incrementKg) : Math.floor(value / equipment.incrementKg);
    return Number((steps * equipment.incrementKg).toFixed(6));
  }

  // ../../../../packages/strength-engine/src/coordinator.ts
  var coordinator_exports = {};
  __export(coordinator_exports, {
    planCoordinator: () => planCoordinator
  });
  function zoneTotal(z) {
    return Object.values(z).reduce((a, v) => a + (Number(v) || 0), 0);
  }
  function planCoordinator(receipts, opts) {
    const items = [];
    const reasonCodes = [];
    const holds = receipts.strength.progressionAudit.filter((e) => e.action === "hold");
    const progresses = receipts.strength.progressionAudit.filter((e) => e.action === "progress");
    const painFlags = receipts.strength.sessionPainFlags.filter((p) => p.level === "yes");
    if (painFlags.length) {
      items.push({
        domain: "strength",
        kind: "hold",
        message: `Session pain flagged ${painFlags.length} time(s) this week \u2014 autopilot held affected lifts.`,
        silentApply: true
      });
      reasonCodes.push("strength_pain_flags");
    }
    const recoveryHolds = receipts.recovery.filter((r) => r.gate === "hold" || r.band === "minimum");
    const recoveryControl = receipts.recovery.filter((r) => r.gate === "caution" || r.band === "control");
    const illnessDays = receipts.recovery.filter((r) => r.illness).length;
    if (illnessDays > 0) {
      items.push({
        domain: "recovery",
        kind: "review",
        message: `Illness flagged ${illnessDays} day(s) this week \u2014 informational only; training is never blocked.`,
        silentApply: false
      });
      reasonCodes.push("recovery_illness_flagged");
    }
    if (recoveryHolds.length >= 2) {
      items.push({
        domain: "recovery",
        kind: "hold",
        message: `${recoveryHolds.length} rough recovery day(s) \u2014 expect held load bumps unless you beat targets.`,
        silentApply: false
      });
      reasonCodes.push("recovery_minimum_days");
    } else if (recoveryControl.length >= 3) {
      items.push({
        domain: "recovery",
        kind: "ease",
        message: "Several control days \u2014 autopilot stays conservative.",
        silentApply: false
      });
      reasonCodes.push("recovery_control_streak");
    }
    const noCheckinDays = receipts.recovery.filter((r) => r.band === "insufficient_data").length;
    if (noCheckinDays >= 2) {
      items.push({
        domain: "recovery",
        kind: "review",
        message: `${noCheckinDays} day(s) without check-in \u2014 silent bumps stay off until you check in.`,
        silentApply: true
      });
      reasonCodes.push("recovery_no_checkin");
    }
    if (progresses.length) {
      items.push({
        domain: "strength",
        kind: "push",
        message: `${progresses.length} silent load increase(s) applied this week.`,
        silentApply: true
      });
      reasonCodes.push("strength_progress_applied");
    }
    if (holds.length > progresses.length && holds.length >= 2) {
      items.push({
        domain: "strength",
        kind: "hold",
        message: "More holds than bumps \u2014 mixed week or recovery gates active.",
        silentApply: true
      });
      reasonCodes.push("strength_hold_heavy_week");
    }
    const zoneSec = zoneTotal(receipts.conditioning.weeklyZoneSeconds);
    const zoneMin = Math.round(zoneSec / 60);
    if (receipts.conditioning.sessionsCompleted === 0) {
      items.push({
        domain: "conditioning",
        kind: "review",
        message: "No conditioning sessions logged this week.",
        silentApply: false
      });
      reasonCodes.push("conditioning_none");
    } else if (zoneMin < 30) {
      items.push({
        domain: "conditioning",
        kind: "ease",
        message: `Light aerobic dose (${zoneMin} zone min) \u2014 optional easy session if planned.`,
        silentApply: true
      });
      reasonCodes.push("conditioning_low_dose");
    } else {
      items.push({
        domain: "conditioning",
        kind: "maintain",
        message: `${receipts.conditioning.sessionsCompleted} conditioning session(s) \xB7 ${zoneMin} zone min.`,
        silentApply: false
      });
      reasonCodes.push("conditioning_on_track");
    }
    if (receipts.nutrition.daysInWindow > 0) {
      const pct = Math.round(receipts.nutrition.daysLogged / receipts.nutrition.daysInWindow * 100);
      if (receipts.nutrition.lowEnergyFlag) {
        items.push({
          domain: "nutrition",
          kind: "review",
          message: "Low fuel reported on check-in \u2014 autopilot loads unchanged; log nutrition if tracking.",
          silentApply: false
        });
        reasonCodes.push("nutrition_low_energy");
      }
      if (receipts.nutrition.daysLogged === 0) {
        items.push({
          domain: "nutrition",
          kind: "review",
          message: "No nutrition days logged this week \u2014 adherence unknown.",
          silentApply: false
        });
        reasonCodes.push("nutrition_none");
      } else if (pct < 50) {
        items.push({
          domain: "nutrition",
          kind: "review",
          message: `Nutrition logged ${receipts.nutrition.daysLogged}/${receipts.nutrition.daysInWindow} days.`,
          silentApply: false
        });
        reasonCodes.push("nutrition_sparse");
      } else {
        items.push({
          domain: "nutrition",
          kind: "maintain",
          message: `Nutrition logged ${receipts.nutrition.daysLogged}/${receipts.nutrition.daysInWindow} days.`,
          silentApply: false
        });
        reasonCodes.push("nutrition_logged");
      }
    }
    let headline = "Steady week \u2014 keep logging.";
    if (painFlags.length || recoveryHolds.length >= 2) headline = "Recovery led \u2014 autopilot stayed conservative.";
    else if (progresses.length && !recoveryHolds.length) headline = "Good week \u2014 silent bumps landed where allowed.";
    else if (zoneMin >= 90) headline = "Solid conditioning dose alongside strength.";
    return {
      weekStart: opts?.weekStart ?? "",
      generatedAt: opts?.generatedAt ?? (/* @__PURE__ */ new Date()).toISOString(),
      headline,
      items,
      reasonCodes
    };
  }
  return __toCommonJS(strength_entry_exports);
})();
