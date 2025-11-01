-- Migration: Create tag system for HabitFlow
-- Purpose: Global tag catalog and aliasing system for habits
-- Affected tables: tag_catalog, tag_aliases
-- Special considerations: Global tables - no RLS needed, available to all users

-- Create tag_catalog table for allowed tags
create table public.tag_catalog (
    tag_id uuid primary key default gen_random_uuid(),
    name text not null unique,
    display_name jsonb not null, -- {"en": "...", "pl": "..."}
    created_at timestamptz default now()
);

-- Create tag_aliases table for tag aliasing with effective dates
create table public.tag_aliases (
    alias_id uuid primary key default gen_random_uuid(),
    old_tag text not null,
    new_tag text not null,
    effective_from date not null,
    created_at timestamptz default now()
);

-- Note: No RLS enabled on these global reference tables
-- They are available for read access to all authenticated users
