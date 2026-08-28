/** Domain receipts for weekly four-system planning — read-only inputs, zero I/O. */

export interface ProgressionAuditEntry {
  at: string;
  sessionId: string;
  exerciseId: string;
  action: 'progress' | 'hold' | 'deload' | 'retest';
  deltaKg?: number;
  reasonCodes: string[];
  recoveryGate?: string;
  sessionPain?: string;
  performanceOverride?: boolean;
}

export interface DomainReceipts {
  strength: {
    progressionAudit: ProgressionAuditEntry[];
    sessionPainFlags: Array<{ sessionId: string; level: string; at: string }>;
  };
  conditioning: {
    weeklyZoneSeconds: Record<string, number>;
    sessionsCompleted: number;
  };
  recovery: Array<{
    date: string;
    band: 'build' | 'control' | 'minimum' | 'insufficient_data';
    gate: 'ok' | 'caution' | 'hold';
    illness?: boolean;
    debtScore?: number;
    debtElevated?: boolean;
    strain?: number;
  }>;
  recoveryDebt?: {
    score: number;
    elevated: boolean;
    repay: number;
    netRatio?: number;
  };
  nutrition: {
    daysLogged: number;
    daysInWindow: number;
    lowEnergyFlag?: boolean;
  };
}

export interface CoordinatorItem {
  domain: 'strength' | 'conditioning' | 'recovery' | 'nutrition';
  kind: 'hold' | 'ease' | 'maintain' | 'push' | 'review';
  message: string;
  silentApply: boolean;
}

export interface CoordinatorReceipt {
  weekStart: string;
  generatedAt: string;
  headline: string;
  items: CoordinatorItem[];
  reasonCodes: string[];
}

function zoneTotal(z: Record<string, number>): number {
  return Object.values(z).reduce((a, v) => a + (Number(v) || 0), 0);
}

export function planCoordinator(receipts: DomainReceipts, opts?: { weekStart?: string; generatedAt?: string }): CoordinatorReceipt {
  const items: CoordinatorItem[] = [];
  const reasonCodes: string[] = [];

  const holds = receipts.strength.progressionAudit.filter(e => e.action === 'hold');
  const progresses = receipts.strength.progressionAudit.filter(e => e.action === 'progress');
  const painFlags = receipts.strength.sessionPainFlags.filter(p => p.level === 'yes');

  if (painFlags.length) {
    items.push({
      domain: 'strength',
      kind: 'hold',
      message: `Session pain flagged ${painFlags.length} time(s) this week — autopilot held affected lifts.`,
      silentApply: true,
    });
    reasonCodes.push('strength_pain_flags');
  }

  const recoveryHolds = receipts.recovery.filter(r => r.gate === 'hold' || r.band === 'minimum');
  const recoveryControl = receipts.recovery.filter(r => r.gate === 'caution' || r.band === 'control');
  const illnessDays = receipts.recovery.filter(r => r.illness).length;
  const debt = receipts.recoveryDebt;
  if (debt && debt.elevated && debt.score >= 55) {
    items.push({
      domain: 'recovery',
      kind: 'hold',
      message: `Recovery debt ${debt.score} — heavy delivery week; autopilot held until load eases.`,
      silentApply: true,
    });
    reasonCodes.push('recovery_debt_high');
  } else if (debt && (debt.elevated || debt.score >= 40)) {
    items.push({
      domain: 'recovery',
      kind: 'ease',
      message: `Recovery debt ${debt.score}${debt.repay > 0 ? ` · ~${debt.repay} repay logged` : ''} — easy sessions pay down delivery load.`,
      silentApply: true,
    });
    reasonCodes.push('recovery_debt_elevated');
  }
  if (illnessDays > 0) {
    items.push({
      domain: 'recovery',
      kind: 'review',
      message: `Illness flagged ${illnessDays} day(s) this week — informational only; training is never blocked.`,
      silentApply: false,
    });
    reasonCodes.push('recovery_illness_flagged');
  }
  if (recoveryHolds.length >= 2) {
    items.push({
      domain: 'recovery',
      kind: 'hold',
      message: `${recoveryHolds.length} rough recovery day(s) — expect held load bumps unless you beat targets.`,
      silentApply: false,
    });
    reasonCodes.push('recovery_minimum_days');
  } else if (recoveryControl.length >= 3) {
    items.push({
      domain: 'recovery',
      kind: 'ease',
      message: 'Several control days — autopilot stays conservative.',
      silentApply: false,
    });
    reasonCodes.push('recovery_control_streak');
  }

  const noCheckinDays = receipts.recovery.filter(r => r.band === 'insufficient_data').length;
  if (noCheckinDays >= 2) {
    items.push({
      domain: 'recovery',
      kind: 'review',
      message: `${noCheckinDays} day(s) without check-in — silent bumps stay off until you check in.`,
      silentApply: true,
    });
    reasonCodes.push('recovery_no_checkin');
  }

  if (progresses.length) {
    items.push({
      domain: 'strength',
      kind: 'push',
      message: `${progresses.length} silent load increase(s) applied this week.`,
      silentApply: true,
    });
    reasonCodes.push('strength_progress_applied');
  }

  if (holds.length > progresses.length && holds.length >= 2) {
    items.push({
      domain: 'strength',
      kind: 'hold',
      message: 'More holds than bumps — mixed week or recovery gates active.',
      silentApply: true,
    });
    reasonCodes.push('strength_hold_heavy_week');
  }

  const zoneSec = zoneTotal(receipts.conditioning.weeklyZoneSeconds);
  const zoneMin = Math.round(zoneSec / 60);
  if (receipts.conditioning.sessionsCompleted === 0) {
    items.push({
      domain: 'conditioning',
      kind: 'review',
      message: 'No conditioning sessions logged this week.',
      silentApply: false,
    });
    reasonCodes.push('conditioning_none');
  } else if (zoneMin < 30) {
    items.push({
      domain: 'conditioning',
      kind: 'ease',
      message: `Light aerobic dose (${zoneMin} zone min) — optional easy session if planned.`,
      silentApply: true,
    });
    reasonCodes.push('conditioning_low_dose');
  } else {
    items.push({
      domain: 'conditioning',
      kind: 'maintain',
      message: `${receipts.conditioning.sessionsCompleted} conditioning session(s) · ${zoneMin} zone min.`,
      silentApply: false,
    });
    reasonCodes.push('conditioning_on_track');
  }

  if (receipts.nutrition.daysInWindow > 0) {
    const pct = Math.round((receipts.nutrition.daysLogged / receipts.nutrition.daysInWindow) * 100);
    if (receipts.nutrition.lowEnergyFlag) {
      items.push({
        domain: 'nutrition',
        kind: 'review',
        message: 'Low fuel reported on check-in — autopilot loads unchanged; log nutrition if tracking.',
        silentApply: false,
      });
      reasonCodes.push('nutrition_low_energy');
    }
    if (receipts.nutrition.daysLogged === 0) {
      items.push({
        domain: 'nutrition',
        kind: 'review',
        message: 'No nutrition days logged this week — adherence unknown.',
        silentApply: false,
      });
      reasonCodes.push('nutrition_none');
    } else if (pct < 50) {
      items.push({
        domain: 'nutrition',
        kind: 'review',
        message: `Nutrition logged ${receipts.nutrition.daysLogged}/${receipts.nutrition.daysInWindow} days.`,
        silentApply: false,
      });
      reasonCodes.push('nutrition_sparse');
    } else {
      items.push({
        domain: 'nutrition',
        kind: 'maintain',
        message: `Nutrition logged ${receipts.nutrition.daysLogged}/${receipts.nutrition.daysInWindow} days.`,
        silentApply: false,
      });
      reasonCodes.push('nutrition_logged');
    }
  }

  let headline = 'Steady week — keep logging.';
  if (painFlags.length || recoveryHolds.length >= 2 || (debt && debt.score >= 55)) {
    headline = 'Recovery led — autopilot stayed conservative.';
  } else if (debt && debt.elevated) headline = 'Heavy delivery week — easy work still helps.';
  else if (progresses.length && !recoveryHolds.length) headline = 'Good week — silent bumps landed where allowed.';
  else if (zoneMin >= 90) headline = 'Solid conditioning dose alongside strength.';

  return {
    weekStart: opts?.weekStart ?? '',
    generatedAt: opts?.generatedAt ?? new Date().toISOString(),
    headline,
    items,
    reasonCodes,
  };
}
