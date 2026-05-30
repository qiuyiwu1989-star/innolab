// 留资注册落盘 — 飞轮的「人」维度。
// 用户输公开暗号 + 留手机/邮箱 + 称呼/公司 → 写入 registrations.jsonl。
// 配合 conversations.jsonl 的 user_key，飞轮即可「按人看画像」。
//
// 隐私：仅授权熟人场景；联系方式仅用于邱懿武回访。append-only，不进 git。

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

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
export function appendRegistration(rec: Registration): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.appendFileSync(REG_FILE, JSON.stringify(rec) + "\n", "utf8");
  } catch {
    /* noop */
  }
}

/** 读取所有注册记录（去重：同 user_key 保留最新） */
export function readRegistrations(): Registration[] {
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
export function getRegistration(userKey: string): Registration | null {
  return readRegistrations().find((r) => r.user_key === userKey) ?? null;
}
