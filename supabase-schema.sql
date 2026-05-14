-- Run this in Supabase SQL Editor

-- Wines table (one row per label)
create table if not exists wines (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc', now()),
  producer text not null,
  wine_name text,
  vintage integer,
  type text check (type in ('Red','White','Rosé','Sparkling','Orange','Fortified')),
  region text,
  appellation text,
  country text,
  grape text,
  alcohol text,
  -- Scores
  score_winefront text,
  score_ray_jordan text,
  score_halliday text,
  score_wine_advocate text,
  score_other text,
  -- Drinking windows
  drink_from integer,
  drink_to integer,
  -- Review links
  url_winefront text,
  url_ray_jordan text,
  url_other text,
  -- Notes
  critic_notes text
);

-- Bottles table (one row per physical bottle)
create table if not exists bottles (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc', now()),
  wine_id uuid references wines(id) on delete cascade,
  status text check (status in (
    'In cellar',
    'Consumed',
    'Pending arrival',
    'Enjoyed at restaurant',
    'Gifted',
    'Sold',
    'Broken'
  )) default 'In cellar',
  -- Purchase info
  purchase_date date,
  purchase_price numeric(8,2),
  purchase_source text,
  auction_lot text,
  -- Consumption info
  consumed_date date,
  restaurant_name text,
  tasting_note text,
  -- Location
  quantity integer default 1
);

-- Enable RLS
alter table wines enable row level security;
alter table bottles enable row level security;

-- Allow all (no auth for now)
create policy "Allow all wines" on wines for all using (true) with check (true);
create policy "Allow all bottles" on bottles for all using (true) with check (true);
