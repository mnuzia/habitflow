-- Migration: Create performance indexes for HabitFlow
-- Purpose: Optimize query performance for common access patterns
-- Affected tables: All tables with performance-critical queries
-- Special considerations: Includes partial indexes and GIN indexes for JSONB fields

-- habits table indexes
create index idx_habits_user_deleted on public.habits(user_id, deleted_at) where deleted_at is null;
create index idx_habits_tags on public.habits using gin(tags);
create index idx_habits_updated on public.habits(updated_at desc);

-- habit_params table indexes
create index idx_habit_params_habit_date on public.habit_params(habit_id, effective_from, effective_until);
create index idx_habit_params_date_range on public.habit_params using gist(daterange(effective_from, effective_until, '[]'));

-- checkin_portions table indexes
create index idx_checkin_portions_habit_date on public.checkin_portions(habit_id, local_date desc);
create index idx_checkin_portions_user_date on public.checkin_portions(habit_id, local_date desc)
  where deleted_at is null;
create index idx_checkin_portions_client_uuid on public.checkin_portions(client_command_uuid);
create index idx_checkin_portions_logical_clock on public.checkin_portions(habit_id, logical_clock desc);
create index idx_checkin_portions_deleted on public.checkin_portions(deleted_at) where deleted_at is null;

-- pat_tokens table indexes
create index idx_pat_tokens_user_active on public.pat_tokens(user_id, expires_at desc)
  where revoked_at is null;

-- ics_tokens table indexes
create index idx_ics_tokens_user_active on public.ics_tokens(user_id, created_at desc)
  where revoked_at is null;

-- dsar_requests table indexes
create index idx_dsar_requests_user_status on public.dsar_requests(user_id, created_at desc);
create index idx_dsar_requests_priority_status on public.dsar_requests(priority, status, created_at);

-- download_links table indexes
create index idx_download_links_token on public.download_links(link_token);
create index idx_download_links_expires on public.download_links(expires_at) where downloaded_at is null;

-- audit_logs table indexes
create index idx_audit_logs_user_action on public.audit_logs(user_id, created_at desc);
create index idx_audit_logs_resource on public.audit_logs(resource_type, resource_id);
