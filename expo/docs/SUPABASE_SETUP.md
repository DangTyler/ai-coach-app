# Supabase setup for persistent auth + credits

1. **Create a project** at [supabase.com](https://supabase.com) → New project.

2. **Get credentials** (Project Settings → API):
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key (under "Project API keys") → `SUPABASE_SERVICE_ROLE_KEY`  
   ⚠️ Keep the service role key secret (backend only).

3. **Run the SQL** below in Supabase (SQL Editor → New query → paste → Run).

4. **Set env vars** (local `.env` and Render):
   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

---

## SQL (run in Supabase SQL Editor)

```sql
-- Users (email unique for login)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  password_hash text not null,
  created_at timestamptz default now()
);

-- Sessions (token → user_id)
create table if not exists public.tokens (
  token text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- Credits per user (lazy-initialized on first getBalance)
create table if not exists public.credits (
  user_id uuid primary key references public.users(id) on delete cascade,
  credits int not null default 25,
  last_daily_refill_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  updated_at timestamptz default now()
);

-- Optional: index for token lookups
create index if not exists idx_tokens_user_id on public.tokens(user_id);
```

After this, the backend will use Supabase when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set. If they are missing, auth and credits fall back to in-memory (current behavior).
