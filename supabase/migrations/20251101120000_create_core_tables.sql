-- Migration: Create core tables for HabitFlow
-- Purpose: Initial database schema with user profiles, habits, habit parameters, and check-in portions
-- Affected tables: profiles, habits, habit_params, checkin_portions
-- Special considerations: Includes RLS enablement for all user data tables

-- Create profiles table extending auth.users
create table public.profiles (
    user_id uuid primary key references auth.users(id),
    email text not null,
    display_name text,
    timezone text default 'UTC',
    locale text default 'en',
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    deleted_at timestamptz,
    scheduled_for_deletion_until timestamptz
);

-- Create habits table with soft delete and tags
create table public.habits (
    habit_id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(user_id),
    name text not null,
    description text,
    frequency_type text not null check (frequency_type in ('DAILY', 'WEEKLY', 'TIMES_PER_WEEK')),
    target_value numeric(10,3),
    unit_kind text check (unit_kind in ('count', 'volume', 'distance', 'time')),
    value_min numeric(10,3),
    value_max numeric(10,3),
    tags jsonb default '[]' check (jsonb_array_length(tags) <= 3),
    week_days integer[],
    times_per_week integer,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    deleted_at timestamptz,
    trash_expires_at timestamptz
);

-- Create habit_params table for versioning habit parameters with date ranges
create table public.habit_params (
    param_id uuid primary key default gen_random_uuid(),
    habit_id uuid not null references public.habits(habit_id),
    effective_from date not null,
    effective_until date,
    target_value numeric(10,3),
    value_min numeric(10,3),
    value_max numeric(10,3),
    created_at timestamptz default now()
);

-- Note: Exclusion constraint replaced with trigger validation for better compatibility
-- The constraint will be enforced by the validate_habit_params function in a later migration

-- Create checkin_portions table for atomic check-in portions with metadata
create table public.checkin_portions (
    portion_id uuid primary key default gen_random_uuid(),
    habit_id uuid not null references public.habits(habit_id),
    local_date date not null,
    value numeric(10,3) not null default 1,
    note text,
    client_command_uuid uuid not null,
    device_id text,
    logical_clock bigint default 0,
    server_received_at timestamptz default now(),
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    deleted_at timestamptz,
    trash_expires_at timestamptz,

    -- Unique constraint for idempotency based on habit and client command UUID
    unique (habit_id, client_command_uuid)
);

-- Enable Row Level Security on all user data tables
alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_params enable row level security;
alter table public.checkin_portions enable row level security;
