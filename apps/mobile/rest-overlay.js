/**
 * Full-screen rest overlay — shared by strength + Engine loggers.
 */
(function (global) {
  var state = { endsAt: null, totalSec: 0, tickId: null };

  function escHtml(value) {
    if (typeof global.esc === 'function') return global.esc(value);
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function remainingSec(now) {
    if (!state.endsAt) return 0;
    return Math.max(0, Math.ceil((state.endsAt - (now || Date.now())) / 1000));
  }

  function ringSvg(remaining, total) {
    var r = 46;
    var c = 2 * Math.PI * r;
    var frac = total > 0 ? Math.min(1, remaining / total) : 0;
    var dash = frac * c;
    return (
      '<svg class=rest-ring viewBox="0 0 100 100" aria-hidden=true>' +
      '<circle class=rest-ring-track cx=50 cy=50 r=' +
      r +
      '></circle>' +
      '<circle class=rest-ring-progress cx=50 cy=50 r=' +
      r +
      ' stroke-dasharray="' +
      c +
      '" stroke-dashoffset="' +
      (c - dash) +
      '"></circle></svg>'
    );
  }

  function render(opts) {
    opts = opts || {};
    var mode = opts.mode === 'engine' ? 'engine' : 'strength';
    var dialClass = mode === 'engine' ? 'dial-engine' : 'dial-strength';
    var visible = opts.visible !== false && opts.visible !== undefined ? !!opts.visible : false;
    var remaining = Number.isFinite(opts.remainingSec) ? Math.max(0, opts.remainingSec) : remainingSec();
    var total = Number.isFinite(opts.totalSec) ? Math.max(1, opts.totalSec) : state.totalSec || remaining || 90;
    var phase = escHtml(opts.phaseLabel || (mode === 'engine' ? 'REST' : 'REST · BETWEEN SETS'));
    var summary = opts.summaryHtml != null ? opts.summaryHtml : '';
    var upNext = opts.upNextHtml != null ? opts.upNextHtml : '';
    var skipLabel = escHtml(opts.skipLabel || (mode === 'engine' ? 'Skip rest' : 'Skip rest'));
    var addLabel = escHtml(opts.addLabel || '+30s');
    var skipOnclick = escHtml(opts.skipOnclick || 'RestOverlay.skipRest()');
    var addOnclick = escHtml(opts.addOnclick || 'RestOverlay.addRest(30)');
    var timeLabel = typeof global.fmt === 'function' ? global.fmt(remaining) : remaining + 's';
    return (
      '<div id=restOverlay class="rest-overlay ' +
      dialClass +
      (visible ? '' : ' hidden') +
      '">' +
      '<div class=rest-overlay-phase>' +
      phase +
      '</div>' +
      (summary ? '<div class=rest-overlay-summary>' + summary + '</div>' : '') +
      '<div class=rest-ring-wrap>' +
      ringSvg(remaining, total) +
      '<div class=rest-ring-center><div class=rest-ring-time id=restOverlayClock>' +
      timeLabel +
      '</div><div class=rest-ring-label>remaining</div></div></div>' +
      (upNext ? '<div class=rest-up-next>' + upNext + '</div>' : '') +
      '<div class=rest-overlay-actions>' +
      '<button type=button class="btn block" onclick="' +
      addOnclick +
      '">' +
      addLabel +
      '</button>' +
      '<button type=button class="btn primary block" onclick="' +
      skipOnclick +
      '">' +
      skipLabel +
      '</button></div></div>'
    );
  }

  function tick() {
    var el = global.document && global.document.getElementById('restOverlayClock');
    if (!el) return;
    var rem = remainingSec();
    el.textContent = typeof global.fmt === 'function' ? global.fmt(rem) : rem + 's';
    var overlay = global.document.getElementById('restOverlay');
    if (overlay && rem <= 0 && !overlay.classList.contains('hidden')) {
      skipRest();
    }
  }

  function startRest(seconds, onExpire) {
    var sec = Math.max(1, Math.round(Number(seconds) || 90));
    stopRest(false);
    state.totalSec = sec;
    state.endsAt = Date.now() + sec * 1000;
    state.onExpire = typeof onExpire === 'function' ? onExpire : null;
    state.tickId = global.setInterval(tick, 250);
    tick();
  }

  function stopRest(clearEnds) {
    if (state.tickId) global.clearInterval(state.tickId);
    state.tickId = null;
    if (clearEnds !== false) state.endsAt = null;
  }

  function show() {
    var el = global.document && global.document.getElementById('restOverlay');
    if (el) el.classList.remove('hidden');
  }

  function hide() {
    var el = global.document && global.document.getElementById('restOverlay');
    if (el) el.classList.add('hidden');
  }

  function skipRest() {
    stopRest();
    hide();
    if (typeof state.onExpire === 'function') state.onExpire();
    state.onExpire = null;
  }

  function addRest(extraSec) {
    var add = Math.max(1, Math.round(Number(extraSec) || 30));
    if (!state.endsAt) state.endsAt = Date.now();
    state.endsAt += add * 1000;
    state.totalSec = (state.totalSec || 0) + add;
    tick();
  }

  global.RestOverlay = {
    render: render,
    tick: tick,
    startRest: startRest,
    stopRest: stopRest,
    show: show,
    hide: hide,
    skipRest: skipRest,
    addRest: addRest,
    remainingSec: remainingSec,
  };
})(typeof window !== 'undefined' ? window : globalThis);
