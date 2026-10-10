/** Download live updates without reloading an open workout. */
(async function () {
  const cap = window.Capacitor;
  if (!cap?.isNativePlatform?.()) return;
  const updater = cap.registerPlugin ? cap.registerPlugin('CapacitorUpdater') : cap.Plugins?.CapacitorUpdater;
  if (!updater) return;
  try {
    await updater.addListener('updateAvailable', async ({ bundle }) => {
      if (!bundle?.id) return;
      try {
        await updater.setMultiDelay({ delayConditions: [{ kind: 'kill' }] });
        await updater.next({ id: bundle.id });
      } catch (error) { console.warn('Live update scheduling failed', error); }
    });
    // A bundle is healthy only after the strength UI has rendered.
    const app = document.getElementById('app');
    if (!app) throw new Error('Strength UI root missing');
    if (!app.children.length) await new Promise((resolve, reject) => {
      const observer = new MutationObserver(() => {
        if (app.children.length) { clearTimeout(timeout); observer.disconnect(); resolve(); }
      });
      const timeout = setTimeout(() => { observer.disconnect(); reject(new Error('Strength UI did not render')); }, 25000);
      observer.observe(app, { childList: true });
    });
    await updater.notifyAppReady();
  } catch (error) { console.warn('Live update initialization failed', error); }
})();
