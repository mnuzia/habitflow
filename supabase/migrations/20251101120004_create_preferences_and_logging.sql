-- Migration: Create user preferences and logging system for HabitFlow
-- Purpose: Notification settings, audit logging, and sync logging for debugging
-- Affected tables: notifications, audit_logs, sync_log
-- Special considerations: Audit logs are critical for security and compliance monitoring

-- Create notifications table for user notification preferences
create table public.notifications (
    notification_id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(user_id),
    type text not null check (type in ('digest', 'reminder')),
    enabled boolean default true,
    digest_hour integer check (digest_hour >= 0 and digest_hour <= 23),
    quiet_hours_start integer default 22 check (quiet_hours_start >= 0 and quiet_hours_start <= 23),
    quiet_hours_end integer default 7 check (quiet_hours_end >= 0 and quiet_hours_end <= 23),
    silent_days integer[] default '{}', -- ISO weekdays (1-7) when notifications are silent
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create audit_logs table for security and compliance auditing
create table public.audit_logs (
    log_id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(user_id), -- NULL for system actions
    action text not null, -- e.g., 'create_habit', 'delete_account', 'export_data'
    resource_type text not null, -- e.g., 'habit', 'profile', 'token'
    resource_id uuid, -- ID of the affected resource
    old_values jsonb, -- Previous state for updates
    new_values jsonb, -- New state for updates/creates
    ip_address inet,
    user_agent text,
    created_at timestamptz default now()
);

-- Create sync_log table for debugging offline synchronization
create table public.sync_log (
    sync_id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(user_id),
    device_id text not null,
    command_type text not null,
    command_uuid uuid not null,
    status text not null check (status in ('pending', 'applied', 'failed')),
    error_message text,
    created_at timestamptz default now(),
    applied_at timestamptz
);

-- Enable Row Level Security on user preference and logging tables
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.sync_log enable row level security;
