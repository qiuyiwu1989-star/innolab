// 留资注册落盘 — 飞轮的「人」维度。
// 用户输公开暗号 + 留手机/邮箱 + 称呼/公司 → 写入存储。
// 配合 conversations 的 user_key，飞轮即可「按人看画像」。
//
// 双后端（见 db.ts）：配了 Supabase → innolab_registrations（user_key 唯一，upsert 保留最新）；
//                      没配 → 本地 registrations.jsonl（append，读时按 user_key 去重保留最新）。
//
// 隐私：仅授权熟人场景；联系方式仅用于邱懿武回访。不进 git。

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { db, dbEnabled, dbSelectAll, T } from "./db";

const DATA_DIR = path.join(process.cwd(), "data");
const REG_FILE = path.join(DATA_DIR, "registrations.jsonl");

export interface Registration {
  ts: string;
  /** 稳定用户标识：由联系方式哈希派生，跨设备/会话一致 */
  user_key: string;
  /** 称呼 */
  name: string;
  /** 公司 / 身份（选填） */
  company: string;
  /** 联系方式原文（手机或邮箱，至少一个）—— 仅你后台可见，用于回访 */
  contact: string;
  /** 联系方式类型 */
  contact_type: "phone" | "email" | "other";
}

/** 由联系方式生成稳定 user_key（同一手机/邮箱 → 同一 key，跨会话归属） */
export function deriveUserKey(contact: string): string {
  return crypto
    .createHash("sha256")
    .update(contact.trim().toLowerCase() + (process.env.IP_SALT ?? "innolab"))
    .digest("hex")
    .slice(0, 12);
}

/** 判断联系方式类型 */
export function contactType(contact: string): "phone" | "email" | "other" {
  const c = contact.trim();
  if (/^1[3-9]\d{9}$/.test(c)) return "phone";
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) return "email";
  return "other";
}

/** 追加一条注册记录（失败静默，不阻塞用户进入工作台） */
export async function appendRegistration(rec: Registration): Promise<void> {
  if (dbEnabled) {
    try {
      await db()!
        .from(T.registrations)
        .upsert(
          {
            ts: rec.ts,
            user_key: rec.user_key,
            name: rec.name,
            company: rec.company,
            contact: rec.contact,
            contact_type: rec.contact_type,
          },
          { onConflict: "user_key" }, // 同一人再次留资 → 覆盖为最新
        );
    } catch {
      /* noop */
    }
    return;
  }
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.appendFileSync(REG_FILE, JSON.stringify(rec) + "\n", "utf8");
  } catch {
    /* noop */
  }
}

/** 读取所有注册记录（去重：同 user_key 保留最新） */
export async function readRegistrations(): Promise<Registration[]> {
  if (dbEnabled) {
    // user_key 唯一，DB 里天然去重
    return dbSelectAll<Registration>(T.registrations, "ts");
  }
  try {
    if (!fs.existsSync(REG_FILE)) return [];
    const raw = fs.readFileSync(REG_FILE, "utf8");
    const byKey = new Map<string, Registration>();
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      try {
        const r = JSON.parse(line) as Registration;
        byKey.set(r.user_key, r); // 后写覆盖 → 保留最新
      } catch {
        /* skip */
      }
    }
    return Array.from(byKey.values());
  } catch {
    return [];
  }
}

/** 按 user_key 取注册信息 */
export async function getRegistration(
  userKey: string,
): Promise<Registration | null> {
  return (await readRegistrations()).find((r) => r.user_key === userKey) ?? null;
}
