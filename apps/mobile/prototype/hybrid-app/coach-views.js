/**
 * Coach V1 views — calendars, roster, assign, nutrition UI.
 * Initialized from coach.html after domain state is ready.
 */
(function (root) {
  'use strict';

  var ctx = {};

  function C() {
    return ctx;
  }

  function esc(s) {
    return ctx.esc(s);
  }

  function persist() {
    ctx.persist();
    if (root.CoachBridge && root.CoachBridge.push) {
      root.CoachBridge.push(ctx.S);
    }
  }

  function pushBridge() {
    if (root.CoachBridge) root.CoachBridge.push(ctx.S);
  }

  function L() {
    return ctx.L;
  }

  function S() {
    return ctx.S;
  }

  function ui() {
    return ctx.ui;
  }

  function monthKey() {
    return ui().calMonth || L().today().slice(0, 7);
  }

  function setMonth(k) {
    ui().calMonth = k;
    ctx.render();
  }

  function shiftCalMonth(delta) {
    ui().calMonth = L().shiftMonth(monthKey(), delta);
    ctx.render();
  }

  /* ---------- Assign ---------- */

  function assignHtml() {
    var p = ctx.prog(ui().programId);
    if (!p) {
      return (
        '<div class="card muted">Pick a program from Library → Programs, then Assign.</div>' +
        '<button type="button" class="btn" onclick="go(\'library\',{lib:\'programs\'})">Go to programs</button>'
      );
    }
    var teams = (S().teams || [])
      .map(function (t) {
        var sel = ui().assignTeamId === t.id ? ' selected' : '';
        return (
          '<option value="' +
          esc(t.id) +
          '"' +
          sel +
          '>' +
          esc(t.name) +
          ' (' +
          (t.athleteIds || []).length +
          ')</option>'
        );
      })
      .join('');
    var start = ui().assignStart || L().mondayOf(L().today());
    return (
      '<button type="button" class="btn ghost small" onclick="go(\'library\',{lib:\'programs\'})">← Back</button>' +
      '<div class="builder-top" style="margin-top:12px"><h1 style="font-family:var(--font-display);font-size:28px">Assign · ' +
      esc(p.name) +
      '</h1></div>' +
      '<div class="card stack">' +
      '<div class="field"><label>Team</label><select onchange="ui.assignTeamId=this.value;render()">' +
      teams +
      '</select></div>' +
      '<div class="field"><label>Start week (Monday)</label><input type="date" value="' +
      esc(start) +
      '" onchange="ui.assignStart=this.value;persist()"></div>' +
      '<p class="muted">Stamps program cells onto each athlete calendar as <b>unpublished</b> sessions. Publish from the team or athlete calendar.</p>' +
      '<button type="button" class="btn primary block" onclick="CoachViews.confirmAssign()">Assign program</button></div>'
    );
  }

  function confirmAssign() {
    var p = ctx.prog(ui().programId);
    if (!p) return;
    var teamId = ui().assignTeamId || (S().teams[0] && S().teams[0].id);
    try {
      L().assignProgram(S(), {
        programId: p.id,
        teamId: teamId,
        startDate: ui().assignStart || L().mondayOf(L().today()),
      });
      persist();
      ui().view = 'team';
      ui().teamId = teamId;
      ui().calMonth = (ui().assignStart || L().today()).slice(0, 7);
      ctx.render();
    } catch (e) {
      alert(String(e.message || e));
    }
  }

  /* ---------- Roster ---------- */

  function athleteListHtml() {
    var rows = (S().athletes || [])
      .map(function (a) {
        return (
          '<tr><td><button type="button" class="linkish" onclick="go(\'athlete\',{athleteId:\'' +
          a.id +
          '\'})">' +
          esc(a.name) +
          '</button></td><td><span class="pill">Coach Plan</span></td><td class="muted">' +
          esc((function () {
            var tm = (S().teams || []).find(function (t) {
              return (t.athleteIds || []).indexOf(a.id) >= 0;
            });
            return (tm && tm.name) || '—';
          })()) +
          '</td><td><button type="button" class="btn small" onclick="go(\'athlete\',{athleteId:\'' +
          a.id +
          '\'})">Calendar</button></td></tr>'
        );
      })
      .join('');
    return (
      '<div class="row" style="margin-bottom:16px"><p class="muted">Roster — open an athlete calendar to publish sessions.</p></div>' +
      '<div class="card" style="overflow-x:auto"><table class="roster-table"><thead><tr><th>Athlete</th><th>Type</th><th>Team</th><th>Actions</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="4" class="muted">No athletes</td></tr>') +
      '</tbody></table></div>'
    );
  }

  function teamListHtml() {
    var rows = (S().teams || [])
      .map(function (t) {
        return (
          '<tr><td><button type="button" class="linkish" onclick="go(\'team\',{teamId:\'' +
          t.id +
          '\'})">' +
          esc(t.name) +
          '</button></td><td class="muted">' +
          (t.athleteIds || []).length +
          '</td><td><button type="button" class="btn small" onclick="go(\'team\',{teamId:\'' +
          t.id +
          '\'})">Calendar</button></td></tr>'
        );
      })
      .join('');
    return (
      '<div class="row" style="margin-bottom:16px"><button type="button" class="btn primary small" onclick="CoachViews.openCreateTeam()">Create team</button></div>' +
      '<div class="card" style="overflow-x:auto"><table class="roster-table"><thead><tr><th>Team</th><th>Athletes</th><th>Actions</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="3" class="muted">No teams</td></tr>') +
      '</tbody></table></div>'
    );
  }

  function openCreateTeam() {
    var name = prompt('Team name');
    if (!name || !String(name).trim()) return;
    S().teams.push({
      id: L().uid('team'),
      name: String(name).trim(),
      athleteIds: (S().athletes || []).map(function (a) {
        return a.id;
      }),
    });
    persist();
    ctx.render();
  }

  /* ---------- Calendar shared ---------- */

  function chipMenu(sessionId) {
    var m = ui().chipMenu;
    if (!m || m.id !== sessionId) return '';
    return (
      '<div class="kebab-menu" role="menu">' +
      '<button type="button" onclick="CoachViews.publishChip(\'' +
      sessionId +
      '\')">Publish</button>' +
      '<button type="button" onclick="CoachViews.unpublishChip(\'' +
      sessionId +
      '\')">Unpublish</button>' +
      '<button type="button" onclick="CoachViews.deleteChip(\'' +
      sessionId +
      '\')">Delete</button>' +
      '</div>'
    );
  }

  function sessionChip(s) {
    var pub = s.published ? 'published' : 'unpublished';
    var title = s.sessionTitle || s.name;
    var menuOpen = ui().chipMenu && ui().chipMenu.id === s.id;
    return (
      '<div class="cal-chip ' +
      pub +
      '">' +
      '<div class="cal-chip-top">' +
      '<span class="cal-chip-title">' +
      esc(title) +
      '</span>' +
      '<button type="button" class="kebab-btn" onclick="CoachViews.toggleChipMenu(\'' +
      s.id +
      '\',event)">⋯</button></div>' +
      '<div class="cal-chip-meta">' +
      esc(s.name) +
      ' · <span class="pill">' +
      (s.published ? 'Published' : 'Unpublished') +
      '</span></div>' +
      chipMenu(s.id) +
      '</div>'
    );
  }

  function toggleChipMenu(id, ev) {
    if (ev) ev.stopPropagation();
    var cur = ui().chipMenu;
    ui().chipMenu = cur && cur.id === id ? null : { id: id };
    ctx.render();
  }

  function publishChip(id) {
    var s = ctx.ses(id);
    if (s) L().publishSession(s);
    ui().chipMenu = null;
    persist();
    ctx.render();
  }

  function unpublishChip(id) {
    var s = ctx.ses(id);
    if (s) L().unpublishSession(s);
    ui().chipMenu = null;
    persist();
    ctx.render();
  }

  function deleteChip(id) {
    S().sessions = (S().sessions || []).filter(function (x) {
      return x.id !== id;
    });
    ui().chipMenu = null;
    persist();
    ctx.render();
  }

  function publishAllForSessions(list) {
    L().publishAllSessions(list);
    persist();
    ctx.render();
  }

  function calDayCell(date, sessions, athleteId) {
    var expanded = ui().calDay === date;
    var chips = sessions.map(sessionChip).join('');
    var empty =
      !sessions.length && expanded
        ? '<div class="cal-empty-actions"><button type="button" class="btn small" onclick="CoachViews.openAddFromLibrary(\'' +
          date +
          "','" +
          athleteId +
          '\')">Add from library</button></div>'
        : '';
    return (
      '<div class="cal-day' +
      (expanded ? ' expanded' : '') +
      '">' +
      '<button type="button" class="cal-day-num" onclick="CoachViews.toggleCalDay(\'' +
      date +
      '\')">' +
      esc(String(Number(date.slice(8)))) +
      '</button>' +
      '<div class="cal-day-body">' +
      chips +
      empty +
      '</div></div>'
    );
  }

  function toggleCalDay(date) {
    ui().calDay = ui().calDay === date ? null : date;
    ctx.render();
  }

  function openAddFromLibrary(date, athleteId) {
    ui().libPick = { date: date, athleteId: athleteId };
    ctx.render();
  }

  function pickLibraryTemplate(tid) {
    var pick = ui().libPick;
    if (!pick) return;
    L().addCalendarSession(S(), {
      athleteId: pick.athleteId,
      date: pick.date,
      templateId: tid,
    });
    ui().libPick = null;
    persist();
    ctx.render();
  }

  function libraryPickOverlay() {
    var pick = ui().libPick;
    if (!pick) return '';
    var list = (S().templates || [])
      .map(function (t) {
        return (
          '<button type="button" class="picker-item" onclick="CoachViews.pickLibraryTemplate(\'' +
          t.id +
          '\')"><span>' +
          esc(t.name) +
          '</span></button>'
        );
      })
      .join('');
    return (
      '<div class="picker-overlay" onclick="if(event.target===this)ui.libPick=null;render()">' +
      '<div class="picker-panel"><div class="row"><b>Add from library</b><button type="button" class="btn ghost small" onclick="ui.libPick=null;render()">Close</button></div>' +
      '<p class="muted">' +
      esc(pick.date) +
      '</p><div class="picker-list">' +
      list +
      '</div></div></div>'
    );
  }

  function calendarShell(title, backView, backExtra, sessions, athleteId) {
    var mk = monthKey();
    var days = L().monthDays(mk);
    var canPublish = L().hasUnpublished(sessions);
    var cells = days
      .map(function (d) {
        var daySessions = sessions.filter(function (s) {
          return s.date === d;
        });
        return calDayCell(d, daySessions, athleteId);
      })
      .join('');
    var dow = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      .map(function (d) {
        return '<div class="cal-dow">' + d + '</div>';
      })
      .join('');
    return (
      '<button type="button" class="btn ghost small" onclick="go(\'' +
      backView +
      "'" +
      (backExtra ? ',' + backExtra : '') +
      ')">← Back</button>' +
      '<div class="cal-toolbar">' +
      '<div><h1 style="font-family:var(--font-display);font-size:24px;margin-top:8px">' +
      esc(title) +
      '</h1><div class="muted">' +
      esc(L().monthLabel(mk)) +
      '</div></div>' +
      '<div class="row" style="gap:8px;flex-wrap:wrap">' +
      '<button type="button" class="btn small" onclick="CoachViews.shiftCalMonth(-1)">‹</button>' +
      '<button type="button" class="btn small" onclick="CoachViews.shiftCalMonth(1)">›</button>' +
      '<button type="button" class="btn primary small"' +
      (canPublish ? '' : ' disabled') +
      ' onclick="CoachViews.publishAllVisible()">Publish all</button></div></div>' +
      '<div class="cal-month"><div class="cal-dow-row">' +
      dow +
      '</div><div class="cal-grid">' +
      cells +
      '</div></div>' +
      libraryPickOverlay()
    );
  }

  function publishAllVisible() {
    var view = ui().view;
    var list = [];
    if (view === 'athlete' && ui().athleteId) {
      list = L().calendarFor(S(), ui().athleteId, monthKey());
    } else if (view === 'team' && ui().teamId) {
      list = L().teamCalendar(S(), ui().teamId, monthKey());
    }
    publishAllForSessions(list.filter(function (s) {
      return !s.published;
    }));
  }

  function athleteCalHtml() {
    var a = ctx.athleteBy(ui().athleteId);
    if (!a) return athleteListHtml();
    var sessions = L().calendarFor(S(), a.id, monthKey());
    return calendarShell(a.name, 'athletes', '', sessions, a.id);
  }

  function teamCalHtml() {
    var t = ctx.team(ui().teamId);
    if (!t) return teamListHtml();
    var sessions = L().teamCalendar(S(), t.id, monthKey());
    return calendarShell(t.name, 'teams', '', sessions, (t.athleteIds || [])[0] || '');
  }

  /* ---------- Nutrition N1–N3 ---------- */

  function nutritionHtml() {
    var N = root.CoachNutrition;
    if (!N) return '<div class="card muted">Nutrition module missing.</div>';
    var nut = N.ensureNutrition(S());
    var athletes = S().athletes || [];
    var aid = ui().nutAthleteId || (athletes[0] && athletes[0].id);
    var a = ctx.athleteBy(aid);
    var resolved = N.resolveActiveTargets(nut.targetsByAthlete[aid], null);
    var t = resolved.active;
    var opts = athletes
      .map(function (x) {
        return (
          '<option value="' +
          x.id +
          '"' +
          (x.id === aid ? ' selected' : '') +
          '>' +
          esc(x.name) +
          '</option>'
        );
      })
      .join('');
    var targets = t
      ? '<div class="card"><div class="eyebrow">Active targets</div><div class="metrics" style="grid-template-columns:repeat(4,1fr);margin-top:10px">' +
        '<div class="metric"><b>' +
        t.calories +
        '</b><span>kcal</span></div>' +
        '<div class="metric"><b>' +
        t.proteinG +
        'g</b><span>Protein</span></div>' +
        '<div class="metric"><b>' +
        t.carbsG +
        'g</b><span>Carbs</span></div>' +
        '<div class="metric"><b>' +
        t.fatG +
        'g</b><span>Fat</span></div></div>' +
        '<p class="muted" style="margin-top:8px">Source: ' +
        esc(resolved.reason) +
        '</p></div>'
      : '<div class="card muted">No targets set — use override below.</div>';
    return (
      '<div class="row" style="margin-bottom:16px"><div><div class="eyebrow">Nutrition</div><h1 style="font-family:var(--font-display);font-size:28px">Coach targets & meals</h1></div></div>' +
      '<div class="field"><label>Athlete</label><select onchange="ui.nutAthleteId=this.value;render()">' +
      opts +
      '</select></div>' +
      targets +
      '<div class="card stack" style="margin-top:16px"><div class="eyebrow">Override macros</div>' +
      '<div class="rx-grid"><div class="field"><label>kcal</label><input id="nutKcal" type="number" value="' +
      esc((t && t.calories) || 2800) +
      '"></div>' +
      '<div class="field"><label>Protein (g)</label><input id="nutP" type="number" value="' +
      esc((t && t.proteinG) || 180) +
      '"></div>' +
      '<div class="field"><label>Carbs (g)</label><input id="nutC" type="number" value="' +
      esc((t && t.carbsG) || 300) +
      '"></div>' +
      '<div class="field"><label>Fat (g)</label><input id="nutF" type="number" value="' +
      esc((t && t.fatG) || 80) +
      '"></div></div>' +
      '<button type="button" class="btn primary" onclick="CoachViews.saveNutOverride()">Save override</button>' +
      '<button type="button" class="btn small" onclick="CoachViews.clearNutOverride()">Clear override</button></div>' +
      '<div class="card stack" style="margin-top:16px"><div class="eyebrow">Meal day · ' +
      esc(L().today()) +
      '</div>' +
      '<div class="field"><label>Meal title</label><input id="nutMealTitle" value="Training day"></div>' +
      '<div class="field"><label>Food line</label><input id="nutFoodLine" placeholder="Chicken breast · 200g"></div>' +
      '<button type="button" class="btn" onclick="CoachViews.addMealDay()">Add meal & publish day</button></div>'
    );
  }

  function saveNutOverride() {
    var N = root.CoachNutrition;
    var aid = ui().nutAthleteId || S().athletes[0].id;
    var el = function (id) {
      return document.getElementById(id);
    };
    N.setCoachOverride(N.ensureNutrition(S()), aid, {
      calories: Number(el('nutKcal') && el('nutKcal').value) || 0,
      proteinG: Number(el('nutP') && el('nutP').value) || 0,
      carbsG: Number(el('nutC') && el('nutC').value) || 0,
      fatG: Number(el('nutF') && el('nutF').value) || 0,
    });
    persist();
    ctx.render();
  }

  function clearNutOverride() {
    var N = root.CoachNutrition;
    var aid = ui().nutAthleteId || S().athletes[0].id;
    N.clearCoachOverride(N.ensureNutrition(S()), aid);
    persist();
    ctx.render();
  }

  function addMealDay() {
    var N = root.CoachNutrition;
    var aid = ui().nutAthleteId || S().athletes[0].id;
    var titleEl = document.getElementById('nutMealTitle');
    var foodEl = document.getElementById('nutFoodLine');
    var day = N.makeMealDay({
      athleteId: aid,
      date: L().today(),
      meals: [
        N.makeMeal({
          title: (titleEl && titleEl.value) || 'Meal',
          items: [
            N.makeMealItem({
              name: (foodEl && foodEl.value) || 'Food',
            }),
          ],
        }),
      ],
    });
    N.publishMealDay(day);
    N.upsertMealDay(N.ensureNutrition(S()), day);
    persist();
    ctx.render();
  }

  function init(context) {
    ctx = context;
  }

  function bindState(state) {
    ctx.S = state;
  }

  root.CoachViews = {
    init: init,
    bindState: bindState,
    assignHtml: assignHtml,
    confirmAssign: confirmAssign,
    athleteListHtml: athleteListHtml,
    teamListHtml: teamListHtml,
    athleteCalHtml: athleteCalHtml,
    teamCalHtml: teamCalHtml,
    nutritionHtml: nutritionHtml,
    openCreateTeam: openCreateTeam,
    toggleChipMenu: toggleChipMenu,
    publishChip: publishChip,
    unpublishChip: unpublishChip,
    deleteChip: deleteChip,
    publishAllVisible: publishAllVisible,
    shiftCalMonth: shiftCalMonth,
    toggleCalDay: toggleCalDay,
    openAddFromLibrary: openAddFromLibrary,
    pickLibraryTemplate: pickLibraryTemplate,
    saveNutOverride: saveNutOverride,
    clearNutOverride: clearNutOverride,
    addMealDay: addMealDay,
    pushBridge: pushBridge,
  };
})(typeof window !== 'undefined' ? window : globalThis);
