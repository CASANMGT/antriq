/**
 * AntriQ schema v3 — brands → branches.
 *
 * Every operational row is branch-scoped. Brands own identity/assets; branches
 * own hours, tables, staff assignment and the live queue.
 */
export const SCHEMA_STATEMENTS: string[] = [
  `create table if not exists brands (
    id serial primary key,
    name text not null,
    slug text not null unique,
    instagram text,
    description text,
    accent text not null default '#F24B3F',
    logo_data bytea,
    logo_mime text,
    menu_data bytea,
    menu_mime text,
    menu_filename text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`,

  `create table if not exists branches (
    id serial primary key,
    brand_id integer not null references brands(id) on delete cascade,
    name text not null,
    slug text not null,
    tagline text,
    address text,
    phone text,
    timezone text not null default 'Asia/Jakarta',
    open_time text not null default '11:00',
    close_time text not null default '23:30',
    accent text,
    announcement text,
    waitlist_status text not null default 'open' check (waitlist_status in ('open','paused','closed')),
    pause_reason text,
    seating_mode text not null default 'queue' check (seating_mode in ('queue','manual','plan')),
    avg_turn_minutes integer not null default 55 check (avg_turn_minutes between 10 and 240),
    hold_minutes integer not null default 3 check (hold_minutes between 2 and 30),
    acknowledge_action text not null default 'pause' check (acknowledge_action in ('pause','extend')),
    acknowledge_minutes integer not null default 3 check (acknowledge_minutes between 1 and 30),
    max_party_size integer not null default 12 check (max_party_size between 1 and 40),
    max_queue_size integer not null default 40 check (max_queue_size between 1 and 500),
    auto_no_show boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (brand_id, slug)
  )`,

  `create table if not exists staff (
    id serial primary key,
    name text not null,
    role text not null check (role in ('owner','greeter','cashier')),
    pin_hash text not null,
    initials text,
    brand_id integer references brands(id) on delete set null,
    branch_id integer references branches(id) on delete set null,
    active boolean not null default true,
    created_at timestamptz not null default now()
  )`,

  `create table if not exists dining_tables (
    id serial primary key,
    branch_id integer not null references branches(id) on delete cascade,
    label text not null,
    capacity integer not null check (capacity between 1 and 40),
    zone text not null default 'Area utama',
    status text not null default 'available' check (status in ('available','seated','dirty','blocked')),
    status_changed_at timestamptz not null default now(),
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    unique (branch_id, label)
  )`,

  `create table if not exists queue_entries (
    id serial primary key,
    branch_id integer not null references branches(id) on delete cascade,
    token text not null unique,
    code text not null,
    day date not null,
    seq integer not null,
    category text not null default 'A',
    guest_name text not null,
    phone text,
    party_size integer not null check (party_size between 1 and 40),
    notes text,
    source text not null default 'qr' check (source in ('qr','online','walkin')),
    status text not null default 'waiting' check (status in ('waiting','called','seated','completed','no_show','cancelled')),
    table_id integer references dining_tables(id) on delete set null,
    seat_number integer,
    opened_by text,
    opened_by_staff_id integer references staff(id) on delete set null,
    released_by text,
    released_by_staff_id integer references staff(id) on delete set null,
    called_count integer not null default 0,
    acknowledged boolean not null default false,
    joined_at timestamptz not null default now(),
    called_at timestamptz,
    hold_expires_at timestamptz,
    seated_at timestamptz,
    closed_at timestamptz,
    cancelled_by text,
    unique (branch_id, day, seq)
  )`,

  `create table if not exists queue_sequence (
    branch_id integer not null references branches(id) on delete cascade,
    day date not null,
    last_seq integer not null,
    primary key (branch_id, day)
  )`,

  `create table if not exists activity (
    id serial primary key,
    branch_id integer references branches(id) on delete cascade,
    type text not null,
    entry_id integer,
    table_id integer,
    actor text,
    detail jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  )`,

  `create table if not exists app_meta (
    key text primary key,
    value text not null,
    updated_at timestamptz not null default now()
  )`,

  /* v0.3.1 — seat release audit + 3-minute call countdown default. */
  `alter table branches alter column hold_minutes set default 3`,
  `alter table branches add column if not exists acknowledge_action text not null default 'pause'`,
  `alter table branches add column if not exists acknowledge_minutes integer not null default 3`,
  `alter table branches add column if not exists seating_mode text not null default 'queue'`,
  `alter table branches alter column seating_mode set default 'queue'`,
  `alter table branches drop constraint if exists branches_seating_mode_check`,
  `alter table branches add constraint branches_seating_mode_check check (seating_mode in ('queue','manual','plan'))`,
  `alter table queue_entries add column if not exists category text not null default 'A'`,
  `alter table queue_entries add column if not exists released_by text`,
  `alter table queue_entries add column if not exists released_by_staff_id integer references staff(id) on delete set null`,

  `create index if not exists branches_brand_idx on branches (brand_id)`,
  `create index if not exists staff_brand_branch_idx on staff (brand_id, branch_id)`,
  `create index if not exists queue_entries_branch_status_idx on queue_entries (branch_id, status, joined_at)`,
  `create index if not exists queue_entries_branch_day_idx on queue_entries (branch_id, day)`,
  `create index if not exists queue_entries_token_idx on queue_entries (token)`,
  `create index if not exists queue_entries_branch_category_idx on queue_entries (branch_id, category, status, joined_at)`,
  `create index if not exists dining_tables_branch_status_idx on dining_tables (branch_id, status)`,
  `create index if not exists activity_branch_created_idx on activity (branch_id, created_at desc)`,

  /* Keep at most one active seated entry per table. */
  `update queue_entries qe
     set status = 'completed', closed_at = coalesce(qe.closed_at, now())
     where qe.status = 'seated' and qe.table_id is not null
       and qe.id <> (
         select q2.id from queue_entries q2
         where q2.table_id = qe.table_id and q2.status = 'seated'
         order by q2.seated_at desc nulls last, q2.id desc
         limit 1
       )`,
  `create unique index if not exists queue_entries_one_active_seat_idx
     on queue_entries (table_id) where status = 'seated' and table_id is not null`,
];

export const PRIMARY_BRANCH_ID = 1;
