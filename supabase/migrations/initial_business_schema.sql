-- Marco Alimentos - Business Schema (Supabase Postgres)
-- Requirements:
-- - Primary keys: id uuid default gen_random_uuid() primary key
-- - All tables include organization_id uuid not null referencing public.organizations(id)
-- - created_at timestamptz default now() (plus updated_at for convenience)
-- - Row Level Security enabled with org-based policies using profiles.organization_id

begin;

create extension if not exists pgcrypto;

-- Table: affiliates
create table if not exists public.affiliates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  user_id uuid not null,
  referral_code text not null,
  referred_by_id uuid references public.affiliates(id),
  level integer default 1,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (organization_id, user_id),
  unique (organization_id, referral_code)
);

create index if not exists idx_affiliates_user_id on public.affiliates(user_id);
create index if not exists idx_affiliates_referral_code on public.affiliates(referral_code);
create index if not exists idx_affiliates_referred_by_id on public.affiliates(referred_by_id);

alter table public.affiliates enable row level security;
create policy org_read_affiliates on public.affiliates for select using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.organization_id = organization_id
  )
);
create policy org_insert_affiliates on public.affiliates for insert with check (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.organization_id = organization_id
  )
);
create policy org_update_affiliates on public.affiliates for update using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.organization_id = organization_id
  )
) with check (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.organization_id = organization_id
  )
);
create policy org_delete_affiliates on public.affiliates for delete using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.organization_id = organization_id
  )
);

-- Table: subscription_plans
create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null,
  price numeric(12,2) not null,
  billing_cycle text default 'monthly',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (organization_id, name)
);

alter table public.subscription_plans enable row level security;
create policy org_read_subscription_plans on public.subscription_plans for select using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);
create policy org_insert_subscription_plans on public.subscription_plans for insert with check (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);
create policy org_update_subscription_plans on public.subscription_plans for update using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
) with check (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);
create policy org_delete_subscription_plans on public.subscription_plans for delete using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);

-- Table: orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  affiliate_id uuid not null references public.affiliates(id),
  status text default 'active',
  amount numeric(12,2) default 350.00,
  subscription_plan_id uuid references public.subscription_plans(id),
  next_billing_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_orders_affiliate_id on public.orders(affiliate_id);

alter table public.orders enable row level security;
create policy org_read_orders on public.orders for select using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);
create policy org_insert_orders on public.orders for insert with check (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);
create policy org_update_orders on public.orders for update using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
) with check (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);
create policy org_delete_orders on public.orders for delete using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);

-- Table: commissions
create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  affiliate_id uuid not null references public.affiliates(id),
  order_id uuid not null references public.orders(id),
  amount numeric(12,2) not null,
  level integer not null,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_commissions_affiliate_id on public.commissions(affiliate_id);

alter table public.commissions enable row level security;
create policy org_read_commissions on public.commissions for select using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);
create policy org_insert_commissions on public.commissions for insert with check (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);
create policy org_update_commissions on public.commissions for update using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
) with check (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);
create policy org_delete_commissions on public.commissions for delete using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);

-- Table: testimonials
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null,
  content text not null,
  rating integer default 5,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.testimonials enable row level security;
create policy org_read_testimonials on public.testimonials for select using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);
create policy org_insert_testimonials on public.testimonials for insert with check (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);
create policy org_update_testimonials on public.testimonials for update using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
) with check (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);
create policy org_delete_testimonials on public.testimonials for delete using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);

-- Table: faqs
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  question text not null,
  answer text not null,
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.faqs enable row level security;
create policy org_read_faqs on public.faqs for select using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);
create policy org_insert_faqs on public.faqs for insert with check (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);
create policy org_update_faqs on public.faqs for update using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
) with check (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);
create policy org_delete_faqs on public.faqs for delete using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);

-- Table: admin_users
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  user_id uuid not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (organization_id, user_id)
);

create index if not exists idx_admin_users_user_id on public.admin_users(user_id);

alter table public.admin_users enable row level security;
create policy org_read_admin_users on public.admin_users for select using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);
create policy org_insert_admin_users on public.admin_users for insert with check (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);
create policy org_update_admin_users on public.admin_users for update using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
) with check (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);
create policy org_delete_admin_users on public.admin_users for delete using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);

-- Table: commission_settings
create table if not exists public.commission_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  level integer not null,
  percentage numeric(5,2) not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (organization_id, level)
);

alter table public.commission_settings enable row level security;
create policy org_read_commission_settings on public.commission_settings for select using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);
create policy org_insert_commission_settings on public.commission_settings for insert with check (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);
create policy org_update_commission_settings on public.commission_settings for update using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
) with check (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);
create policy org_delete_commission_settings on public.commission_settings for delete using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);

-- Table: admin_credentials
create table if not exists public.admin_credentials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  username text not null,
  password_hash text not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (organization_id, username)
);

create index if not exists idx_admin_credentials_username on public.admin_credentials(username);

alter table public.admin_credentials enable row level security;
create policy org_read_admin_credentials on public.admin_credentials for select using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);
create policy org_insert_admin_credentials on public.admin_credentials for insert with check (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);
create policy org_update_admin_credentials on public.admin_credentials for update using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
) with check (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);
create policy org_delete_admin_credentials on public.admin_credentials for delete using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);

-- Table: admin_sessions
create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  session_token text not null,
  admin_username text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (organization_id, session_token)
);

create index if not exists idx_admin_sessions_token on public.admin_sessions(session_token);
create index if not exists idx_admin_sessions_expires on public.admin_sessions(expires_at);

alter table public.admin_sessions enable row level security;
create policy org_read_admin_sessions on public.admin_sessions for select using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);
create policy org_insert_admin_sessions on public.admin_sessions for insert with check (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);
create policy org_update_admin_sessions on public.admin_sessions for update using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
) with check (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);
create policy org_delete_admin_sessions on public.admin_sessions for delete using (
  exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.organization_id = organization_id)
);

commit;

