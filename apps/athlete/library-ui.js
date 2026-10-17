/* Athlete workout library: view assigned/saved workouts. Authoring lives in Coach. */
(function (root) {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const arg = value => esc(JSON.stringify(String(value)));
  function state() {
    root.S.library = root.HybridLibrary.ensure(root.S.library);
    const old = root.S.libUi || {};
    root.S.libUi = { screen: old.screen === 'view' ? 'view' : 'list', tid: old.tid || null, q: String(old.q || '') };
    return root.S.library;
  }
  function repaint() { root.save?.(); root.render?.(); }
  function cards() {
    const library = state(), query = root.S.libUi.q.toLowerCase();
    const rows = library.templates.filter(t => !query || String(t.title || '').toLowerCase().includes(query) || (t.blocks || []).some(b => String(b.title || '').toLowerCase().includes(query)));
    if (!rows.length) return '<div class="lib-empty"><b>No saved workouts</b><p>Workouts published by your coach will appear in Training.</p></div>';
    return rows.map(t => `<article class="lib-card"><button type="button" class="lib-open" onclick="LibraryView.open(${arg(t.id)})"><h2>${esc(t.title)}</h2><p>${esc(root.HybridLibrary.lettered(t).map(b => b.title).join(', '))}</p></button><div class="lib-card-actions"><button type="button" class="lib-danger" onclick="LibraryView.removeTpl(${arg(t.id)})">Delete</button></div></article>`).join('');
  }
  function detail(template) {
    const library = state(), plan = root.HybridLibrary.compile(template);
    const dates = Object.entries(library.assignments).filter(([, id]) => id === template.id).map(([date]) => date).sort();
    const blocks = plan.blocks.map(block => {
      if (block.kind === 'section') return `<div class="trn-section"><span class="trn-section-label">${esc(block.label)}</span></div>`;
      const lines = block.kind === 'lift' ? [block.prescription, ...(block.notes || [])] : block.kind === 'recovery' && block.bullets?.length ? block.bullets : (block.items || []).map(item => item.text);
      return `<article class="lib-card"><span class="lib-kicker">${esc(block.letter)}</span><h2>${esc(block.title)}</h2>${lines.map(line => `<p>${esc(line)}</p>`).join('')}</article>`;
    }).join('');
    return `<div class="shell-screen shell-screen--library"><div class="lib-top"><button type="button" class="lib-back" aria-label="Back to workouts" onclick="LibraryView.goList()">←</button><p class="lib-kicker">Saved workout</p><h1 class="lib-title">${esc(template.title)}</h1><p>${esc(template.instructions || '')}</p></div>${blocks}<div class="lib-dates">${dates.map(date => `<button type="button" class="lib-chip" onclick="LibraryView.training(${arg(date)})">View ${esc(date)} in Training</button>`).join('') || '<p>This workout has no scheduled day.</p>'}</div></div>`;
  }
  const LibraryView = {
    html() {
      const library = state(), ui = root.S.libUi;
      const template = ui.screen === 'view' && root.HybridLibrary.template(library, ui.tid);
      if (template) return detail(template);
      return `<div class="shell-screen shell-screen--library"><div class="lib-top"><p class="lib-kicker">Library</p><h1 class="lib-title">Sessions</h1></div><div class="lib-search"><input value="${esc(ui.q)}" placeholder="Search sessions" aria-label="Search sessions" oninput="LibraryView.search(this.value)"></div><div id="libResults">${cards()}</div></div>`;
    },
    search(query) {
      state(); root.S.libUi.q = String(query || ''); root.save?.();
      const el = root.document?.getElementById('libResults');
      if (el) el.innerHTML = cards();
    },
    goList() { state(); root.S.libUi = { screen: 'list', tid: null, q: '' }; repaint(); },
    open(tid) {
      const library = state();
      root.S.libUi = { screen: root.HybridLibrary.template(library, tid) ? 'view' : 'list', tid, q: '' };
      repaint();
    },
    training(date) { root.selectDate?.(date); root.S.tab = 'training'; repaint(); },
    removeTpl(tid) {
      if (!root.confirm('Delete this saved workout?')) return;
      root.S.library = root.HybridLibrary.deleteTemplate(state(), tid);
      LibraryView.goList();
    },
  };
  root.LibraryView = LibraryView;
})(typeof window !== 'undefined' ? window : globalThis);
