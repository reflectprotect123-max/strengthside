/**
 * Shared session chrome — updates sticky brand bar to match mockup (THE · HYBRID / ENGINE).
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
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function ensurePhaseBadge() {
    var doc = global.document;
    if (!doc) return null;
    var existing = doc.getElementById('sessionPhaseBadge');
    if (existing) return existing;
    var right = doc.querySelector('header.top .topright');
    if (!right) return null;
    var el = doc.createElement('div');
    el.id = 'sessionPhaseBadge';
    el.className = 'engine-badge';
    el.hidden = true;
    var clock = doc.getElementById('workoutClock');
    if (clock && clock.parentNode === right) right.insertBefore(el, clock);
    else right.insertBefore(el, right.firstChild);
    return el;
  }

  function applyBrand(opts) {
    opts = opts || {};
    var product = opts.product === 'engine' ? 'engine' : 'strength';
    var brandB = global.document && global.document.querySelector('.brand b');
    var brandSmall = global.document && global.document.querySelector('.brand small');
    var mark = global.document && global.document.querySelector('.brand .mark');
    var clock = global.document && global.document.getElementById('workoutClock');
    var chip = global.document && global.document.getElementById('saveStatusChip');
    var top = global.document && global.document.querySelector('header.top');
    var badge = ensurePhaseBadge();
    if (brandB) brandB.textContent = product === 'engine' ? 'ENGINE' : 'HYBRID';
    if (brandSmall) {
      brandSmall.textContent = opts.weekLabel
        ? String(opts.weekLabel)
        : product === 'engine'
          ? 'Intervals'
          : 'Strength';
    }
    if (mark) {
      mark.style.borderColor = product === 'engine' ? 'var(--zone)' : 'var(--gold)';
      mark.style.color = product === 'engine' ? 'var(--zone)' : 'var(--gold2)';
    }
    if (top) top.classList.toggle('dial-engine', product === 'engine');
    if (top) top.classList.toggle('dial-strength', product === 'strength');
    if (clock && opts.elapsedSec != null) {
      clock.textContent = fmtElapsed(opts.elapsedSec);
      clock.classList.add('show');
    }
    if (badge) {
      var label = opts.badge != null && opts.badge !== '' ? String(opts.badge) : '';
      if (label) {
        badge.hidden = false;
        badge.textContent = label;
        badge.classList.toggle('dial-engine', product === 'engine');
        badge.classList.toggle('dial-strength', product === 'strength');
      } else {
        badge.hidden = true;
        badge.textContent = '';
      }
    }
    if (chip) chip.style.display = 'none';
  }

  function resetBrand() {
    var brandB = global.document && global.document.querySelector('.brand b');
    var brandSmall = global.document && global.document.querySelector('.brand small');
    var mark = global.document && global.document.querySelector('.brand .mark');
    var chip = global.document && global.document.getElementById('saveStatusChip');
    var top = global.document && global.document.querySelector('header.top');
    var badge = global.document && global.document.getElementById('sessionPhaseBadge');
    if (brandB) brandB.textContent = 'THE Hybrid';
    if (brandSmall) brandSmall.textContent = 'Track Dawn · Athlete';
    if (mark) {
      mark.style.borderColor = '';
      mark.style.color = '';
    }
    if (top) {
      top.classList.remove('dial-engine', 'dial-strength');
    }
    if (badge) {
      badge.hidden = true;
      badge.textContent = '';
      badge.classList.remove('dial-engine', 'dial-strength');
    }
    if (chip) chip.style.display = '';
  }

  /** Inline header used when sticky bar is unavailable (smoke / tests). */
  function render(opts) {
    opts = opts || {};
    var product = opts.product === 'engine' ? 'engine' : 'strength';
    var dialClass = product === 'engine' ? 'dial-engine' : 'dial-strength';
    var title = product === 'engine' ? 'ENGINE' : 'HYBRID';
    var week = opts.weekLabel || (product === 'engine' ? 'Intervals' : 'Strength');
    return (
      '<div class="session-chrome ' +
      dialClass +
      '"><div class=brand><div class=mark>THE</div><div><b>' +
      title +
      '</b><small>' +
      escHtml(week) +
      '</small></div></div><div class=stopwatch show>' +
      fmtElapsed(opts.elapsedSec) +
      '</div></div>'
    );
  }

  global.SessionChrome = {
    render: render,
    applyBrand: applyBrand,
    resetBrand: resetBrand,
    fmtElapsed: fmtElapsed,
  };
})(typeof window !== 'undefined' ? window : globalThis);
