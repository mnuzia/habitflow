-- Migration: Create authentication tokens system for HabitFlow
-- Purpose: Personal Access Tokens (PAT) and ICS feed tokens for API access
-- Affected tables: pat_tokens, pat_token_allows, ics_tokens
-- Special considerations: Token hashes stored as SHA-256, includes allowlist functionality for PATs

-- Create pat_tokens table for Personal Access Tokens
create table public.pat_tokens (
    token_id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(user_id),
    name text not null,
    token_hash text not null, -- SHA-256 hash of the actual token
    token_last8 text not null, -- Last 8 characters for identification
    scopes text[] not null default '{}', -- Access scopes
    ttl_hours integer default 24, -- Time to live in hours
    created_at timestamptz default now(),
    expires_at timestamptz default (now() + interval '24 hours'), -- Will be updated by trigger
    revoked_at timestamptz,
    last_used_at timestamptz
);

-- Create pat_token_allows table for PAT allowlist (IP/ASN restrictions)
create table public.pat_token_allows (
    allow_id uuid primary key default gen_random_uuid(),
    token_id uuid not null references public.pat_tokens(token_id),
    allow_type text not null check (allow_type in ('ip', 'asn')),
    allow_value text not null, -- CIDR notation for IP, ASN number for ASN
    created_at timestamptz default now()
);

-- Create ics_tokens table for ICS feed tokens
create table public.ics_tokens (
    token_id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(user_id),
    name text not null,
    token_hash text not null, -- SHA-256 hash of the actual token
    token_last8 text not null, -- Last 8 characters for identification
    created_at timestamptz default now(),
    revoked_at timestamptz,
    last_used_at timestamptz
);

-- Function to update expires_at when ttl_hours changes
create or replace function public.update_pat_expires_at()
returns trigger
language plpgsql
as $$
begin
  if new.ttl_hours is distinct from old.ttl_hours or new.created_at is distinct from old.created_at then
    new.expires_at := new.created_at + interval '1 hour' * new.ttl_hours;
  end if;
  return new;
end;
$$;

-- Trigger to automatically update expires_at
create trigger update_pat_expires_at_trigger
  before insert or update on public.pat_tokens
  for each row execute function public.update_pat_expires_at();

-- Enable Row Level Security on token tables
alter table public.pat_tokens enable row level security;
alter table public.pat_token_allows enable row level security;
alter table public.ics_tokens enable row level security;
