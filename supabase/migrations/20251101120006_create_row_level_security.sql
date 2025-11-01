-- Migration: Create Row Level Security policies for HabitFlow
-- Purpose: Implement granular access control for all user data tables
-- Affected tables: All user data tables with RLS enabled
-- Special considerations: Policies ensure users can only access their own data

-- profiles table policies
create policy "Users can view own profile" on public.profiles
  for select using (user_id = auth.uid());

create policy "Users can update own profile" on public.profiles
  for update using (user_id = auth.uid());

-- habits table policies
create policy "Users can view own habits" on public.habits
  for select using (user_id = auth.uid() and deleted_at is null);

create policy "Users can insert own habits" on public.habits
  for insert with check (user_id = auth.uid());

create policy "Users can update own habits" on public.habits
  for update using (user_id = auth.uid() and deleted_at is null);

create policy "Users can soft delete own habits" on public.habits
  for update using (user_id = auth.uid());

-- habit_params table policies
create policy "Users can view own habit params" on public.habit_params
  for select using (
    exists (select 1 from public.habits where habit_id = habit_params.habit_id
            and user_id = auth.uid() and deleted_at is null)
  );

create policy "Users can manage own habit params" on public.habit_params
  for all using (
    exists (select 1 from public.habits where habit_id = habit_params.habit_id
            and user_id = auth.uid() and deleted_at is null)
  );

-- checkin_portions table policies
create policy "Users can view own checkins" on public.checkin_portions
  for select using (
    exists (select 1 from public.habits where habit_id = checkin_portions.habit_id
            and user_id = auth.uid() and deleted_at is null)
    and deleted_at is null
  );

create policy "Users can manage own checkins" on public.checkin_portions
  for all using (
    exists (select 1 from public.habits where habit_id = checkin_portions.habit_id
            and user_id = auth.uid() and deleted_at is null)
  );

-- pat_tokens table policies
create policy "Users can view own PATs" on public.pat_tokens
  for select using (user_id = auth.uid());

create policy "Users can manage own PATs" on public.pat_tokens
  for all using (user_id = auth.uid());

-- pat_token_allows table policies
create policy "Users can view own PAT allowlists" on public.pat_token_allows
  for select using (
    exists (select 1 from public.pat_tokens where token_id = pat_token_allows.token_id
            and user_id = auth.uid())
  );

create policy "Users can manage own PAT allowlists" on public.pat_token_allows
  for all using (
    exists (select 1 from public.pat_tokens where token_id = pat_token_allows.token_id
            and user_id = auth.uid())
  );

-- ics_tokens table policies
create policy "Users can view own ICS tokens" on public.ics_tokens
  for select using (user_id = auth.uid());

create policy "Users can manage own ICS tokens" on public.ics_tokens
  for all using (user_id = auth.uid());

-- dsar_requests table policies
create policy "Users can view own DSAR requests" on public.dsar_requests
  for select using (user_id = auth.uid());

create policy "Users can manage own DSAR requests" on public.dsar_requests
  for all using (user_id = auth.uid());

-- download_links table policies
create policy "Users can view own download links" on public.download_links
  for select using (user_id = auth.uid());

create policy "Users can manage own download links" on public.download_links
  for all using (user_id = auth.uid());

-- consents table policies
create policy "Users can view own consents" on public.consents
  for select using (user_id = auth.uid());

create policy "Users can manage own consents" on public.consents
  for all using (user_id = auth.uid());

-- notifications table policies
create policy "Users can view own notifications" on public.notifications
  for select using (user_id = auth.uid());

create policy "Users can manage own notifications" on public.notifications
  for all using (user_id = auth.uid());

-- audit_logs table policies (insert-only for users)
create policy "Users can insert own audit logs" on public.audit_logs
  for insert with check (user_id = auth.uid());

-- sync_log table policies
create policy "Users can view own sync logs" on public.sync_log
  for select using (user_id = auth.uid());

create policy "Users can manage own sync logs" on public.sync_log
  for all using (user_id = auth.uid());

-- Note: tag_catalog and tag_aliases are global tables with no RLS
-- They are available for read access to all authenticated users
