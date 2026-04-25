create extension if not exists "uuid-ossp";

create table if not exists public.properties (
  id uuid primary key default uuid_generate_v4(),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  city text,
  address text,
  house_rules text,
  checkin_instructions text,
  checkout_instructions text,
  wifi_name text,
  wifi_password text,
  parking_details text,
  garbage_recycling text,
  pet_policy text,
  smoking_policy text,
  local_recommendations text,
  escalation_rules text,
  auto_send_low_risk boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.guest_messages (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  host_user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null default 'manual',
  guest_name text,
  guest_external_id text,
  reservation_external_id text,
  body text not null,
  status text not null default 'new',
  imported_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.ai_drafts (
  id uuid primary key default uuid_generate_v4(),
  guest_message_id uuid not null references public.guest_messages(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  host_user_id uuid not null references auth.users(id) on delete cascade,
  classification text not null check (classification in ('low_risk', 'medium_risk', 'high_risk')),
  recommended_action text not null check (recommended_action in ('auto_eligible', 'host_approval_required', 'escalate_immediately')),
  confidence numeric not null default 0,
  detected_intent text,
  guest_response text not null,
  internal_note text,
  can_auto_send boolean not null default false,
  missing_information text[] not null default '{}',
  status text not null default 'needs_review',
  created_at timestamptz not null default now()
);

create table if not exists public.approved_responses (
  id uuid primary key default uuid_generate_v4(),
  ai_draft_id uuid not null references public.ai_drafts(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  host_user_id uuid not null references auth.users(id) on delete cascade,
  approved_response text not null,
  sent_to_guest boolean not null default false,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.approved_templates (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  host_user_id uuid not null references auth.users(id) on delete cascade,
  guest_intent text,
  guest_message text not null,
  approved_response text not null,
  usage_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.integration_events (
  id uuid primary key default uuid_generate_v4(),
  host_user_id uuid references auth.users(id) on delete cascade,
  provider text not null,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.properties enable row level security;
alter table public.guest_messages enable row level security;
alter table public.ai_drafts enable row level security;
alter table public.approved_responses enable row level security;
alter table public.approved_templates enable row level security;
alter table public.integration_events enable row level security;

create policy "hosts can manage own properties"
on public.properties
for all
using (auth.uid() = host_user_id)
with check (auth.uid() = host_user_id);

create policy "hosts can manage own guest messages"
on public.guest_messages
for all
using (auth.uid() = host_user_id)
with check (auth.uid() = host_user_id);

create policy "hosts can manage own ai drafts"
on public.ai_drafts
for all
using (auth.uid() = host_user_id)
with check (auth.uid() = host_user_id);

create policy "hosts can manage own approved responses"
on public.approved_responses
for all
using (auth.uid() = host_user_id)
with check (auth.uid() = host_user_id);

create policy "hosts can manage own approved templates"
on public.approved_templates
for all
using (auth.uid() = host_user_id)
with check (auth.uid() = host_user_id);

create policy "hosts can manage own integration events"
on public.integration_events
for all
using (auth.uid() = host_user_id)
with check (auth.uid() = host_user_id);

create index if not exists idx_properties_host on public.properties(host_user_id);
create index if not exists idx_guest_messages_property on public.guest_messages(property_id);
create index if not exists idx_ai_drafts_status on public.ai_drafts(status);
create index if not exists idx_templates_property_intent on public.approved_templates(property_id, guest_intent);
