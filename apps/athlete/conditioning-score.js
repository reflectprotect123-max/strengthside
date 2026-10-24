/** Machine-conditioning score: rounds, splits, pace/500 m, session totals. */
(function (root) {
  function num(value) {
    if (value == null || value === '') return 0;
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function secondsOf(row) {
    const cells = row && row.cells || {};
    return num(cells.time_mmss) || num(cells.seconds) || 0;
  }

  function machineKind(page) {
    const title = String(page && page.title || '');
    if (/ski/i.test(title)) return 'ski';
    if (/row|rower/i.test(title)) return 'row';
    if (/bike|cycle|echo/i.test(title)) return 'bike';
    const cols = page && page.columns || [];
    if (cols.some((c) => ['calories', 'meters', 'watts', 'time_mmss', 'seconds'].includes(c))
      && !cols.some((c) => ['reps', 'reps_range', 'weight_kg', 'weight_lb'].includes(c))) {
      return 'machine';
    }
    return null;
  }

  function scoredRows(rows) {
    return (rows || []).filter((row) => row && row.logged && !row.miss && row.purpose !== 'ramp' && row.purpose !== 'warmup');
  }

  function pace500(meters, seconds) {
    if (!(meters > 0) || !(seconds > 0)) return null;
    return Math.round(seconds / (meters / 500));
  }

  function forPage(page, rows) {
    const kind = machineKind(page);
    const logged = scoredRows(rows);
    const splits = logged.map((row, i) => {
      const cells = row.cells || {};
      const meters = num(cells.meters);
      const seconds = secondsOf(row);
      const calories = num(cells.calories);
      const watts = num(cells.watts);
      return {
        index: i + 1,
        calories,
        meters,
        watts,
        seconds,
        pace500: kind === 'bike' ? null : pace500(meters, seconds),
      };
    });
    const totals = splits.reduce((acc, split) => {
      acc.calories += split.calories;
      acc.meters += split.meters;
      acc.seconds += split.seconds;
      acc.wattsSum += split.watts;
      acc.wattRows += split.watts > 0 ? 1 : 0;
      return acc;
    }, {calories: 0, meters: 0, seconds: 0, wattsSum: 0, wattRows: 0});
    const watts = totals.wattRows ? Math.round(totals.wattsSum / totals.wattRows) : 0;
    return {
      kind,
      title: page && page.title || '',
      rounds: splits.length,
      splits,
      totals: {calories: totals.calories, meters: totals.meters, seconds: totals.seconds, watts},
      pace500: kind === 'bike' ? null : pace500(totals.meters, totals.seconds),
    };
  }

  function pagesOf(session) {
    const out = [];
    for (const page of session && session.pages || []) {
      for (const member of page.members || [page]) {
        if (member && machineKind(member)) out.push(member);
      }
    }
    return out;
  }

  function fromSession(session) {
    const machines = pagesOf(session).map((page) => forPage(page, session.logs && session.logs[page.id] && session.logs[page.id].sets));
    const live = machines.filter((m) => m.rounds);
    const totals = live.reduce((acc, m) => {
      acc.calories += m.totals.calories;
      acc.meters += m.totals.meters;
      acc.seconds += m.totals.seconds;
      acc.wattsSum += m.totals.watts * m.rounds;
      acc.wattRows += m.totals.watts > 0 ? m.rounds : 0;
      return acc;
    }, {calories: 0, meters: 0, seconds: 0, wattsSum: 0, wattRows: 0});
    const splits = live.flatMap((m) => m.splits.map((split) => ({...split, title: m.title, kind: m.kind})));
    const rowSki = live.filter((m) => m.kind === 'row' || m.kind === 'ski');
    const meters = rowSki.reduce((n, m) => n + m.totals.meters, 0);
    const seconds = rowSki.reduce((n, m) => n + m.totals.seconds, 0);
    return {
      rounds: live.reduce((n, m) => n + m.rounds, 0),
      machines: live,
      splits,
      totals: {
        calories: totals.calories,
        meters: totals.meters,
        seconds: totals.seconds,
        watts: totals.wattRows ? Math.round(totals.wattsSum / totals.wattRows) : 0,
      },
      pace500: pace500(meters, seconds),
    };
  }

  function receipt(session) {
    const score = fromSession(session);
    return {
      rounds: score.rounds,
      splits: score.splits,
      totals: score.totals,
      pace500: score.pace500,
    };
  }

  function clock(seconds) {
    const s = Math.max(0, Math.round(num(seconds)));
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  }

  root.ConditioningScore = {machineKind, forPage, fromSession, receipt, clock, pace500};
})(typeof globalThis !== 'undefined' ? globalThis : this);
