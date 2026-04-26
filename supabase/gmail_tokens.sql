-- Gmail OAuth tokens table
create table if not exists public.gmail_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  token_expiry timestamptz,
  gmail_address text,
  last_sync_at timestamptz,
  history_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint gmail_tokens_user_id_key unique (user_id)
);

-- RLS
alter table public.gmail_tokens enable row level security;

create policy "Users can read own gmail tokens"
  on public.gmail_tokens for select
  using (auth.uid() = user_id);

create policy "Users can insert own gmail tokens"
  on public.gmail_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can update own gmail tokens"
  on public.gmail_tokens for update
  using (auth.uid() = user_id);

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists gmail_tokens_updated_at on public.gmail_tokens;
create trigger gmail_tokens_updated_at
  before update on public.gmail_tokens
  for each row execute procedure public.handle_updated_at();

-- Add gmail_message_id and reservation_code columns to messages if they don't exist
alter table public.messages
  add column if not exists gmail_message_id text,
  add column if not exists reservation_code text,
  add column if not exists check_in text,
  add column if not exists check_out text,
  add column if not exists source text default 'manual';
