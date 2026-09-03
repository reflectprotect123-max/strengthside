/** PARKED 2026-09-03 — coach S&C surface frozen for Autopilot V3 rebuild.
 * No strength/conditioning publish, pull, or engine wiring.
 * See docs/superpowers/specs/2026-09-03-autopilot-clean-rebuild-plan.md
 */
(function (g) {
  'use strict';
  var parked = {
    parked: true,
    reason: 'coach_sc_parked_v3_rebuild',
    isCoachPrescription: function () { return false; },
    schedulePull: function () {},
    schedulePush: function () {},
    pullNow: function () { return Promise.resolve({ parked: true, merged: 0 }); },
    mergeFromBridge: function (state) { return { merged: 0, parked: true }; },
    publish: function () { return Promise.resolve({ parked: true, ok: false }); },
    pushAssigned: function () { return Promise.resolve({ parked: true, ok: false }); },
    markCompleted: function () { return Promise.resolve({ parked: true }); },
    isSignedIn: function () { return Promise.resolve(false); },
    sessionForAthlete: function (s) { return s; },
    enrichSessionWithCoachIntent: function () { return Promise.resolve(null); },
    validateCoachIntent: function () { return null; },
    status: { parked: true },
  };
  g.CoachSync = parked;
  g.CoachCloud = parked;
  g.CoachBridge = parked;
  g.CoachAI = parked;
  g.CoachLoop = g.CoachLoop || parked;
  g.CoachViews = g.CoachViews || parked;
})(typeof window !== 'undefined' ? window : globalThis);
