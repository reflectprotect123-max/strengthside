/** Capgo updates download without interrupting a strength session. */
(function (root) {
  const listeners = new Set();
  let info = { status: '', current: '', next: '' }, pending, checking;
  function isNative() { try { return !!root.Capacitor?.isNativePlatform?.(); } catch { return false; } }
  function plugin() { const cap = root.Capacitor; return isNative() ? (cap.registerPlugin ? cap.registerPlugin('CapacitorUpdater') : cap.Plugins?.CapacitorUpdater) : null; }
  function emit(next) { info = { ...info, ...next }; for (const fn of listeners) fn({ ...info }); return { ...info }; }
  function newer(a, b) {
    const parse = v => /^(?:strength-brain-v)?(\d+)\.(\d+)\.(\d+)$/.exec(v || '')?.slice(1).map(Number);
    const av = parse(a), bv = parse(b); if (!av || !bv) return false;
    for (let i = 0; i < 3; i++) { if (av[i] !== bv[i]) return av[i] > bv[i]; } return false;
  }
  async function queue(bundle) {
    const p = plugin(); if (!p || !bundle?.id) return;
    if (!newer(bundle.version, info.current || '1.3.1')) return emit({ status: 'current', message: 'Your app is up to date.' });
    await p.setMultiDelay({ delayConditions: [{ kind: 'kill' }] });
    await p.next({ id: bundle.id }); pending = bundle;
    return emit({ status: 'ready', next: bundle.version, message: 'Update ready. Restart now; your workout will be saved.' });
  }
  async function probeLiveUpdate(options = {}) {
    if (!isNative()) return emit({ status: 'browser', message: 'Updates are available in the installed APK.' });
    const p = plugin(); if (!p) return emit({ status: 'error', message: 'Update service unavailable. Try reopening the app.' });
    if (checking) return checking;
    if (pending) return { ...info };
    if (!options.refresh) return { ...info };
    checking = (async () => {
      emit({ status: 'checking', message: 'Checking for updates…' });
      try {
        const current = await p.current();
        const bundled = root.StrengthRelease.version;
        const installed = current.bundle?.version === 'builtin' ? current.native : current.bundle?.version;
        const floor = newer(installed, bundled) ? installed : bundled;
        emit({ current: floor });
        const latest = await p.getLatest({ channel: 'strength-live' });
        if (latest.kind === 'up_to_date' || latest.error === 'no_new_version_available') return emit({ status: 'current', message: 'Your app is up to date.' });
        if (latest.kind === 'blocked') return emit({ status: 'error', message: 'No compatible live update is available for this APK.' });
        if (latest.error) throw new Error('Update check failed');
        if (latest.breaking || latest.major) return emit({ status: 'error', message: 'This update needs a new APK install.' });
        if (!newer(latest.version, floor) || !latest.url) return emit({ status: 'current', message: 'Your app is up to date.' });
        emit({ status: 'available', latest: latest.version, message: 'Downloading update…' });
        const bundle = await p.download({ url: latest.url, version: latest.version, checksum: latest.checksum, sessionKey: latest.sessionKey });
        return await queue(bundle);
      } catch (_) { return emit({ status: 'error', message: 'Could not check for updates. Check your connection and try again.' }); }
      finally { checking = null; }
    })();
    return checking;
  }
  async function applyLiveUpdate() {
    const updater = plugin();
    if (!pending || !updater) return 'unavailable';
    // Manual restart is explicit: preserve the session instead of requiring completion.
    try {
      if (typeof root.save !== 'function') throw new Error('Save unavailable');
      await root.save();
    } catch (_) {
      emit({ message: 'Could not save your workout. Restart cancelled; try again.' });
      return 'save-error';
    }
    try { await updater.reload(); return 'restarting'; }
    catch (_) { emit({ status: 'error', message: 'Restart failed. Close and reopen the app to apply the update.' }); return 'error'; }
  }
  root.NativeBridge = { isNative, probeLiveUpdate, applyLiveUpdate, queueLiveUpdate: queue,
    onLiveUpdateStatus(fn) { listeners.add(fn); return () => listeners.delete(fn); } };
})(typeof window !== 'undefined' ? window : globalThis);
