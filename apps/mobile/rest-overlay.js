/**
 * Rest timer UI — in-flow mockup ring (not corner chip). Used by strength + Engine.
 */
(function (global) {
  var state = { endsAt: null, totalSec: 0, tickId: null, onExpire: null };

  function escHtml(value) {
    if (typeof global.esc === 'function') return global.esc(value);
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function remainingSec(now) {
    if (!state.endsAt) return Math.max(0, state.totalSec || 0);
    return Math.max(0, Math.ceil((state.endsAt - (now || Date.now())) / 1000));
  }

  function render(opts) {
    opts = opts || {};
    var mode = opts.mode === 'engine' ? 'engine' : 'strength';
    var dialClass = mode === 'engine' ? 'dial-engine' : 'dial-strength';
    var remaining = Number.isFinite(opts.remainingSec) ? Math.max(0, opts.remainingSec) : remainingSec();
    var timeLabel = typeof global.fmt === 'function' ? global.fmt(remaining) : remaining + 's';
    var skipLabel = escHtml(opts.skipLabel || 'Skip rest');
    var addLabel = escHtml(opts.addLabel || '+30s');
    var skipOnclick = escHtml(opts.skipOnclick || 'RestOverlay.skipRest()');
    var addOnclick = escHtml(opts.addOnclick || 'RestOverlay.addRest(30)');
    var slider = opts.sliderHtml || '';
    return (
      '<div id=restOverlay class="logger-rest ' +
      dialClass +
      '">' +
      '<div class=rest-ring><div><div class=rest-time id=restOverlayClock>' +
      timeLabel +
      '</div><div class=rest-label>remaining</div></div></div>' +
      (opts.upNextHtml ? '<div class=rest-next>' + opts.upNextHtml + '</div>' : '') +
      slider +
      '<div class=rest-actions>' +
      '<button type=button class="btn" onclick="' +
      addOnclick +
      '">' +
      addLabel +
      '</button>' +
      '<button type=button class="btn primary" onclick="' +
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
    if (rem <= 0) skipRest();
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
    if (clearEnds !== false) {
      state.endsAt = null;
      state.onExpire = null;
    }
  }

  function skipRest() {
    var cb = state.onExpire;
    stopRest();
    if (typeof cb === 'function') cb();
  }

  function addRest(extraSec) {
    var add = Math.max(1, Math.round(Number(extraSec) || 30));
    if (!state.endsAt) state.endsAt = Date.now();
    state.endsAt += add * 1000;
    state.totalSec = (state.totalSec || 0) + add;
    tick();
  }

  function show() {}
  function hide() {}

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
