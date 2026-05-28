alter table public.profiles
  add column if not exists preferred_locale text not null default 'ko-KR';

alter table public.profiles
  drop constraint if exists profiles_preferred_locale_check;

alter table public.profiles
  add constraint profiles_preferred_locale_check
  check (preferred_locale in ('ko-KR', 'en-US', 'zh-CN'));

create index if not exists profiles_preferred_locale_idx
  on public.profiles(preferred_locale);
