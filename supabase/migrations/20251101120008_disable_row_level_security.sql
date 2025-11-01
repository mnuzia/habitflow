-- Migration: Disable Row Level Security policies for HabitFlow
-- Purpose: Temporarily disable all RLS policies for development/admin access
-- Affected tables: All user data tables with RLS policies
-- Special considerations: This removes access control - use with caution in production

-- Drop profiles table policies
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

-- Drop habits table policies
drop policy if exists "Users can view own habits" on public.habits;
drop policy if exists "Users can insert own habits" on public.habits;
drop policy if exists "Users can update own habits" on public.habits;
drop policy if exists "Users can soft delete own habits" on public.habits;

-- Drop habit_params table policies
drop policy if exists "Users can view own habit params" on public.habit_params;
drop policy if exists "Users can manage own habit params" on public.habit_params;

-- Drop checkin_portions table policies
drop policy if exists "Users can view own checkins" on public.checkin_portions;
drop policy if exists "Users can manage own checkins" on public.checkin_portions;

-- Drop pat_tokens table policies
drop policy if exists "Users can view own PATs" on public.pat_tokens;
drop policy if exists "Users can manage own PATs" on public.pat_tokens;

-- Drop pat_token_allows table policies
drop policy if exists "Users can view own PAT allowlists" on public.pat_token_allows;
drop policy if exists "Users can manage own PAT allowlists" on public.pat_token_allows;

-- Drop ics_tokens table policies
drop policy if exists "Users can view own ICS tokens" on public.ics_tokens;
drop policy if exists "Users can manage own ICS tokens" on public.ics_tokens;

-- Drop dsar_requests table policies
drop policy if exists "Users can view own DSAR requests" on public.dsar_requests;
drop policy if exists "Users can manage own DSAR requests" on public.dsar_requests;

-- Drop download_links table policies
drop policy if exists "Users can view own download links" on public.download_links;
drop policy if exists "Users can manage own download links" on public.download_links;

-- Drop consents table policies
drop policy if exists "Users can view own consents" on public.consents;
drop policy if exists "Users can manage own consents" on public.consents;

-- Drop notifications table policies
drop policy if exists "Users can view own notifications" on public.notifications;
drop policy if exists "Users can manage own notifications" on public.notifications;

-- Drop audit_logs table policies
drop policy if exists "Users can insert own audit logs" on public.audit_logs;

-- Drop sync_log table policies
drop policy if exists "Users can view own sync logs" on public.sync_log;
drop policy if exists "Users can manage own sync logs" on public.sync_log;

-- Note: RLS is still ENABLED on tables, but no policies exist
-- To re-enable access control, recreate the policies or run the RLS migration again
