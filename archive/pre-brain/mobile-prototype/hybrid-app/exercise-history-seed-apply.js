/**
 * Auto-merge bundled exercise history seed on boot.
 * Seeds load hints + title aliases only — never sessions or custom exercises.
 */
(function (global) {
  'use strict';

  function num(v) {
    var n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function mergeTitleAliases(state, incoming) {
    state.meta = state.meta || {};
    var merged = Object.assign(
      {},
      incoming || {},
      state.meta.exerciseTitleAliases || {},
      state.meta.thTitleAliases || {},
    );
    state.meta.exerciseTitleAliases = merged;
    return merged;
  }

  function mergeLoadHints(state, incoming) {
    state.strengthState = state.strengthState || {
      workingMaxEvents: [],
      prEvents: [],
      loadHints: {},
    };
    state.strengthState.loadHints = state.strengthState.loadHints || {};
    var added = 0;
    for (var exerciseId in incoming || {}) {
      if (!Object.prototype.hasOwnProperty.call(incoming, exerciseId)) continue;
      if (state.strengthState.loadHints[exerciseId]) continue;
      var hint = incoming[exerciseId];
      if (!hint || typeof hint !== 'object') continue;
      state.strengthState.loadHints[exerciseId] = {
        loadKg: num(hint.loadKg),
        updatedAt: String(hint.updatedAt || ''),
        source: String(hint.source || 'history_seed'),
      };
      added++;
    }
    return added;
  }

  function applyExerciseHistorySeed(state, seed) {
    if (!state || !seed || !seed.version) {
      return { state: state, applied: false, addedHints: 0 };
    }
    state.meta = state.meta || {};
    var currentVersion = String(state.meta.exerciseHistorySeedVersion || '');
    if (currentVersion && currentVersion === String(seed.version)) {
      return { state: state, applied: false, addedHints: 0 };
    }

    mergeTitleAliases(state, seed.titleAliases || {});
    var addedHints = mergeLoadHints(state, seed.loadHints || {});
    state.meta.exerciseHistorySeedVersion = String(seed.version);
    state.meta.exerciseHistorySeedAt = new Date().toISOString();
    return { state: state, applied: true, addedHints: addedHints };
  }

  function exerciseTitleAliasMap(state) {
    state = state || {};
    state.meta = state.meta || {};
    return Object.assign({}, state.meta.exerciseTitleAliases || {}, state.meta.thTitleAliases || {});
  }

  global.applyExerciseHistorySeed = applyExerciseHistorySeed;
  global.exerciseTitleAliasMap = exerciseTitleAliasMap;
})(typeof window !== 'undefined' ? window : globalThis);
