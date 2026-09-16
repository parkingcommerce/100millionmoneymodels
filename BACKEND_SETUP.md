# Community Backend Setup (Supabase)

The game ships in **safe demo mode**: the Community Feedback form and the Leaderboard opt‑in
validate input locally but **do not store anything** and clearly say so. Public submissions stay
disabled until you connect a backend and apply the security rules below.

Nothing secret is committed to the repo. The only value the browser ever uses is the **public anon
key**, which is safe to expose **only because Row Level Security (RLS) is enabled** as described here.
**Never** put the `service_role` key (or any secret) into `index.html`.

---

## 1. Create a Supabase project
1. Sign up / sign in at <https://supabase.com>.
2. Create a new project. Choose a strong database password (store it in your own password manager).
3. Wait for the project to finish provisioning.

## 2. Apply the database schema + security policies
Open **SQL Editor** in the Supabase dashboard, paste the entire block below, and run it.

```sql
-- ============ helper: admin check ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  is_admin boolean not null default false
);
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select using (id = auth.uid());

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ============ feedback  (powers the "Hall of Shame": moderated Vanderbilt-improvement ideas) ============
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  body text not null check (char_length(body) between 3 and 200),
  display_name text check (display_name is null or char_length(display_name) <= 24),
  reactions int not null default 0 check (reactions >= 0),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;

-- anon/public may read ONLY approved rows
create policy "read approved feedback" on public.feedback
  for select to anon, authenticated using (status = 'approved');
-- anyone may insert, but the row is FORCED to 'pending' with 0 reactions (no self-approval)
create policy "insert pending feedback" on public.feedback
  for insert to anon, authenticated with check (status = 'pending' and reactions = 0);
-- admins can read everything and change status
create policy "admin read feedback" on public.feedback
  for select to authenticated using (public.is_admin());
create policy "admin update feedback" on public.feedback
  for update to authenticated using (public.is_admin()) with check (true);

-- Anonymous reactions: increment only on APPROVED rows via a definer function (no direct update grant).
create or replace function public.react_feedback(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.feedback set reactions = reactions + 1 where id = p_id and status = 'approved';
$$;
revoke all on function public.react_feedback(uuid) from public;
grant execute on function public.react_feedback(uuid) to anon, authenticated;

-- ============ leaderboard ============
create table if not exists public.leaderboard (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 1 and 24),
  score int not null check (score between -80 and 100),          -- impossible scores rejected
  path text check (path is null or char_length(path) <= 40),
  doing_now text check (doing_now is null or char_length(doing_now) <= 140),
  elapsed_ms bigint check (elapsed_ms is null or (elapsed_ms >= 0 and elapsed_ms < 86400000)),
  delete_token text not null,                                    -- secret; never exposed to anon
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
alter table public.leaderboard enable row level security;

-- admins read all + moderate
create policy "admin read leaderboard" on public.leaderboard
  for select to authenticated using (public.is_admin());
create policy "admin update leaderboard" on public.leaderboard
  for update to authenticated using (public.is_admin()) with check (true);
-- anyone may insert, forced to pending + score bounds re-checked in policy
create policy "insert pending leaderboard" on public.leaderboard
  for insert to anon, authenticated
  with check (status = 'pending' and score between -80 and 100);

-- Public read happens through a VIEW that never exposes delete_token.
create or replace view public.leaderboard_public
with (security_invoker = true) as
  select id, display_name, score, path, doing_now, elapsed_ms, status, created_at
  from public.leaderboard
  where status = 'approved';
grant select on public.leaderboard_public to anon, authenticated;

-- Deletion by secret token only (no accounts). security definer bypasses RLS but matches exact token.
create or replace function public.request_leaderboard_deletion(p_token text)
returns void language sql security definer set search_path = public as $$
  delete from public.leaderboard where delete_token = p_token;
$$;
revoke all on function public.request_leaderboard_deletion(text) from public;
grant execute on function public.request_leaderboard_deletion(text) to anon, authenticated;

-- ============ reports ============
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  target_table text not null check (target_table in ('feedback','leaderboard')),
  target_id uuid not null,
  reason text check (reason is null or char_length(reason) <= 200),
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
create policy "insert reports" on public.reports
  for insert to anon, authenticated with check (true);
create policy "admin read reports" on public.reports
  for select to authenticated using (public.is_admin());

-- ============ table grants (RLS still gates every row) ============
grant select, insert on public.feedback to anon, authenticated;
grant insert on public.leaderboard to anon, authenticated;   -- NOTE: no SELECT grant on base table
grant insert on public.reports to anon, authenticated;
grant update (status) on public.feedback to authenticated;
grant update (status) on public.leaderboard to authenticated;

-- ============ lightweight rate limiting (best-effort, app-level throttle also exists) ============
-- Block exact-duplicate pending feedback bodies within a short window.
create unique index if not exists feedback_dupe_guard
  on public.feedback (md5(body))
  where status = 'pending';
```

> **Rate limiting note:** Supabase enforces platform-level limits, and the frontend adds a
> per-browser throttle. For stronger per-IP limits, add a Supabase **Edge Function** in front of
> inserts, or a trigger that counts recent rows. The unique index above stops identical spam.

## 3. Create an administrator
1. In **Authentication → Users**, click **Add user** and create your admin email + password
   (email confirm on). This is *your* account; its password is never stored in the app.
2. Copy that user's UUID, then in **SQL Editor** run:
   ```sql
   insert into public.profiles (id, is_admin) values ('PASTE-ADMIN-USER-UUID', true)
   on conflict (id) do update set is_admin = true;
   ```

## 4. Connect the frontend (public keys only)
1. In **Project Settings → API**, copy the **Project URL** and the **anon public** key.
   *(Do NOT copy the `service_role` key — it must never touch the browser.)*
2. In `index.html`, find:
   ```js
   const BACKEND={url:'',anonKey:''};
   ```
   and set them:
   ```js
   const BACKEND={url:'https://YOUR-PROJECT.supabase.co', anonKey:'YOUR-ANON-PUBLIC-KEY'};
   ```
3. Commit & push. Because RLS is enabled, the anon key can only: read approved rows, insert
   `pending` rows, insert reports, and call the deletion RPC — nothing else.

## 5. Moderate
- Visit the site with `#moderation` appended to the URL (e.g. `.../100millionmoneymodels/#moderation`).
- Sign in with your admin account. You'll see pending Feedback and Leaderboard items with
  **Approve / Reject** buttons. Only `approved` items ever appear publicly.

## Security summary
- No secrets in the frontend; only the public anon key, guarded by RLS.
- Inserts are forced to `status = 'pending'` — nothing publishes without a human approving it.
- Public leaderboard reads go through a view that omits `delete_token`.
- CHECK constraints reject impossible scores and over-length input; the client also sanitizes,
  length-limits, escapes HTML on display, and filters profanity/slurs/threats/PII.
- Deletion requires the user's secret token; reports are insert-only for the public.
