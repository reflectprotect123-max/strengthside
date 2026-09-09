/**
 * Unified session cursor — strength ↔ conditioning handoff preview.
 * Tracks the active node and renders an "Up next" strip when another task follows.
 */
(function (global) {
  function escHtml(value) {
    if (typeof global.esc === 'function') return global.esc(value);
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function active() {
    return typeof global.activeSession === 'function' ? global.activeSession() : null;
  }

  function currentTask() {
    return typeof global.current === 'function' ? global.current() : null;
  }

  function cursor() {
    var x = active();
    var t = currentTask();
    var phase = null;
    if (t && t.interval && t.interval.phase) phase = t.interval.phase;
    else if (t && (t.kind === 'strength' || t.kind === 'superset')) phase = 'set';
    else if (t && t.kind === 'conditioning') phase = 'steady';
    return {
      sessionId: x && x.id,
      nodeKind: t ? t.kind : null,
      nodeIndex: x && x.taskIndex != null ? x.taskIndex : 0,
      phase: phase,
      taskCount: x && x.tasks ? x.tasks.length : 0,
    };
  }

  function nextIncompleteTask() {
    var x = active();
    if (!x || !x.tasks || !x.tasks.length) return null;
    var idx = x.taskIndex != null ? x.taskIndex : 0;
    for (var i = idx + 1; i < x.tasks.length; i++) {
      var task = x.tasks[i];
      if (task && !task.complete) return { task: task, index: i };
    }
    return null;
  }

  function labelFor(task) {
    if (!task) return 'Next';
    if (task.kind === 'strength') return task.name || 'Strength';
    if (task.kind === 'superset') return task.heading || task.name || 'Superset';
    if (task.kind === 'conditioning') {
      if (task.recoverySession) return task.heading || 'Recovery';
      return task.heading || task.modality || 'Conditioning';
    }
    return task.heading || task.name || 'Next';
  }

  function productFor(task) {
    if (!task) return 'Next';
    if (task.kind === 'conditioning') return task.recoverySession ? 'Recovery' : 'Engine';
    if (task.kind === 'strength' || task.kind === 'superset') return 'Strength';
    return 'Next';
  }

  function nextNodePreviewHtml() {
    var next = nextIncompleteTask();
    if (!next) return '';
    return (
      '<div class="session-handoff" data-next-kind="' +
      escHtml(next.task.kind || '') +
      '"><span>Up next in session</span><b>' +
      escHtml(productFor(next.task)) +
      ' · ' +
      escHtml(labelFor(next.task)) +
      '</b></div>'
    );
  }

  function syncChromeElapsed() {
    if (!global.SessionChrome || !global.SessionChrome.applyBrand) return;
    var x = active();
    if (!x) return;
    var elapsed =
      typeof global.workElapsed === 'function' ? global.workElapsed(x) : 0;
    var clock = global.document && global.document.getElementById('workoutClock');
    if (clock && global.SessionChrome.fmtElapsed) {
      clock.textContent = global.SessionChrome.fmtElapsed(elapsed);
      clock.classList.add('show');
    }
  }

  global.SessionFlow = {
    cursor: cursor,
    nextIncompleteTask: nextIncompleteTask,
    nextNodePreviewHtml: nextNodePreviewHtml,
    syncChromeElapsed: syncChromeElapsed,
    labelFor: labelFor,
    productFor: productFor,
  };
})(typeof window !== 'undefined' ? window : globalThis);
