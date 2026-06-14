// 数据库接入层 —— 飞轮数据的「持久仓」。
//
// 设计原则（和 web-search.ts 同样的「有就用、没就降级」）：
//   ① 配了 SUPABASE_URL + SERVICE_ROLE_KEY → 走 Supabase（自托管 sb.ai.zaowuyun.com）
//   ② 没配 → dbEnabled=false，conversation-log/registration-log 自动回落到本地 JSONL
//   这样本地开发 / 切换前的线上都照旧跑，配上 env 即「秒切」到 DB，去掉 env 即「秒回」。
//
// 为什么走 Supabase HTTPS 而不是直连 Postgres：
//   InnoLab 跑在 43.159.171.3，中台共享库只在 122.51.221.171 内网（外部连不到）。
//   自托管 Supabase 的网关 sb.ai.zaowuyun.com 是公网 HTTPS，从任意服务器都能连。
//
// 安全：service_role key 只进服务器 .env.local（chmod 600），绝不进 git / 日志 / 前端。
//   它绕过 RLS，只能在服务端用（本文件只被 server 代码 import）。

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** 是否已配置 DB。false → 全线回落 JSONL（行为与迁移前完全一致）。 */
export const dbEnabled = Boolean(URL && SERVICE_KEY);

/** 表名（统一 innolab_ 前缀，避免和共享库其他应用撞表） */
export const T = {
  conversations: "innolab_conversations",
  registrations: "innolab_registrations",
  feedback: "innolab_feedback",
} as const;

let _client: SupabaseClient | null = null;

/** 取 Supabase 客户端（未配置返回 null）。服务端专用。 */
export function db(): SupabaseClient | null {
  if (!dbEnabled) return null;
  if (!_client) {
    _client = createClient(URL!, SERVICE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _client;
}

/**
 * 分页拉全表（绕开 PostgREST 默认 max-rows 上限，避免静默截断）。
 * 飞轮数据量不大；按 ts 倒序（最新在前），与 JSONL 读法保持一致。
 */
export async function dbSelectAll<T = Record<string, unknown>>(
  table: string,
  orderCol = "ts",
): Promise<T[]> {
  const client = db();
  if (!client) return [];
  const PAGE = 1000;
  const all: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await client
      .from(table)
      .select("*")
      .order(orderCol, { ascending: false })
      .range(from, from + PAGE - 1);
    if (error || !data || data.length === 0) break;
    all.push(...(data as T[]));
    if (data.length < PAGE) break;
  }
  return all;
}
