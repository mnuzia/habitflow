-- Migration: Create materialized views and helper functions for HabitFlow
-- Purpose: Performance optimization with daily aggregates and utility functions
-- Affected objects: checkins_daily materialized view, helper functions
-- Special considerations: Materialized view requires periodic refresh, functions for timezone and completion calculations

-- Create materialized view for daily check-in aggregates
create materialized view public.checkins_daily as
select
  cp.habit_id,
  cp.local_date,
  sum(cp.value) as value_sum,
  count(*) as portion_count,
  case
    when h.target_value is null then case when sum(cp.value) >= 1 then 1 else 0 end
    else case when sum(cp.value) >= h.target_value then 1 else 0 end
  end as completed,
  max(cp.server_received_at) as last_updated
from public.checkin_portions cp
join public.habits h on cp.habit_id = h.habit_id
where cp.deleted_at is null and h.deleted_at is null
group by cp.habit_id, cp.local_date, h.target_value;

-- Create indexes on the materialized view
create unique index idx_checkins_daily_habit_date on public.checkins_daily(habit_id, local_date);
create index idx_checkins_daily_date on public.checkins_daily(local_date);

-- Helper function to get user timezone
create or replace function public.get_user_timezone(user_uuid uuid)
returns text
language sql
security definer
as $$
  select coalesce(timezone, 'UTC') from public.profiles where user_id = user_uuid;
$$;

-- Helper function to calculate local date from timestamp and timezone
create or replace function public.calculate_local_date(
  timestamp_value timestamptz,
  timezone_value text default 'UTC'
)
returns date
language sql
immutable
as $$
  select (timestamp_value at time zone timezone_value)::date;
$$;

-- Helper function to check if habit is completed on a specific date
create or replace function public.is_habit_completed(
  habit_uuid uuid,
  check_date date
)
returns boolean
language sql
security definer
as $$
  select
    case
      when h.target_value is null then
        coalesce(sum(cp.value) >= 1, false)
      else
        coalesce(sum(cp.value) >= h.target_value, false)
    end
  from public.habits h
  left join public.checkin_portions cp on cp.habit_id = h.habit_id
    and cp.local_date = check_date
    and cp.deleted_at is null
  where h.habit_id = habit_uuid
    and h.deleted_at is null
  group by h.habit_id, h.target_value;
$$;

-- Trigger function to validate habit parameters
create or replace function public.validate_habit_params()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Ensure effective_from is not in the future
  if new.effective_from > current_date then
    raise exception 'effective_from cannot be in the future';
  end if;

  -- Ensure effective_until is after effective_from if specified
  if new.effective_until is not null and new.effective_until <= new.effective_from then
    raise exception 'effective_until must be after effective_from';
  end if;

  -- Validate value constraints
  if new.value_min is not null and new.value_max is not null and new.value_min > new.value_max then
    raise exception 'value_min cannot be greater than value_max';
  end if;

  -- Ensure target_value is within bounds if specified
  if new.target_value is not null then
    if new.value_min is not null and new.target_value < new.value_min then
      raise exception 'target_value cannot be less than value_min';
    end if;
    if new.value_max is not null and new.target_value > new.value_max then
      raise exception 'target_value cannot be greater than value_max';
    end if;
  end if;

  -- Check for overlapping date ranges for the same habit
  if exists (
    select 1 from public.habit_params
    where habit_id = new.habit_id
      and param_id != coalesce(new.param_id, '00000000-0000-0000-0000-000000000000'::uuid)
      and (
        (effective_from, coalesce(effective_until, 'infinity'::date)) overlaps
        (new.effective_from, coalesce(new.effective_until, 'infinity'::date))
      )
  ) then
    raise exception 'Date range overlaps with existing habit parameters for this habit';
  end if;

  return new;
end;
$$;

-- Create trigger for habit_params validation
create trigger validate_habit_params_trigger
  before insert or update on public.habit_params
  for each row execute function public.validate_habit_params();

-- Note: For production deployment, consider:
-- 1. Setting up pg_cron for periodic refresh of checkins_daily materialized view
-- 2. Creating additional indexes based on query patterns
-- 3. Implementing partitioning strategy for high-volume tables
