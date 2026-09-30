/**
 * Engine conditioning calendar: SZN → block length → one method → rung ladder.
 * Advance after two qualifying finishes. One lever per rung. Not wired to Morph's unpublished math.
 */
(function (root) {
  const SZNS = {
    base: {
      id: 'base',
      label: 'Base',
      weeks: 8,
      methods: [1, 2],
      primary: 1,
      job: 'Grow easy continuous. Stay in Blue.',
    },
    build: {
      id: 'build',
      label: 'Build',
      weeks: 6,
      methods: [2, 3, 4],
      primary: 4,
      job: 'Add Blue structure. Keep easy volume.',
    },
    raise: {
      id: 'raise',
      label: 'Raise',
      weeks: 6,
      methods: [7, 8],
      primary: 8,
      job: 'Controlled Green before power bursts.',
    },
    peak: {
      id: 'peak',
      label: 'Peak',
      weeks: 4,
      methods: [9, 10, 12],
      primary: 9,
      job: 'Red only while the ceiling allows.',
    },
    maintain: {
      id: 'maintain',
      label: 'In season',
      weeks: 4,
      methods: [1, 2, 4],
      primary: 1,
      job: 'Hold fitness. Do not dig a hole.',
    },
  };

  function rx(label, extra) {
    return Object.assign({ label }, extra || {});
  }

  const METHODS = [
    {
      id: 1,
      name: 'Steady State Z1',
      band: 'blue',
      effort: 'easy',
      continuous: true,
      rungs: [30, 35, 40, 45, 50, 55, 60].map((m) => rx(`${m}:00 Easy continuous`, { minutes: m, continuous: true })),
    },
    {
      id: 2,
      name: 'Steady State Z2',
      band: 'blue',
      effort: 'easy',
      continuous: true,
      rungs: [20, 25, 30, 35, 40, 45, 50].map((m) => rx(`${m}:00 upper blue`, { minutes: m, continuous: true })),
    },
    {
      id: 3,
      name: 'Tempo',
      band: 'blue',
      effort: 'medium',
      rungs: [
        rx('10 × 10s / 60s', { reps: 10, workSec: 10, restSec: 60 }),
        rx('12 × 10s / 60s', { reps: 12, workSec: 10, restSec: 60 }),
        rx('12 × 12s / 60s', { reps: 12, workSec: 12, restSec: 60 }),
        rx('15 × 12s / 60s', { reps: 15, workSec: 12, restSec: 60 }),
        rx('15 × 15s / 60s', { reps: 15, workSec: 15, restSec: 60 }),
        rx('18 × 15s / 60s', { reps: 18, workSec: 15, restSec: 60 }),
        rx('20 × 15s / 60s', { reps: 20, workSec: 15, restSec: 60 }),
      ],
    },
    {
      id: 4,
      name: 'Blue Zone Repeats',
      band: 'blue',
      effort: 'easy',
      rungs: [
        rx('3 × 30s / 45s', { reps: 3, workSec: 30, restSec: 45 }),
        rx('4 × 30s / 45s', { reps: 4, workSec: 30, restSec: 45 }),
        rx('4 × 40s / 45s', { reps: 4, workSec: 40, restSec: 45 }),
        rx('5 × 40s / 40s', { reps: 5, workSec: 40, restSec: 40 }),
        rx('5 × 50s / 40s', { reps: 5, workSec: 50, restSec: 40 }),
        rx('5 × 60s / 45s', { reps: 5, workSec: 60, restSec: 45 }),
        rx('6 × 60s / 45s', { reps: 6, workSec: 60, restSec: 45 }),
      ],
    },
    {
      id: 5,
      name: 'Green Power',
      band: 'green',
      effort: 'hard',
      rungs: [
        rx('8 × 5s / 50s', { reps: 8, workSec: 5, restSec: 50 }),
        rx('10 × 5s / 50s', { reps: 10, workSec: 5, restSec: 50 }),
        rx('10 × 6s / 50s', { reps: 10, workSec: 6, restSec: 50 }),
        rx('12 × 6s / 45s', { reps: 12, workSec: 6, restSec: 45 }),
        rx('12 × 8s / 50s', { reps: 12, workSec: 8, restSec: 50 }),
        rx('15 × 8s / 50s', { reps: 15, workSec: 8, restSec: 50 }),
        rx('15 × 10s / 55s', { reps: 15, workSec: 10, restSec: 55 }),
      ],
    },
    {
      id: 6,
      name: 'Green Endurance',
      band: 'green',
      effort: 'hard',
      rungs: [
        rx('8 × 10s / 75s', { reps: 8, workSec: 10, restSec: 75 }),
        rx('10 × 10s / 75s', { reps: 10, workSec: 10, restSec: 75 }),
        rx('10 × 12s / 75s', { reps: 10, workSec: 12, restSec: 75 }),
        rx('12 × 12s / 70s', { reps: 12, workSec: 12, restSec: 70 }),
        rx('12 × 15s / 80s', { reps: 12, workSec: 15, restSec: 80 }),
        rx('15 × 15s / 80s', { reps: 15, workSec: 15, restSec: 80 }),
        rx('18 × 15s / 90s', { reps: 18, workSec: 15, restSec: 90 }),
      ],
    },
    {
      id: 7,
      name: 'Green Zone Repeats',
      band: 'green',
      effort: 'medium',
      rungs: [
        rx('3 × 30s / 45s', { reps: 3, workSec: 30, restSec: 45 }),
        rx('4 × 30s / 45s', { reps: 4, workSec: 30, restSec: 45 }),
        rx('4 × 40s / 45s', { reps: 4, workSec: 40, restSec: 45 }),
        rx('5 × 40s / 40s', { reps: 5, workSec: 40, restSec: 40 }),
        rx('5 × 50s / 45s', { reps: 5, workSec: 50, restSec: 45 }),
        rx('5 × 60s / 45s', { reps: 5, workSec: 60, restSec: 45 }),
        rx('6 × 60s / 50s', { reps: 6, workSec: 60, restSec: 50 }),
      ],
    },
    {
      id: 8,
      name: 'Green Threshold',
      band: 'green',
      effort: 'hard',
      rungs: [
        rx('2 × 3:00 / 3:00', { reps: 2, workSec: 180, restSec: 180 }),
        rx('2 × 4:00 / 3:00', { reps: 2, workSec: 240, restSec: 180 }),
        rx('3 × 4:00 / 3:00', { reps: 3, workSec: 240, restSec: 180 }),
        rx('3 × 5:00 / 3:00', { reps: 3, workSec: 300, restSec: 180 }),
        rx('4 × 5:00 / 3:00', { reps: 4, workSec: 300, restSec: 180 }),
        rx('4 × 5:00 / 2:30', { reps: 4, workSec: 300, restSec: 150 }),
        rx('4 × 6:00 / 3:00', { reps: 4, workSec: 360, restSec: 180 }),
      ],
    },
    {
      id: 9,
      name: 'Red Power',
      band: 'red',
      effort: 'hard',
      rungs: [
        rx('2 × 20s / 2:30', { reps: 2, workSec: 20, restSec: 150 }),
        rx('3 × 20s / 2:30', { reps: 3, workSec: 20, restSec: 150 }),
        rx('3 × 25s / 2:30', { reps: 3, workSec: 25, restSec: 150 }),
        rx('3 × 30s / 2:45', { reps: 3, workSec: 30, restSec: 165 }),
        rx('4 × 30s / 3:00', { reps: 4, workSec: 30, restSec: 180 }),
      ],
    },
    {
      id: 10,
      name: 'Red Endurance',
      band: 'red',
      effort: 'hard',
      rungs: [
        rx('2 × 40s / 1:30', { reps: 2, workSec: 40, restSec: 90 }),
        rx('2 × 50s / 1:45', { reps: 2, workSec: 50, restSec: 105 }),
        rx('3 × 50s / 1:45', { reps: 3, workSec: 50, restSec: 105 }),
        rx('3 × 60s / 2:00', { reps: 3, workSec: 60, restSec: 120 }),
        rx('4 × 60s / 2:00', { reps: 4, workSec: 60, restSec: 120 }),
      ],
    },
    {
      id: 11,
      name: 'Red Threshold',
      band: 'red',
      effort: 'hard',
      rungs: [
        rx('2 × 3:00 / 3:00', { reps: 2, workSec: 180, restSec: 180 }),
        rx('2 × 4:00 / 3:00', { reps: 2, workSec: 240, restSec: 180 }),
        rx('3 × 4:00 / 3:00', { reps: 3, workSec: 240, restSec: 180 }),
        rx('3 × 5:00 / 3:00', { reps: 3, workSec: 300, restSec: 180 }),
        rx('3 × 6:00 / 3:30', { reps: 3, workSec: 360, restSec: 210 }),
      ],
    },
    {
      id: 12,
      name: 'Red Max',
      band: 'red',
      effort: 'hard',
      rungs: [
        rx('2 × 60s / 4:00', { reps: 2, workSec: 60, restSec: 240 }),
        rx('2 × 75s / 4:00', { reps: 2, workSec: 75, restSec: 240 }),
        rx('3 × 75s / 4:30', { reps: 3, workSec: 75, restSec: 270 }),
        rx('3 × 90s / 5:00', { reps: 3, workSec: 90, restSec: 300 }),
        rx('4 × 90s / 5:00', { reps: 4, workSec: 90, restSec: 300 }),
      ],
    },
  ];

  function methodById(id) {
    return METHODS.find((m) => m.id === Number(id)) || METHODS[0];
  }

  function seasonById(id) {
    return SZNS[id] || SZNS.base;
  }

  function startSeason(sznId, iso) {
    const szn = seasonById(sznId);
    return {
      szn: szn.id,
      methodId: szn.primary,
      rung: 1,
      streak: 0,
      weeks: szn.weeks,
      startedOn: iso || null,
      last: null,
    };
  }

  function clone(block) {
    return JSON.parse(JSON.stringify(block));
  }

  function normalize(block, iso) {
    const b = block && block.szn ? clone(block) : startSeason('base', iso);
    const szn = seasonById(b.szn);
    if (!szn.methods.includes(Number(b.methodId))) b.methodId = szn.primary;
    const method = methodById(b.methodId);
    b.rung = Math.max(1, Math.min(method.rungs.length, Number(b.rung) || 1));
    b.streak = Math.max(0, Number(b.streak) || 0);
    b.weeks = szn.weeks;
    if (!b.startedOn) b.startedOn = iso || null;
    return b;
  }

  function daySpan(startIso, iso) {
    if (!startIso || !iso) return 0;
    const a = Date.parse(`${startIso}T00:00:00Z`);
    const b = Date.parse(`${iso}T00:00:00Z`);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
    return Math.max(0, Math.round((b - a) / 86400000));
  }

  function weekOf(block, iso) {
    const b = normalize(block, iso);
    const w = Math.floor(daySpan(b.startedOn, iso) / 7) + 1;
    return Math.min(b.weeks, Math.max(1, w));
  }

  function rungOf(block) {
    const b = normalize(block);
    const method = methodById(b.methodId);
    return method.rungs[b.rung - 1];
  }

  function dose(block, opts) {
    const b = normalize(block);
    const method = methodById(b.methodId);
    const step = rungOf(b);
    const recovery = opts && opts.recovery;
    let label = step.label;
    let minutes = step.minutes || null;
    let softened = false;
    if (step.continuous && recovery === 'red' && minutes) {
      minutes = Math.max(10, Math.round(minutes * 0.75));
      label = `${minutes}:00 Easy · shortened`;
      softened = true;
    }
    return {
      szn: seasonById(b.szn),
      method,
      rung: b.rung,
      rungCount: method.rungs.length,
      streak: b.streak,
      weeks: b.weeks,
      label,
      minutes,
      softened,
      continuous: !!step.continuous,
      atCeiling: b.rung >= method.rungs.length,
    };
  }

  function setMethod(block, methodId, iso) {
    const b = normalize(block, iso);
    const szn = seasonById(b.szn);
    const id = Number(methodId);
    if (!szn.methods.includes(id)) return b;
    if (id === b.methodId) return b;
    b.methodId = id;
    b.rung = 1;
    b.streak = 0;
    b.last = 'method';
    return b;
  }

  function recordFinish(block, input) {
    const src = input || {};
    const b = normalize(block, src.date);
    const step = rungOf(b);
    if (src.failed) {
      b.rung = Math.max(1, b.rung - 1);
      b.streak = 0;
      b.last = 'regress';
      return b;
    }
    const planned = src.plannedMin != null ? Number(src.plannedMin) : (step.minutes || 0);
    const completed = src.completedMin != null ? Number(src.completedMin) : null;
    let qualified = src.qualified;
    if (qualified == null) {
      if (step.continuous && planned > 0 && completed != null) qualified = completed / planned >= 0.9;
      else qualified = false;
    }
    if (!qualified) {
      b.streak = 0;
      b.last = 'repeat';
      return b;
    }
    b.streak += 1;
    if (b.rung >= methodById(b.methodId).rungs.length) {
      b.last = 'ceiling';
      return b;
    }
    if (b.streak >= 2) {
      b.rung += 1;
      b.streak = 0;
      b.last = 'advance';
      return b;
    }
    b.last = 'qualify';
    return b;
  }

  root.HybridProgression = {
    SZNS,
    METHODS,
    startSeason,
    normalize,
    weekOf,
    dose,
    setMethod,
    recordFinish,
    methodById,
    seasonById,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
