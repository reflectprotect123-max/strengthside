/** Month grid and unscheduled-session picker for the Training tab. */
(function (root) {
  function parseDate(iso) {
    return new Date(iso + 'T12:00:00');
  }

  function toIso(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function monthDays(iso) {
    const selected = parseDate(iso);
    const first = new Date(selected.getFullYear(), selected.getMonth(), 1);
    const last = new Date(selected.getFullYear(), selected.getMonth() + 1, 0);
    const start = new Date(first);
    const dow = start.getDay();
    start.setDate(start.getDate() + (dow === 0 ? -6 : 1 - dow));
    const weeks = [];
    let cursor = new Date(start);
    while (cursor <= last || weeks.length < 1 || cursor.getDay() !== 1) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(toIso(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
      if (cursor > last && cursor.getDay() === 1) break;
    }
    return weeks;
  }

  function ownPlan(date) {
    return {
      id: 'own:' + date,
      title: 'Own session',
      source: 'own',
      instructions: '',
      blocks: [{
        kind: 'lift',
        letter: 'A',
        title: 'Open work',
        setCount: 3,
        columns: ['reps', 'weight_kg'],
      }],
    };
  }

  function pickerItems(library) {
    const templates = (library && library.templates || []).filter((t) => t && t.id);
    const saved = templates.map((t) => ({id: t.id, title: t.title || 'Saved workout', source: t.source || 'library'}));
    return [{id: 'own', title: 'Empty session', source: 'own'}, ...saved];
  }

  function planForPick(library, pickId, date) {
    if (!pickId || pickId === 'own') return ownPlan(date);
    const tpl = library && root.HybridLibrary && root.HybridLibrary.template(library, pickId);
    if (!tpl) return ownPlan(date);
    if (root.HybridLibrary && typeof root.HybridLibrary.compile === 'function') {
      const compiled = root.HybridLibrary.compile(tpl);
      return {...compiled, title: tpl.title || compiled.title, instructions: tpl.instructions || ''};
    }
    return {id: tpl.id, title: tpl.title, instructions: tpl.instructions || '', blocks: tpl.blocks || []};
  }

  root.TrainingCalendar = {monthDays, ownPlan, pickerItems, planForPick};
})(typeof globalThis !== 'undefined' ? globalThis : this);
