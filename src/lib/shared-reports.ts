// 可分享的推演报告 —— 只有用户主动"分享"的那一份才落盘公开。
// 存法：服务器本地文件 data/shared/<随机id>.json（deploy 白名单不含 data/，持久）。
// 随机 16-hex id 不可枚举；读取时正则守 id、防路径穿越。
// （用文件而非 Supabase：新建表需后台 DDL；文件方案零依赖、完全自主。将来可迁库。）

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const DIR = path.join(process.cwd(), "data", "shared");
const ID_RE = /^[a-f0-9]{16}$/;

export interface SharedReport {
  id: string;
  prompt: string;
  output: string;
  domain?: string;
  ts: string;
}

/** 存一份分享报告，返回随机 id。 */
export function saveSharedReport(r: {
  prompt: string;
  output: string;
  domain?: string;
}): string {
  const id = crypto.randomBytes(8).toString("hex"); // 16 hex
  try {
    fs.mkdirSync(DIR, { recursive: true });
  } catch {
    /* noop */
  }
  const rec: SharedReport = {
    id,
    prompt: r.prompt,
    output: r.output,
    domain: r.domain,
    ts: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(DIR, `${id}.json`), JSON.stringify(rec));
  return id;
}

/** 按 id 读一份分享报告；不存在 / id 非法 → null。 */
export function readSharedReport(id: string): SharedReport | null {
  if (!ID_RE.test(id)) return null;
  try {
    const raw = fs.readFileSync(path.join(DIR, `${id}.json`), "utf8");
    return JSON.parse(raw) as SharedReport;
  } catch {
    return null;
  }
}
