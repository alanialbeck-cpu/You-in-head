-- Таблица лидеров: анонимные записи (никнейм + счёт)
create table if not exists public.leaderboard (
  id          uuid        primary key default gen_random_uuid(),
  nickname    text        not null check(length(nickname) between 1 and 20),
  score       integer     not null check(score >= 0),
  created_at  timestamptz not null default now()
);

-- Row Level Security включаем обязательно
alter table public.leaderboard enable row level security;

-- Все могут читать
create policy "leaderboard public read"
  on public.leaderboard for select
  using (true);

-- Все могут вставлять (без авторизации)
create policy "leaderboard public insert"
  on public.leaderboard for insert
  with check (true);

-- Индекс для быстрой сортировки по счёту
create index if not exists leaderboard_score_idx on public.leaderboard (score desc);
