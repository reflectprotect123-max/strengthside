/**
 * Shared session chrome — THE HYBRID / THE ENGINE eyebrow + elapsed timer.
 */
(function (global) {
  function escHtml(value) {
    if (typeof global.esc === 'function') return global.esc(value);
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function fmtElapsed(totalSec) {
    var n = Math.max(0, Math.floor(Number(totalSec) || 0));
    var m = Math.floor(n / 60);
    var s = n % 60;
    return m + ':' + String(s).padStart(2, '0');
  }

  function render(opts) {
    opts = opts || {};
    var product = opts.product === 'engine' ? 'engine' : 'strength';
    var dialClass = product === 'engine' ? 'dial-engine' : 'dial-strength';
    var eyebrow = product === 'engine' ? 'THE ENGINE' : 'THE HYBRID';
    if (opts.weekLabel) eyebrow += ' · ' + String(opts.weekLabel);
    var title = escHtml(opts.title || '');
    var subtitle = opts.subtitle ? escHtml(opts.subtitle) : '';
    var elapsed = fmtElapsed(opts.elapsedSec);
    return (
      '<div class="session-chrome ' +
      dialClass +
      '">' +
      '<div><div class=session-chrome-eyebrow>' +
      escHtml(eyebrow) +
      '</div>' +
      (title ? '<div class=session-chrome-title>' + title + '</div>' : '') +
      (subtitle ? '<div class=session-chrome-sub>' + subtitle + '</div>' : '') +
      '</div>' +
      '<div class=session-chrome-elapsed aria-label="Session elapsed">' +
      elapsed +
      '</div></div>'
    );
  }

  global.SessionChrome = { render: render, fmtElapsed: fmtElapsed };
})(typeof window !== 'undefined' ? window : globalThis);
