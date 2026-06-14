-- InnoLab 飞轮数据表 —— 自托管 Supabase / Postgres（sb.ai.zaowuyun.com）
-- 统一 innolab_ 前缀，避免与共享库其他应用撞表。
-- 跑法：Supabase Studio 的 SQL Editor 粘贴执行一次；或
--       psql "$DATABASE_URL" -f db/schema.sql
--
-- 安全：开启 RLS 且不建任何 policy → 公网 anon key 读不到这些表（保护 PII）；
--       服务端用 service_role key 走 PostgREST，天然绕过 RLS，照常读写。

-- ── 对话（飞轮燃料：prompt + output + 授权人 + 领域 + 时间）────────────────
create table if not exists innolab_conversations (
  id             bigserial primary key,
  ts             text not null,            -- ISO 字符串，业务时间戳（与前端一致，便于精确定位）
  access_label   text,
  domain         text,
  source         text,
  is_follow_up   boolean default false,
  follow_up_kind text,
  prompt         text,
  output         text,
  prompt_length  integer default 0,
  output_length  integer default 0,
  ip_hash        text,
  completed      boolean default false,
  user_key       text,                     -- 留资派生的稳定用户标识（画像归属）
  is_candidate   boolean default false,    -- 飞轮第②圈：标记为候选案例
  created_at     timestamptz default now()
);
create index if not exists idx_innolab_conv_ts on innolab_conversations (ts desc);
create index if not exists idx_innolab_conv_userkey on innolab_conversations (user_key);
create index if not exists idx_innolab_conv_candidate
  on innolab_conversations (is_candidate) where is_candidate = true;

-- ── 留资（飞轮的「人」维度，user_key 唯一 → 再次留资 upsert 覆盖）──────────
create table if not exists innolab_registrations (
  id           bigserial primary key,
  ts           text not null,
  user_key     text not null unique,
  name         text,
  company      text,
  contact      text,                       -- 手机/邮箱原文，仅后台回访用
  contact_type text,                       -- phone | email | other
  created_at   timestamptz default now()
);

-- ── 反馈（飞轮第③圈：👍/👎 反推优化引擎）───────────────────────────────────
create table if not exists innolab_feedback (
  id         bigserial primary key,
  ts         text not null,
  kind       text,                         -- up | down
  prompt     text,
  domain     text,
  note       text,                         -- 👎 时的吐槽，最有价值
  ip_hash    text,
  created_at timestamptz default now()
);

-- ── RLS：开启但不放任何 policy（service_role 绕过，anon 无权）────────────────
alter table innolab_conversations enable row level security;
alter table innolab_registrations enable row level security;
alter table innolab_feedback       enable row level security;
