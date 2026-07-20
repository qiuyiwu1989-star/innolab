// 浏览器端 Supabase 客户端（仅用于账号登录 / 会话）。
// 用 anon public key（设计上就公开、烘进客户端）；未配置则返回 null，页面降级提示。
// 数据读取不走这里——「我的」页把会话 token 交给服务端 /api/me，由 service_role 取数（避免客户端 RLS）。
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = !!(URL && ANON);

let _client: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  if (!_client) {
    _client = createClient(URL!, ANON!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // 自动处理 magic-link 回跳里的 token
      },
    });
  }
  return _client;
}
