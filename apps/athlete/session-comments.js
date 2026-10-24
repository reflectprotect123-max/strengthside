/** Two-way session reflection thread. Local-first; remote coach replies merge in. */
(function (root) {
  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function reflectionId(sessionId) {
    return `local:${sessionId}:reflection`;
  }

  function fromSession(session, athleteId) {
    const note = String(session && session.feel && session.feel.note || '').trim();
    const extra = Array.isArray(session && session.comments) ? session.comments : [];
    const out = [];
    if (note) {
      out.push({
        id: reflectionId(session.id),
        athleteId: athleteId || null,
        sessionId: session.id,
        assignmentId: (session.coachAssignedIds || [])[0] || null,
        authorRole: 'athlete',
        body: note,
        parentId: null,
        createdAt: session.completedAt || null,
      });
    }
    for (const row of extra) {
      if (!row || !row.body) continue;
      out.push({
        id: row.id,
        athleteId: row.athleteId || row.athlete_id || athleteId || null,
        sessionId: row.sessionId || row.session_id || session.id,
        assignmentId: row.assignmentId || row.assignment_id || null,
        authorRole: row.authorRole || row.author_role,
        body: row.body,
        parentId: row.parentId || row.parent_id || null,
        createdAt: row.createdAt || row.created_at || null,
      });
    }
    return out;
  }

  function merge(local, remote, athleteId) {
    const mine = athleteId || (local[0] && local[0].athleteId) || null;
    const seen = new Set();
    const out = [];
    for (const row of [...(local || []), ...(remote || [])]) {
      if (!row) continue;
      const owner = row.athleteId || row.athlete_id || mine;
      if (mine && owner && owner !== mine) continue;
      const id = row.id || reflectionId(row.sessionId || row.session_id || 'unknown');
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({
        id,
        athleteId: owner,
        sessionId: row.sessionId || row.session_id,
        assignmentId: row.assignmentId || row.assignment_id || null,
        authorRole: row.authorRole || row.author_role,
        body: row.body,
        parentId: row.parentId || row.parent_id || null,
        createdAt: row.createdAt || row.created_at || null,
      });
    }
    out.sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')) || String(a.id).localeCompare(String(b.id)));
    return out;
  }

  function threadHtml(thread) {
    if (!thread || !thread.length) return '';
    const items = thread.map((row) => {
      const who = row.authorRole === 'coach' ? 'Coach' : 'You';
      return `<article class="log-comment log-comment--${esc(row.authorRole || 'athlete')}">
        <p class="log-comment-who">${esc(who)}</p>
        <p>${esc(row.body)}</p>
      </article>`;
    }).join('');
    return `<section class="log-thread" aria-label="Session comments">${items}</section>`;
  }

  function defaultIo() {
    const db = root.Whoop && root.Whoop.client && root.Whoop.client();
    return {
      async userId() {
        if (!db) return null;
        const {data, error} = await db.auth.getSession();
        if (error) throw error;
        return data.session && data.session.user && data.session.user.id || null;
      },
      async pull(uid, sessionId) {
        if (!db || !uid) return [];
        let query = db.from('session_comment').select('*').eq('athlete_id', uid).order('created_at');
        if (sessionId) query = query.eq('session_id', sessionId);
        const {data, error} = await query;
        if (error) throw error;
        return data || [];
      },
      async push(row) {
        if (!db) return null;
        const {data, error} = await db.from('session_comment').insert(row).select('*').single();
        if (error) throw error;
        return data;
      },
    };
  }

  async function sync(session, options = {}) {
    const io = options.io || defaultIo();
    const uid = await io.userId();
    if (!uid || !session) return {ok: false, reason: 'auth_required', thread: fromSession(session, uid)};
    const local = fromSession(session, uid);
    const remote = await io.pull(uid, session.id);
    const thread = merge(local, remote, uid);
    const reflection = local.find((row) => row.id === reflectionId(session.id));
    if (reflection && reflection.body && !remote.some((row) => row.body === reflection.body && (row.author_role || row.authorRole) === 'athlete')) {
      try {
        await io.push({
          athlete_id: uid,
          session_id: session.id,
          assignment_id: reflection.assignmentId,
          parent_id: null,
          author_id: uid,
          author_role: 'athlete',
          body: reflection.body,
        });
      } catch (_) { /* Offline keep-local; retry on next sync. */ }
    }
    session.comments = thread.filter((row) => row.id !== reflectionId(session.id));
    return {ok: true, thread};
  }

  root.SessionComments = {fromSession, merge, threadHtml, sync, reflectionId};
})(typeof globalThis !== 'undefined' ? globalThis : this);
