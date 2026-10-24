-- Clean, shared search catalogue. Canonical text IDs are not workout UUIDs.
-- No implicit link to exercise, max history, or progression identities is made.
create table public.exercise_catalogue_sources (
  catalogue text primary key check (catalogue in ('main', 'banded')),
  schema_version integer not null check (schema_version = 2),
  taxonomy jsonb not null check (jsonb_typeof(taxonomy) = 'object'),
  source_sha256 text not null check (source_sha256 ~ '^[0-9a-f]{64}$'),
  exercise_count integer not null check (exercise_count > 0),
  imported_at timestamptz not null default now()
);

create table public.exercise_catalogue (
  canonical_exercise_id text primary key check (canonical_exercise_id ~ '^exercise_[0-9a-f]{16}$'),
  catalogue text not null references public.exercise_catalogue_sources(catalogue),
  canonical_title text not null check (length(trim(canonical_title)) > 0),
  aliases text[] not null,
  movement_category text not null,
  movement_subcategory text not null,
  secondary_categories text[] not null,
  tags text[] not null,
  in_custom_library boolean not null,
  review_status text not null check (review_status = 'classified_from_name'),
  reason text not null,
  rule_id text not null,
  basis text not null
);

create index exercise_catalogue_category_idx on public.exercise_catalogue(catalogue, movement_category);
create index exercise_catalogue_title_idx on public.exercise_catalogue(lower(canonical_title));
create index exercise_catalogue_aliases_idx on public.exercise_catalogue using gin(aliases);
create index exercise_catalogue_tags_idx on public.exercise_catalogue using gin(tags);

alter table public.exercise_catalogue_sources enable row level security;
alter table public.exercise_catalogue enable row level security;
revoke all on public.exercise_catalogue_sources, public.exercise_catalogue from anon, authenticated;
grant select on public.exercise_catalogue_sources, public.exercise_catalogue to authenticated;
grant all on public.exercise_catalogue_sources, public.exercise_catalogue to service_role;
create policy exercise_catalogue_sources_read on public.exercise_catalogue_sources
  for select to authenticated using (true);
create policy exercise_catalogue_read on public.exercise_catalogue
  for select to authenticated using (true);

comment on table public.exercise_catalogue is
  'Search/navigation only. Aliases and movement families never authorize shared e1RM or working-max estimates. Banded is a separate catalogue. Seeded by trusted imports; clients read only.';
