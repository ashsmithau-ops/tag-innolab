# Tag — Product Solutions Decision Tree

A hosted microsite for routing internal needs to the right team, with form submission, email notifications, and a submissions dashboard.

**Stack:** GitHub → Vercel (hosting + serverless) · Supabase (database) · Resend (email)

---

## 1. Supabase — create the database table

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run:

```sql
create table submissions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  submitter_name text not null,
  submitter_email text not null,
  team text not null,
  client_project text,
  description text not null,
  urgency text not null check (urgency in ('urgent','standard')),
  target_date date,
  path text not null,
  routed_to text not null,
  status text not null default 'new' check (status in ('new','in-progress','done'))
);

-- Allow anonymous inserts (form submissions)
alter table submissions enable row level security;

create policy "Anyone can insert"
  on submissions for insert
  with check (true);

create policy "Anyone can read"
  on submissions for select
  using (true);

create policy "Anyone can update status"
  on submissions for update
  using (true)
  with check (true);
```

3. Go to **Project Settings → API** and copy:
   - **Project URL** → `YOUR_SUPABASE_URL`
   - **anon public key** → `YOUR_SUPABASE_ANON_KEY`

---

## 2. Resend — set up email

1. Create a free account at [resend.com](https://resend.com) (3,000 emails/month free)
2. Add and verify your sending domain (e.g. `tagww.com`)
3. Go to **API Keys** → Create key → copy it

---

## 3. GitHub — push the repo

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_ORG/tag-innolab.git
git push -u origin main
```

---

## 4. Vercel — deploy

1. Go to [vercel.com](https://vercel.com) → **New Project** → import your GitHub repo
2. Add these **Environment Variables** in Vercel project settings:

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | Your Resend API key |
| `FROM_EMAIL` | `noreply@tagww.com` (verified domain) |
| `CONTACT_EMAIL` | Email address of the routed contact (or shared inbox) |

3. Click **Deploy** — Vercel auto-deploys on every push to `main`

---

## 5. Update the HTML files

Replace these placeholder values in **both** `index.html` and `dashboard.html`:

```
YOUR_SUPABASE_URL       → your Supabase project URL
YOUR_SUPABASE_ANON_KEY  → your Supabase anon key
YOUR_DASHBOARD_PASSWORD → choose a password for the dashboard
```

Then commit and push — Vercel will redeploy automatically.

---

## 6. Custom domain (optional)

In Vercel → **Project → Settings → Domains** → add `tools.tagww.com` or similar.

---

## File structure

```
tag-innolab/
├── index.html       ← Decision tree + request form
├── dashboard.html   ← Submissions dashboard
├── api/
│   └── notify.js    ← Serverless function: sends confirmation + routing emails
├── vercel.json      ← Vercel routing config
└── README.md
```

## Dashboard access

Visit `/dashboard.html` → enter the password you set in `YOUR_DASHBOARD_PASSWORD`.

Features:
- Stats: total, urgent, new, in-progress
- Filter by status or urgency, search by name/team/path
- Update status (new → in-progress → done) inline
- Auto-refreshable

---

## Routing logic

| Path | Routed to |
|---|---|
| Growth · Simple | Growth Director |
| Growth · Complex – existing | IGS Lead |
| Growth · Custom – new | IGS Lead |
| Client · Simple | Program Manager |
| Client · Complex – customising | Program Manager |
| Client · Custom – full scope | IGS Lead |
| Delivery · BAU | Delivery team |
| Delivery · Adoption | Delivery Optimisation Manager |
| Delivery · New capability | Program Manager |
