# Manual SQL for Supabase Setup

Run these SQL commands in your Supabase SQL Editor to set up the necessary tables and policies for the app.

## 1. Profiles Table

This table stores user-specific data, including the number of credits.
The `credits` column is set to a `default` of 10, so every new user automatically starts with 10 credits.

```sql
-- Create a table for public user profiles
create table profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  credits integer default 10
);

-- Set up Row Level Security (RLS)
alter table profiles
  enable row level security;

create policy "Profiles are viewable by authenticated users." on profiles
  for select using (auth.role() = 'authenticated');

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);
```

## 2. Function to Create Profile on Signup

This function automatically creates a profile entry when a new user signs up.

```sql
-- Creates a profile for a new user
create function public.handle_new_user()
returns trigger as $$
begin
  -- Inserts a new row into public.profiles for the new user.
  -- The 'credits' column will automatically be set to its default value (10).
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function after a new user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## 3. Saved Models Table

This table stores the models created by users.

```sql
-- Create saved_models table
create table saved_models (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  image_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table saved_models
  enable row level security;

create policy "Users can view their own saved models." on saved_models
  for select using (auth.uid() = user_id);

create policy "Users can insert their own saved models." on saved_models
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own saved models." on saved_models
  for delete using (auth.uid() = user_id);

```