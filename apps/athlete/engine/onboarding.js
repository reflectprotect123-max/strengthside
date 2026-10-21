/* Installs fitness-onboarding-v2 on top of the imported Engine page. */
(function (win) {
  const rules = win.EngineOnboardingRules;
  const zonesApi = win.EngineZones;
  const previous = win.EngineOnboarding;
  if (!rules || !zonesApi || !previous || typeof win.render !== 'function') return;

  const baseProfile = zonesApi.profile.bind(zonesApi);
  zonesApi.profile = function profile(state, date) {
    const raw = baseProfile(state, date);
    const fitness = state?.settings?.fitnessProfile?.cardioFitness;
    const fractions = rules.zoneFractions(fitness);
    if (!raw || raw.mode === 'custom' || !fractions) return raw;
    const next = zonesApi.karvonen(raw.max, raw.resting, { ...zonesApi.CONFIG, ...fractions, version: fractions.version });
    if (!next) return raw;
    return { ...raw, ...next, fitnessZones: fitness, evidenceLabel: 'STRENGTHSIDE-DESIGNED' };
  };

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const labels = { low: 'Low', moderate: 'Moderate', high: 'High', maintain: 'Maintain cardio', improve: 'Improve cardio', female: 'Female', male: 'Male' };
  let opened = false;
  let index = 0;
  let draft = null;
  let flow = [];
  let message = '';
  let owner = null;

  function restingNumber(state, date, source) {
    if (source?.restingMode === 'manual') return source.restingHR;
    const observed = zonesApi.restingBaseline(state, date).resting;
    return typeof observed === 'number' ? observed : null;
  }

  function rememberWeek(state, date, profile, resting) {
    const target = rules.weeklyTarget({
      fitness: profile.cardioFitness,
      goal: profile.goal,
      resting,
      weekStart: rules.monday(date),
    });
    if (!target) return;
    state.weeklyTargetHistory = rules.putWeekTarget(state.weeklyTargetHistory, target);
  }

  function input(key, label, min, max, value) {
    return `<label>${label}<input autofocus aria-label="${label}" type="number" min="${min}" max="${max}" step="1" value="${esc(value ?? '')}" oninput="EngineOnboarding.value('${key}',this.value)"></label>`;
  }
  function choices(key, items) {
    return `<div class="onboarding-choices">${items.map(([value, title, description]) => `<button type="button" aria-pressed="${draft[key] === value}" onclick="EngineOnboarding.pick('${key}','${value}')"><b>${title}</b><span>${description}</span></button>`).join('')}</div>`;
  }
  function question() {
    const observed = zonesApi.restingBaseline(win.S, win.today());
    switch (flow[index]) {
      case 'age':
        return `<h2>How old are you?</h2><p>Your age is the starting point for maximum heart rate.</p>${input('age', 'Age in years', 18, 100, draft.age)}`;
      case 'sex':
        return `<h2>Which estimate should we use?</h2><p>Female uses 206 − 0.88 × age. Male uses 208 − 0.7 × age.</p>${choices('sex', [
          ['female', 'Female', 'Gulati 2010 estimate.'],
          ['male', 'Male', 'Tanaka 2001 estimate.'],
        ])}`;
      case 'fitness':
        return `<h2>How is your cardio fitness?</h2><p>This sets your starting Blue, Green, and Red lines at full recovery.</p>${choices('fitness', [
          ['low', 'Low · Building a base', 'Starting lines sit lower, so Green and Red are easier to reach.'],
          ['moderate', 'Moderate · Training regularly', 'Uses the standard 50, 70, and 85 percent lines.'],
          ['high', 'High · Well conditioned', 'Starting lines sit higher.'],
        ])}`;
      case 'goal':
        return `<h2>What’s your cardio goal?</h2><p>This sets the first week of Blue, Green, and Red minutes.</p>${choices('goal', [
          ['maintain', 'Maintain cardio', 'Keep conditioning while other training comes first.'],
          ['improve', 'Improve cardio', 'A larger first week of aerobic work.'],
        ])}`;
      case 'maximum': {
        const estimate = rules.estimatedMaximum(draft.age, draft.sex);
        return `<h2>Do you know your maximum HR?</h2>${choices('maximumMode', [
          ['estimated', 'Estimate it for me', 'Use the age estimate as the starting point.'],
          ['known', 'I know my maximum', 'Use a maximum I have measured.'],
        ])}${draft.maximumMode === 'known' ? input('knownMaximum', 'Maximum HR', 1, 300, draft.knownMaximum) : `<p class="onboarding-estimate">Estimated maximum: <b>${estimate} bpm</b></p>`}`;
      }
      case 'resting':
        return `<h2>What’s your resting heart rate?</h2>${observed.resting != null ? choices('restingMode', [
          ['whoop', 'Use WHOOP', `Resting HR average: ${observed.resting.toFixed(1)} bpm.`],
          ['manual', 'Enter it myself', 'Use my own resting heart rate.'],
        ]) : '<p>WHOOP hasn’t supplied resting HR yet. Enter a resting measurement to calculate your zones.</p>'}${draft.restingMode === 'manual' || observed.resting == null ? input('restingHR', 'Resting HR', 1, 299, draft.restingHR) : ''}`;
      case 'review': {
        const value = reviewValue();
        if (value.error) return `<h2>Check your answers</h2><p>${esc(value.error)}</p>`;
        const zone = value.baseline;
        const week = value.week;
        const ranges = ['Blue', 'Green', 'Red'].map((name) => `${name} ${week.zones[name][0]}–${week.zones[name][1]} min`).join(' · ');
        return `<h2>You’re ready to train</h2><dl><div><dt>Estimate</dt><dd>${labels[draft.sex]}</dd></div><div><dt>Cardio fitness</dt><dd>${labels[draft.fitness]}</dd></div><div><dt>Goal</dt><dd>${labels[draft.goal]}</dd></div><div><dt>Maximum HR</dt><dd>${zone.max} bpm · ${draft.maximumMode === 'known' ? 'Entered' : 'Estimated'}</dd></div><div><dt>Resting HR</dt><dd>${zone.resting.toFixed(1)} bpm</dd></div></dl><div class="onboarding-zone-summary"><p><span>Blue</span><b>${zone.blue}</b></p><p><span>Green</span><b>${zone.green}</b></p><p><span>Red</span><b>${zone.red}</b></p></div><p>First week · ${esc(ranges)}. Today’s recovery can still move Green and Red after this.</p>`;
      }
      default:
        return '';
    }
  }
  function reviewValue() {
    const stepError = ['age', 'sex', 'fitness', 'goal', 'maximum'].map((step) => rules.error(step, draft)).find(Boolean);
    if (stepError) return { error: stepError };
    const max = draft.maximumMode === 'known' ? draft.knownMaximum : rules.estimatedMaximum(draft.age, draft.sex);
    const manual = draft.restingMode === 'manual';
    const stored = zonesApi.settings(max, manual ? draft.restingHR : null, win.S, win.today());
    if (!stored) return { error: 'Maximum HR must be higher than resting HR. Check both answers.' };
    stored.maxSource = draft.maximumMode === 'known' ? 'entered' : 'age-estimated';
    if (draft.maximumMode === 'estimated') stored.maxEstimate = { age: draft.age, sex: draft.sex, ...rules.maxEquation(draft.sex), unrounded: draft.sex === 'female' ? 206 - 0.88 * draft.age : 208 - 0.7 * draft.age };
    const profile = {
      version: rules.VERSION,
      age: draft.age,
      sex: draft.sex,
      cardioFitness: draft.fitness,
      goal: draft.goal,
      maximumMode: draft.maximumMode,
      maxHR: max,
      maximumSource: stored.maxSource,
      restingMode: draft.restingMode,
      restingHR: manual ? draft.restingHR : null,
      evidenceLabel: 'STRENGTHSIDE-DESIGNED',
    };
    const state = { settings: { liveZones: stored, fitnessProfile: profile }, whoopHistory: win.S.whoopHistory, checkin: win.S.checkin };
    const baseline = zonesApi.profile(state, win.today());
    if (!baseline) return { error: 'Maximum HR must be higher than resting HR. Check both answers.' };
    const week = rules.weeklyTarget({ fitness: profile.cardioFitness, goal: profile.goal, resting: baseline.resting, weekStart: rules.monday(win.today()) });
    return { profile, zones: stored, baseline, week };
  }
  function dialogHtml() {
    return `<dialog id="engineOnboarding" class="engine-onboarding" aria-labelledby="onboardingTitle"><header><span id="onboardingTitle">${win.S.settings.onboarding?.completed ? 'Edit fitness setup' : 'Onboarding'}</span><button type="button" aria-label="Close onboarding" onclick="EngineOnboarding.close()">×</button></header><p class="onboarding-step">${index + 1} of ${flow.length}</p><form onsubmit="EngineOnboarding.next(event)">${question()}<p class="live-warning" role="status">${esc(message)}</p><footer>${index ? '<button type="button" class="method-secondary" onclick="EngineOnboarding.back()">Back</button>' : ''}<button class="method-load" type="submit">${flow[index] === 'review' ? 'Finish' : 'Next'}</button></footer></form></dialog>`;
  }
  function close() {
    opened = false;
    draft = null;
    message = '';
    win.render();
    win.document.getElementById(win.S.settings.onboarding?.completed ? 'editFitnessProfile' : 'onboardingStart')?.focus();
  }
  function candidateHtml() {
    const offer = win.S.settings.maxHrCandidate;
    if (!offer) return '';
    return `<section class="pg-card"><h2>Maximum heart rate</h2><p>A workout reached ${offer.bpm} bpm twice, above your estimate of ${offer.previousMax}.</p><button type="button" class="method-load" onclick="EngineOnboarding.useObservedMax()">Use ${offer.bpm}</button><button type="button" class="method-secondary" onclick="EngineOnboarding.keepEstimate()">Keep ${offer.previousMax}</button></section>`;
  }
  function settingsHtml() {
    const done = win.S.settings.onboarding?.completed;
    const profile = win.S.settings.fitnessProfile;
    const summary = done ? `${esc(labels[profile?.sex] || '')} · ${esc(labels[profile?.cardioFitness] || 'Fitness setup saved')} · ${esc(labels[profile?.goal] || '')}` : 'Answer a few questions to set your zones and the first week of targets.';
    return `${candidateHtml()}<section class="pg-card onboarding-card"><h2>Onboarding</h2><button id="onboardingStart" class="method-secondary" ${done ? 'disabled aria-label="Onboarding completed"' : 'onclick="EngineOnboarding.open()"'}>${done ? 'Completed' : 'Start onboarding'}</button><p class="pg-muted">${summary}</p>${done ? '<button id="editFitnessProfile" class="method-secondary" onclick="EngineOnboarding.open(true)">Edit fitness setup</button>' : ''}</section>`;
  }

  win.EngineOnboarding = {
    settingsHtml,
    close,
    open(edit = false) {
      if (win.S.settings.onboarding?.completed && !edit) return;
      const saved = win.S.settings.fitnessProfile || {};
      const stored = win.S.settings.liveZones || {};
      const observed = zonesApi.restingBaseline(win.S, win.today());
      owner = win.S.accountId || null;
      draft = {
        age: saved.age ?? null,
        sex: saved.sex ?? null,
        fitness: saved.cardioFitness ?? null,
        goal: saved.goal ?? null,
        maximumMode: stored.maxSource === 'entered' || stored.maxSource === 'workout-confirmed' ? 'known' : 'estimated',
        knownMaximum: stored.max ?? saved.maxHR ?? null,
        restingMode: observed.resting == null || stored.restingMode === 'manual' ? 'manual' : 'whoop',
        restingHR: stored.resting ?? saved.restingHR ?? null,
      };
      index = 0;
      message = '';
      flow = ['age', 'sex', 'fitness', 'goal', 'maximum'];
      if (draft.restingMode === 'manual') flow.push('resting');
      flow.push('review');
      opened = true;
      win.render();
    },
    value(key, value) {
      draft[key] = String(value).trim() === '' ? null : Number(value);
    },
    pick(key, value) {
      draft[key] = value;
      message = '';
      win.render();
      win.document.querySelector('#engineOnboarding [aria-pressed="true"]')?.focus();
    },
    back() {
      if (!index) return;
      index -= 1;
      message = '';
      win.render();
    },
    next(event) {
      event.preventDefault();
      if (!opened) return;
      if ((win.S.accountId || null) !== owner) { close(); return; }
      if (flow[index] === 'review') {
        const value = reviewValue();
        if (value.error) { message = value.error; win.render(); return; }
        win.S.settings.fitnessProfile = value.profile;
        win.S.settings.liveZones = value.zones;
        win.S.settings.onboarding = { version: rules.VERSION, completed: true, completedAt: win.S.settings.onboarding?.completedAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
        rememberWeek(win.S, win.today(), value.profile, value.baseline.resting);
        win.save();
        close();
        return;
      }
      message = rules.error(flow[index], draft) || (flow[index] === 'resting' && restingNumber(win.S, win.today(), draft) == null ? 'Enter your resting heart rate or use available WHOOP data.' : '');
      if (message) { win.render(); return; }
      if (flow[index] === 'maximum' && zonesApi.restingBaseline(win.S, win.today()).resting == null && !flow.includes('resting')) {
        draft.restingMode = 'manual';
        flow.splice(flow.length - 1, 0, 'resting');
      }
      index += 1;
      win.render();
    },
    useObservedMax() {
      const offer = win.S.settings.maxHrCandidate;
      const profile = win.S.settings.fitnessProfile;
      const stored = win.S.settings.liveZones;
      if (!offer || !profile || !stored) return;
      profile.maxHR = offer.bpm;
      profile.maximumSource = 'workout-confirmed';
      profile.maximumMode = 'known';
      stored.max = offer.bpm;
      stored.maxSource = 'workout-confirmed';
      delete win.S.settings.maxHrCandidate;
      win.save();
      win.render();
    },
    keepEstimate() {
      delete win.S.settings.maxHrCandidate;
      win.save();
      win.render();
    },
  };

  if (win.LiveWorkout && typeof win.LiveWorkout.submit === 'function') {
    const submit = win.LiveWorkout.submit.bind(win.LiveWorkout);
    win.LiveWorkout.submit = function submitWorkout() {
      const workout = win.S.liveWorkout;
      const stored = win.S.settings.liveZones;
      const profile = win.S.settings.fitnessProfile;
      if (workout && stored && profile?.maximumSource === 'age-estimated') {
        const candidate = rules.peakCandidate(workout, stored.max);
        if (candidate) win.S.settings.maxHrCandidate = { ...candidate, workoutId: workout.id, at: new Date().toISOString() };
      }
      return submit();
    };
  }

  const saved = win.S?.settings?.fitnessProfile;
  if (saved?.cardioFitness && saved?.goal && typeof win.today === 'function') {
    const resting = restingNumber(win.S, win.today(), { restingMode: win.S.settings.liveZones?.restingMode, restingHR: win.S.settings.liveZones?.resting ?? saved.restingHR });
    rememberWeek(win.S, win.today(), saved, resting);
  }

  const renderEngine = win.render;
  win.render = function render() {
    renderEngine.apply(this, arguments);
    if (!opened) return;
    win.document.getElementById('engineOnboarding')?.remove();
    win.document.body.insertAdjacentHTML('beforeend', dialogHtml());
    const dialog = win.document.getElementById('engineOnboarding');
    dialog.addEventListener('cancel', (event) => { event.preventDefault(); close(); });
    if (typeof dialog.showModal === 'function') dialog.showModal();
    (dialog.querySelector('[autofocus]') || dialog.querySelector('[aria-pressed="true"]') || dialog.querySelector('button[type="submit"]'))?.focus();
  };
  if (win.document.getElementById('app')) win.render();
})(window);
