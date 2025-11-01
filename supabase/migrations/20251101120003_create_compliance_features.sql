-- Migration: Create compliance features for HabitFlow
-- Purpose: GDPR compliance features including DSAR requests, download links, and user consents
-- Affected tables: dsar_requests, download_links, consents
-- Special considerations: Implements data subject access rights (DSAR) workflow and consent management

-- Create dsar_requests table for Data Subject Access Requests
create table public.dsar_requests (
    request_id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(user_id),
    request_type text not null check (request_type in ('access', 'delete', 'rectify')),
    status text not null default 'received' check (status in ('received', 'in_progress', 'delivered', 'delivered_partial', 'closed')),
    priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
    request_details jsonb,
    resume_checkpoint jsonb, -- For resuming large data exports
    throttle_mode boolean default false, -- Whether in throttled processing mode
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    delivered_at timestamptz,
    closed_at timestamptz
);

-- Create download_links table for one-time download links (exports/DSAR)
create table public.download_links (
    link_id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(user_id),
    request_id uuid references public.dsar_requests(request_id), -- NULL for regular exports
    link_token text not null, -- Unguessable token for the download link
    file_path text not null,
    file_name text not null,
    file_size_bytes bigint,
    content_type text default 'application/zip',
    password_hash text, -- SHA-256 hash if password-protected
    expires_at timestamptz not null,
    downloaded_at timestamptz,
    created_at timestamptz default now()
);

-- Create consents table for user consent management
create table public.consents (
    consent_id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(user_id),
    consent_type text not null, -- e.g., 'marketing', 'analytics', 'third_party'
    granted boolean not null,
    consent_text text not null,
    consent_version text not null,
    granted_at timestamptz,
    revoked_at timestamptz,
    created_at timestamptz default now()
);

-- Enable Row Level Security on compliance tables
alter table public.dsar_requests enable row level security;
alter table public.download_links enable row level security;
alter table public.consents enable row level security;
