-- ============================================================
-- AI Receptionist — Database Schema
-- ============================================================
-- Run this in Supabase: SQL Editor → New Query → paste → Run
-- ============================================================


-- ------------------------------------------------------------
-- 1. ACCOUNTS
-- One row per business you onboard (POC or Live)
-- ------------------------------------------------------------
create table accounts (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,                        -- e.g. "Riverside Fence Co"
  type                text not null,                        -- e.g. "fence installation"
  status              text not null default 'poc'           -- 'poc' | 'live' | 'cancelled'
                      check (status in ('poc', 'live', 'cancelled')),
  twilio_phone_number text unique,                          -- dedicated number for this account
  dashboard_token     text unique default gen_random_uuid()::text, -- secret URL token
  persona_name        text not null default 'Alex',         -- AI receptionist name
  emergency_protocol  text not null default 'capture-and-notify'
                      check (emergency_protocol in ('capture-and-notify', 'direct-number', 'immediate-sms')),
  emergency_contact   text,                                 -- phone number if protocol = direct-number
  knowledge_base      text,                                 -- compiled text fed into Alex's system prompt
  notify_sms          boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 2. CONTACTS
-- People associated with an account (owner, manager, staff)
-- Only the primary contact gets SMS notifications for POC
-- ------------------------------------------------------------
create table contacts (
  id           uuid primary key default gen_random_uuid(),
  account_id   uuid not null references accounts (id) on delete cascade,
  name         text not null,
  role         text not null default 'owner',               -- 'owner' | 'manager' | 'staff'
  phone        text,
  email        text,
  is_primary   boolean not null default false,              -- only one primary per account
  created_at   timestamptz not null default now()
);

-- Ensure only one primary contact per account
create unique index one_primary_per_account
  on contacts (account_id)
  where is_primary = true;


-- ------------------------------------------------------------
-- 3. KNOWLEDGE BASE SOURCES
-- Raw inputs used to build the account's knowledge base
-- ------------------------------------------------------------
create table knowledge_base_sources (
  id           uuid primary key default gen_random_uuid(),
  account_id   uuid not null references accounts (id) on delete cascade,
  type         text not null
                check (type in ('website', 'google_maps', 'facebook', 'yelp', 'manual')),
  url          text,                                        -- null for manual entries
  content      text not null,                              -- scraped or manually entered text
  created_at   timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 4. LEADS
-- Every customer who contacts an account through Alex
-- ------------------------------------------------------------
create table leads (
  id               uuid primary key default gen_random_uuid(),
  account_id       uuid not null references accounts (id) on delete cascade,
  customer_name    text,
  customer_phone   text not null,
  job_description  text,
  channel          text not null
                   check (channel in ('call', 'sms')),
  status           text not null default 'new'
                   check (status in ('new', 'contacted', 'resolved')),
  created_at       timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 5. CONVERSATIONS
-- Full transcript of every call or SMS exchange
-- ------------------------------------------------------------
create table conversations (
  id               uuid primary key default gen_random_uuid(),
  account_id       uuid not null references accounts (id) on delete cascade,
  lead_id          uuid references leads (id) on delete set null,
  channel          text not null
                   check (channel in ('call', 'sms')),
  customer_phone   text not null,
  messages         jsonb not null default '[]',             -- array of {role, content, timestamp}
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);


-- ------------------------------------------------------------
-- AUTO-UPDATE updated_at ON CHANGE
-- ------------------------------------------------------------
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger accounts_updated_at
  before update on accounts
  for each row execute function update_updated_at();

create trigger conversations_updated_at
  before update on conversations
  for each row execute function update_updated_at();


-- ------------------------------------------------------------
-- INDEXES (makes lookups fast as data grows)
-- ------------------------------------------------------------
create index on contacts (account_id);
create index on knowledge_base_sources (account_id);
create index on leads (account_id);
create index on leads (customer_phone);
create index on leads (status);
create index on conversations (account_id);
create index on conversations (lead_id);
create index on conversations (customer_phone);
