/**
 * AntriQ schema. Plain SQL so the exact same statements run on:
 *  - PGlite (zero-config local dev, WASM Postgres)
 *  - Postgres / Neon / Supabase / Vercel Postgres in production
 */
export const SCHEMA_STATEMENTS: string[] = [
  `create table if not exists restaurant (
    id integer primary key,
    name text not null,
    tagline text,
    address text,
    phone text,
    instagram text,
    timezone text not null default 'Asia/Jakarta',
    open_time text not null default '11:00',
    close_time text not null default '22:30',
    accent text not null default '#C8452B',
    announcement text,
    waitlist_status text not null default 'open' check (waitlist_status in ('open','paused','closed')),
    pause_reason text,
    avg_turn_minutes integer not null default 55 check (avg_turn_minutes between 10 and 240),
    hold_minutes integer not null default 8 check (hold_minutes between 2 and 30),
    max_party_size integer not null default 12 check (max_party_size between 1 and 40),
    max_queue_size integer not null default 40 check (max_queue_size between 1 and 500),
    auto_no_show boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`,

  `create table if not exists staff (
    id serial primary key,
    name text not null,
    role text not null check (role in ('owner','greeter')),
    pin_hash text not null,
    initials text,
    active boolean not null default true,
    created_at timestamptz not null default now()
  )`,

  `create table if not exists dining_tables (
    id serial primary key,
    label text not null unique,
    capacity integer not null check (capacity between 1 and 40),
    zone text not null default 'Main dining',
    status text not null default 'available' check (status in ('available','seated','dirty','blocked')),
    status_changed_at timestamptz not null default now(),
    sort_order integer not null default 0,
    created_at timestamptz not null default now()
  )`,

  `create table if not exists queue_entries (
    id serial primary key,
    token text not null unique,
    code text not null,
    day date not null,
    seq integer not null,
    guest_name text not null,
    phone text,
    party_size integer not null check (party_size between 1 and 40),
    notes text,
    source text not null default 'qr' check (source in ('qr','online','walkin')),
    status text not null default 'waiting' check (status in ('waiting','called','seated','completed','no_show','cancelled')),
    table_id integer references dining_tables(id) on delete set null,
    called_count integer not null default 0,
    acknowledged boolean not null default false,
    joined_at timestamptz not null default now(),
    called_at timestamptz,
    hold_expires_at timestamptz,
    seated_at timestamptz,
    closed_at timestamptz,
    cancelled_by text,
    unique (day, seq)
  )`,

  `create table if not exists queue_sequence (
    restaurant_id integer not null,
    day date not null,
    last_seq integer not null,
    primary key (restaurant_id, day)
  )`,

  `create table if not exists activity (
    id serial primary key,
    type text not null,
    entry_id integer,
    table_id integer,
    actor text,
    detail jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  )`,

  `create index if not exists queue_entries_status_idx on queue_entries (status, joined_at)`,
  `create index if not exists queue_entries_day_idx on queue_entries (day)`,
  `create index if not exists queue_entries_token_idx on queue_entries (token)`,
  `create index if not exists activity_created_idx on activity (created_at desc)`,
  `create index if not exists dining_tables_status_idx on dining_tables (status)`,
];

export const RESTAURANT_ID = 1;
