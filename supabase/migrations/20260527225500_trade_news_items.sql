create table if not exists public.trade_news_items (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('customs', 'market', 'government', 'industry', 'global', 'auxiliary')),
  source text not null,
  source_type text not null,
  title text not null,
  summary text not null,
  url text not null,
  published_at timestamptz,
  published_label text,
  country_name text,
  reliability text not null,
  status text not null default 'live',
  content_hash text not null unique,
  collected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trade_news_items_category_published_idx
  on public.trade_news_items(category, published_at desc nulls last);

create index if not exists trade_news_items_country_idx
  on public.trade_news_items(country_name)
  where country_name is not null;

alter table public.trade_news_items enable row level security;
