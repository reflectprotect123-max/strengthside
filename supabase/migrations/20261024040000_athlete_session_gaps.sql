begin;
-- Optional demo URL on the existing exercise catalogue. Coach freezes a copy
-- into assigned_session.resolved_snapshot.htmlSession.blocks[].exercises[].video_url
-- at publish. The athlete logger plays YouTube or mp4 from that snapshot field.
alter table public.exercise add column if not exists video_url text;
comment on column public.exercise.video_url is
  'Optional http(s) YouTube or mp4 demo. Publish copies it into resolved_snapshot; the athlete never reads this column live.';

do $c$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'exercise_video_url_http' and conrelid = 'public.exercise'::regclass
  ) then
    alter table public.exercise
      add constraint exercise_video_url_http
      check (video_url is null or video_url ~* '^https?://');
  end if;
end $c$;

-- Published sessions already carry warm-up / cool-down as htmlSession.blocks[].role
-- or category ('warmup'|'cooldown' / 'Warm-Up'|'Cool-Down'). No new section column.
comment on column public.assigned_session.resolved_snapshot is
  'Publish-time payload. HTML coach stores { v, htmlSession, nutrition? }. htmlSession.blocks[].role or category marks warmup|main|cooldown. exercises[] may include video_url.';

-- Two-way session reflection thread. Athlete writes the finish note; a coach
-- of that athlete may reply. Append-only.
create table if not exists public.session_comment (
  id            uuid primary key default gen_random_uuid(),
  athlete_id    uuid not null,
  assignment_id uuid references public.assigned_session(id),
  session_id    text not null,
  parent_id     uuid references public.session_comment(id),
  author_id     uuid not null,
  author_role   text not null check (author_role in ('athlete', 'coach')),
  body          text not null check (length(trim(body)) > 0),
  created_at    timestamptz not null default now()
);

create index if not exists session_comment_athlete_session_idx
  on public.session_comment (athlete_id, session_id, created_at);

alter table public.session_comment enable row level security;

revoke all on public.session_comment from anon, authenticated;
grant select, insert on public.session_comment to authenticated;

drop policy if exists session_comment_read on public.session_comment;
create policy session_comment_read on public.session_comment
  for select to authenticated
  using (
    athlete_id = (select auth.uid())
    or public.coaches_athlete_anywhere(athlete_id)
  );

drop policy if exists session_comment_athlete_insert on public.session_comment;
create policy session_comment_athlete_insert on public.session_comment
  for insert to authenticated
  with check (
    athlete_id = (select auth.uid())
    and author_id = (select auth.uid())
    and author_role = 'athlete'
  );

drop policy if exists session_comment_coach_insert on public.session_comment;
create policy session_comment_coach_insert on public.session_comment
  for insert to authenticated
  with check (
    public.coaches_athlete_anywhere(athlete_id)
    and author_id = (select auth.uid())
    and author_role = 'coach'
  );

notify pgrst, 'reload schema';
commit;
