-- =========================================
-- 🧠 CalPal Database Schema & Backend Setup (vFinal)
-- =========================================
-- Author: Minilemon Technology Intern Team
-- Maintainer: @MohamadSolkhanNawawi
-- Version: 1.0.0
-- Description:
--   This script initializes all required tables, triggers, and functions
--   for the CalPal Supabase backend. Run this sequentially in Supabase SQL Editor.
--
-- Includes:
--   1️⃣ Core schema (tables & relationships)
--   2️⃣ Automatic triggers (profiles & coins)
--   3️⃣ RPC & functions (log_food, get summaries)
--   4️⃣ Gamification system (achievements & coins)
--   5️⃣ Automatic calorie calculation (trigger)
--
-- Run order:
--   1. Schema & relationships
--   2. Triggers
--   3. RPC functions
--   4. Achievement system
--   5. Seed data
-- =========================================

-- =========================================
-- 1️⃣ EXTENSIONS
-- =========================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =========================================
-- 2️⃣ TABLE: profiles
-- -----------------------------------------
-- Stores basic user data linked to Supabase Auth users.
-- Automatically created via trigger after user signup.
-- =========================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  current_weight_kg decimal(5,2) not null,
  target_calories integer default 2000,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  constraint profiles_id_fk foreign key (id) references auth.users(id) on delete cascade
);

-- =========================================
-- 3️⃣ TABLE: food_logs
-- -----------------------------------------
-- Logs of consumed foods. Used for calorie intake calculation.
-- =========================================
create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  food_name text not null,
  calories_kcal integer not null,
  serving_qty decimal(5,2) not null,
  serving_unit text not null,
  created_at timestamp default now(),
  constraint fk_food_logs_user foreign key (user_id) references public.profiles(id) on delete cascade
);

-- =========================================
-- 4️⃣ TABLE: met_activities
-- -----------------------------------------
-- Contains predefined MET values for physical activities.
-- =========================================
create table if not exists public.met_activities (
  id serial primary key,
  activity_name text unique not null,
  met_value decimal(4,2) not null,
  created_at timestamp default now()
);

-- =========================================
-- 5️⃣ TABLE: activity_logs
-- -----------------------------------------
-- Logs of performed activities. Calories burned auto-calculated via trigger.
-- =========================================
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  met_activity_id integer not null references public.met_activities(id),
  duration_minutes integer not null,
  calories_burned integer not null,
  created_at timestamp default now(),
  constraint fk_activity_user foreign key (user_id) references public.profiles(id) on delete cascade
);

-- =========================================
-- 6️⃣ TABLE: user_stats
-- -----------------------------------------
-- Stores total coins and gamification stats for each user.
-- =========================================
create table if not exists public.user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_coins integer default 0,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  constraint fk_user_stats_user foreign key (user_id) references public.profiles(id) on delete cascade
);

-- =========================================
-- 7️⃣ TABLE: achievements
-- -----------------------------------------
-- Static achievement definitions. Seeded on setup.
-- =========================================
create table if not exists public.achievements (
  id serial primary key,
  name text not null,
  description text not null,
  icon_url text,
  created_at timestamp default now()
);

-- =========================================
-- 8️⃣ TABLE: user_achievements
-- -----------------------------------------
-- Join table for achievements earned by users.
-- =========================================
create table if not exists public.user_achievements (
  id serial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id integer not null references public.achievements(id) on delete cascade,
  awarded_at timestamp default now(),
  unique (user_id, achievement_id)
);

-- =========================================
-- 9️⃣ TRIGGER: Auto-create profile when new user signs up
-- =========================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform 1 from public.profiles where id = new.id;
  if not found then
    insert into public.profiles (id, username, current_weight_kg)
    values (
      new.id,
      concat('user_', substr(new.id::text, 1, 8)),
      0.00::decimal(5,2)
    );
  end if;
  return new;
exception
  when others then
    raise warning 'Trigger handle_new_user failed: %', sqlerrm;
    return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================================
-- 🔟 TRIGGER: Auto-create user_stats when profile created
-- =========================================
create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_stats (user_id, total_coins)
  values (new.id, 0)
  on conflict (user_id) do nothing;
  return new;
exception
  when others then
    raise warning 'Trigger handle_new_profile failed: %', sqlerrm;
    return new;
end;
$$;

create trigger on_profile_created
after insert on public.profiles
for each row execute function public.handle_new_profile();

-- =========================================
-- 1️⃣1️⃣ FUNCTION: get_daily_summary
-- -----------------------------------------
-- Returns total calories in, out, and net for a given user and date.
-- =========================================
create or replace function public.get_daily_summary(
  p_user_id uuid,
  p_log_date date
)
returns table (
  total_calories_in numeric,
  total_calories_out numeric,
  net_calories numeric
)
language plpgsql
security definer
as $$
begin
  return query
  select
    coalesce((select sum(calories_kcal::numeric)
      from public.food_logs
      where user_id = p_user_id and log_date = p_log_date), 0),
    coalesce((select sum(calories_burned::numeric)
      from public.activity_logs
      where user_id = p_user_id and log_date = p_log_date), 0),
    coalesce((select sum(calories_kcal::numeric)
      from public.food_logs
      where user_id = p_user_id and log_date = p_log_date), 0)
    -
    coalesce((select sum(calories_burned::numeric)
      from public.activity_logs
      where user_id = p_user_id and log_date = p_log_date), 0);
end;
$$;

-- =========================================
-- 1️⃣2️⃣ FUNCTION: get_weekly_summary
-- -----------------------------------------
-- Returns 7-day calorie summary for charts.
-- =========================================
create or replace function public.get_weekly_summary(p_user_id uuid)
returns table(
  log_date date,
  total_in integer,
  total_out integer,
  net_calories integer
)
language sql
as $$
  select
    d::date as log_date,
    coalesce(sum(f.calories_kcal), 0) as total_in,
    coalesce(sum(a.calories_burned), 0) as total_out,
    coalesce(sum(f.calories_kcal), 0) - coalesce(sum(a.calories_burned), 0) as net_calories
  from generate_series(current_date - interval '6 day', current_date, interval '1 day') as d
  left join public.food_logs f on f.log_date = d and f.user_id = p_user_id
  left join public.activity_logs a on a.log_date = d and a.user_id = p_user_id
  group by d
  order by d;
$$;

-- =========================================
-- 1️⃣3️⃣ TRIGGER: Add coins when logging food or activity
-- =========================================
create or replace function public.add_coins_on_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.user_stats
  set total_coins = total_coins + 5,
      updated_at = now()
  where user_id = new.user_id;
  return new;
end;
$$;

create trigger food_log_reward
after insert on public.food_logs
for each row execute function public.add_coins_on_log();

create trigger activity_log_reward
after insert on public.activity_logs
for each row execute function public.add_coins_on_log();

-- =========================================
-- 1️⃣4️⃣ FUNCTION: check_user_achievements
-- -----------------------------------------
-- Checks and awards achievements based on user logs.
-- =========================================
create or replace function public.check_user_achievements(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  log_streak int;
  total_burned int;
begin
  select count(distinct log_date)
  into log_streak
  from public.food_logs
  where user_id = p_user_id
  and log_date >= current_date - interval '3 day';

  select coalesce(sum(calories_burned), 0)
  into total_burned
  from public.activity_logs
  where user_id = p_user_id;

  if log_streak >= 3 then
    insert into public.user_achievements (user_id, achievement_id)
    values (p_user_id, 1)
    on conflict do nothing;
    update public.user_stats
    set total_coins = total_coins + 20
    where user_id = p_user_id;
  end if;

  if total_burned >= 1000 then
    insert into public.user_achievements (user_id, achievement_id)
    values (p_user_id, 2)
    on conflict do nothing;
    update public.user_stats
    set total_coins = total_coins + 50
    where user_id = p_user_id;
  end if;
end;
$$;

create or replace function public.handle_log_for_achievement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.check_user_achievements(new.user_id);
  return new;
end;
$$;

create trigger food_log_check_achievements
after insert on public.food_logs
for each row execute function public.handle_log_for_achievement();

create trigger activity_log_check_achievements
after insert on public.activity_logs
for each row execute function public.handle_log_for_achievement();

-- =========================================
-- 1️⃣5️⃣ FUNCTION: calculate_activity_calories
-- -----------------------------------------
-- Automatically calculates calories burned before insert.
-- =========================================
create or replace function public.calculate_activity_calories()
returns trigger
language plpgsql
as $$
declare
  user_weight numeric;
  met_val numeric;
begin
  select current_weight_kg into user_weight
  from public.profiles
  where id = new.user_id;

  select met_value into met_val
  from public.met_activities
  where id = new.met_activity_id;

  if user_weight is null then
    user_weight := 70;
  end if;

  new.calories_burned := round((met_val * 3.5 * user_weight * new.duration_minutes) / 200);
  return new;
end;
$$;

drop trigger if exists trg_calories_burned on public.activity_logs;
create trigger trg_calories_burned
before insert or update on public.activity_logs
for each row execute function public.calculate_activity_calories();

-- =========================================
-- 1️⃣6️⃣ RPC: log_food
-- -----------------------------------------
-- RPC for inserting new food logs (used by frontend).
-- Calculates total calories automatically based on serving quantity.
-- =========================================
create or replace function public.log_food(
  p_user_id uuid,
  p_food_name text,
  p_calories_kcal numeric,
  p_serving_qty numeric,
  p_serving_unit text
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.food_logs (
    user_id,
    food_name,
    calories_kcal,
    serving_qty,
    serving_unit,
    log_date
  )
  values (
    p_user_id,
    p_food_name,
    p_calories_kcal * p_serving_qty,
    p_serving_qty,
    p_serving_unit,
    current_date
  );
end;
$$;

-- =========================================
-- 1️⃣7️⃣ SEED DATA: met_activities and achievements
-- =========================================
insert into public.met_activities (activity_name, met_value)
values
('Running, 5 mph', 8.3),
('Cycling, 10 mph', 6.8),
('Walking, brisk pace', 4.3),
('Yoga', 3.0),
('Swimming', 7.0),
('Strength training', 5.0),
('House cleaning', 3.5)
on conflict (activity_name) do nothing;

insert into public.achievements (name, description)
values
('3-Day Streak', 'Log food for 3 consecutive days'),
('1K Calories Burned', 'Burn a total of 1000 calories'),
('Consistent Logger', 'Add activity logs every day for a week')
on conflict do nothing;

-- =========================================
-- ✅ END OF SETUP
-- =========================================
