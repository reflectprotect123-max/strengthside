/* Hallway back to Strength. Loaded last by the imported Engine page; replaces
 * its standalone switchHybridLocker and adds the Strength | Engine switch to
 * Settings. Engine keeps its own storage; nothing here reads or writes it. */
(function (win) {
  function engineState() {
    try { return S; } catch (_) { return win.S; }
  }

  function liveWorkout() {
    const status = engineState()?.liveWorkout?.status;
    return status === 'running' || status === 'paused';
  }

  function switchHtml() {
    return '<section class="pg-card locker-card"><h2>Hybrid S&amp;C</h2>'
      + '<p>One login. Strength and Engine stay in their own lockers.</p>'
      + '<div class="locker-switch" role="group" aria-label="Locker">'
      + '<button type="button" class="method-secondary" aria-pressed="false" onclick="switchHybridLocker(\'strength\')">Strength</button>'
      + '<button type="button" class="method-load" aria-pressed="true" onclick="switchHybridLocker(\'engine\')">Engine</button>'
      + '</div></section>';
  }

  win.switchHybridLocker = async function switchHybridLocker(next) {
    if (next !== 'strength') return;
    if (liveWorkout()) {
      win.alert('Finish or end the workout before switching to Strength.');
      return;
    }
    try {
      if (win.EngineApp && typeof win.EngineApp.flushStorage === 'function') await win.EngineApp.flushStorage();
    } catch (_) {
      /* Engine already saved on its last render; still walk the hallway */
    }
    win.location.assign('../index.html');
  };

  const renderEngine = win.render;
  win.render = function () {
    renderEngine.apply(this, arguments);
    const tab = engineState()?.tab;
    if (tab === 'me' || tab === 'settings') {
      win.document.querySelector('.pg-page h1')?.insertAdjacentHTML('afterend', switchHtml());
    }
  };
})(window);
