/**
 * Work timer UI — countdown ring for time-primary holds (mirrors rest-overlay API).
 */
(function (global) {
  var state = { startsAt: null, endsAt: null, totalSec: 0, tickId: null, onComplete: null };

  function escHtml(value) {
    if (typeof global.esc === 'function') return global.esc(value);
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function clockLabel(sec) {
    var n = Math.max(0, Math.floor(Number(sec) || 0));
    if (typeof global.formatMmSs === 'function') return global.formatMmSs(n);
    return Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0');
  }

  function remainingSec(now) {
    if (!state.endsAt) return Math.max(0, state.totalSec || 0);
    return Math.max(0, Math.ceil((state.endsAt - (now || Date.now())) / 1000));
  }

  function elapsedSec(now) {
    if (!state.startsAt) return 0;
    return Math.max(1, Math.round(((now || Date.now()) - state.startsAt) / 1000));
  }

  function isRunning() {
    return !!state.tickId;
  }

  function render(opts) {
    opts = opts || {};
    var mode = opts.mode === 'engine' ? 'engine' : 'strength';
    var dialClass = mode === 'engine' ? 'dial-engine' : 'dial-strength';
    var remaining = Number.isFinite(opts.remainingSec) ? Math.max(0, opts.remainingSec) : remainingSec();
    var timeLabel = clockLabel(remaining);
    var holdLabel = escHtml(opts.label || 'Hold');
    var doneLabel = escHtml(opts.doneEarlyLabel || 'Done early');
    var skipLabel = escHtml(opts.skipLabel || 'Skip');
    var doneOnclick = escHtml(opts.doneEarlyOnclick || 'WorkOverlay.finishEarly()');
    var skipOnclick = escHtml(opts.skipOnclick || 'WorkOverlay.skip()');
    var showSkip = opts.showSkip === true;
    return (
      '<div id=workOverlay class="logger-rest ' +
      dialClass +
      '">' +
      '<div class=rest-ring><div><div class=rest-time id=workOverlayClock>' +
      timeLabel +
      '</div><div class=rest-label>' +
      holdLabel +
      '</div></div></div>' +
      (opts.upNextHtml ? '<div class=rest-next>' + opts.upNextHtml + '</div>' : '') +
      '<div class=rest-actions>' +
      (showSkip
        ? '<button type=button class="btn" onclick="' +
          skipOnclick +
          '">' +
          skipLabel +
          '</button>'
        : '') +
      '<button type=button class="btn primary" onclick="' +
      doneOnclick +
      '">' +
      doneLabel +
      '</button></div></div>'
    );
  }

  function completeWork(actualSec) {
    var cb = state.onComplete;
    stopWork();
    if (typeof cb === 'function') cb(actualSec);
  }

  function tick() {
    var el = global.document && global.document.getElementById('workOverlayClock');
    if (!el) return;
    var rem = remainingSec();
    el.textContent = clockLabel(rem);
    if (rem <= 0) completeWork(state.totalSec || 0);
  }

  function startWork(seconds, onComplete) {
    var sec = Math.max(1, Math.round(Number(seconds) || 30));
    stopWork(false);
    state.totalSec = sec;
    state.startsAt = Date.now();
    state.endsAt = state.startsAt + sec * 1000;
    state.onComplete = typeof onComplete === 'function' ? onComplete : null;
    state.tickId = global.setInterval(tick, 250);
    tick();
  }

  function stopWork(clearState) {
    if (state.tickId) global.clearInterval(state.tickId);
    state.tickId = null;
    if (clearState !== false) {
      state.startsAt = null;
      state.endsAt = null;
      state.onComplete = null;
    }
  }

  function finishEarly() {
    completeWork(elapsedSec());
  }

  function skip() {
    finishEarly();
  }

  function show() {}
  function hide() {}

  global.WorkOverlay = {
    render: render,
    tick: tick,
    startWork: startWork,
    stopWork: stopWork,
    show: show,
    hide: hide,
    finishEarly: finishEarly,
    skip: skip,
    remainingSec: remainingSec,
    elapsedSec: elapsedSec,
    isRunning: isRunning,
  };
})(typeof window !== 'undefined' ? window : globalThis);
