/* Calendar placement for recorded WHOOP days. Missing days are not given a value. */
(function (root) {
  function trend(rows, key, span) {
    const recorded = (rows || []).filter((row) => Number.isFinite(row && row[key]));
    if (!recorded.length) return null;
    const start = (span && span.start) || recorded[0].date;
    const end = (span && span.end) || recorded[recorded.length - 1].date;
    const lo = Date.parse(start);
    const hi = Date.parse(end);
    const values = recorded.map((row) => row[key]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const ySpan = max - min || 1;
    const xSpan = hi - lo || 1;
    const points = recorded.map((row) => ({
      x: 12 + ((Date.parse(row.date) - lo) / xSpan) * 296,
      y: 94 - ((row[key] - min) / ySpan) * 70,
      date: row.date,
      value: row[key],
    }));
    return { start, end, points, count: recorded.length };
  }
  root.ProgressChart = { trend };
})(typeof window !== 'undefined' ? window : globalThis);
