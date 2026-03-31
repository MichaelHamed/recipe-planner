-- Run this in your Supabase SQL editor

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  is_vegetarian boolean default false,
  updated_at timestamp with time zone default now()
);

create table meal_plans (
  id uuid default gen_random_uuid() primary key,
  week_start date not null,
  created_by uuid references profiles(id),
  created_at timestamp with time zone default now()
);

create table plan_slots (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references meal_plans(id) on delete cascade,
  day_of_week text not null check (day_of_week in ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
  meal_id text not null,
  meal_name text not null,
  meal_thumb text,
  proposed_by uuid references profiles(id),
  created_at timestamp with time zone default now()
);

create table votes (
  id uuid default gen_random_uuid() primary key,
  slot_id uuid references plan_slots(id) on delete cascade,
  user_id uuid references profiles(id),
  vote smallint check (vote in (-1, 1)),
  unique(slot_id, user_id)
);

create table favourites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  meal_id text not null,
  meal_name text not null,
  meal_thumb text,
  unique(user_id, meal_id)
);

-- RLS policies
alter table profiles enable row level security;
alter table meal_plans enable row level security;
alter table plan_slots enable row level security;
alter table votes enable row level security;
alter table favourites enable row level security;

create policy "Users can view all profiles" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

create policy "Family can view all plans" on meal_plans for select using (true);
create policy "Authenticated can create plans" on meal_plans for insert with check (auth.role() = 'authenticated');

create policy "Family can view all slots" on plan_slots for select using (true);
create policy "Authenticated can add slots" on plan_slots for insert with check (auth.role() = 'authenticated');
create policy "Users can delete own slots" on plan_slots for delete using (auth.uid() = proposed_by);

create policy "Family can view votes" on votes for select using (true);
create policy "Users can vote" on votes for insert with check (auth.uid() = user_id);
create policy "Users can change own vote" on votes for update using (auth.uid() = user_id);
create policy "Users can remove own vote" on votes for delete using (auth.uid() = user_id);

create policy "Users can view own favourites" on favourites for select using (auth.uid() = user_id);
create policy "Users can manage own favourites" on favourites for insert with check (auth.uid() = user_id);
create policy "Users can delete own favourites" on favourites for delete using (auth.uid() = user_id);
