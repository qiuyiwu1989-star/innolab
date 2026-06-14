#!/usr/bin/env node
// 一次性把服务器现有 JSONL 飞轮数据导入自托管 Supabase。
//
// 跑法（在 InnoLab 项目根、且 .env.local 里已有 SUPABASE_URL + SERVICE_ROLE_KEY）：
//   node scripts/migrate-jsonl-to-supabase.mjs          # 安全模式：表非空则跳过
//   node scripts/migrate-jsonl-to-supabase.mjs --force  # 强制再插（可能产生重复，慎用）
//
// 前置：先在 Supabase 跑过 db/schema.sql 建好表。
// 安全：service_role key 只从 env / .env.local 读，不打印。

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const FORCE = process.argv.includes("--force");
const ROOT = process.cwd();
const DATA = path.join(ROOT, "data");

// ── 读 env（优先 process.env，回落解析 .env.local）─────────────────────────
function loadEnv() {
  let url = process.env.SUPABASE_URL;
  let key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    const f = path.join(ROOT, ".env.local");
    if (fs.existsSync(f)) {
      for (const line of fs.readFileSync(f, "utf8").split("\n")) {
        const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
        if (!m) continue;
        const v = m[2].replace(/^["']|["']$/g, "");
        if (m[1] === "SUPABASE_URL" && !url) url = v;
        if (m[1] === "SUPABASE_SERVICE_ROLE_KEY" && !key) key = v;
      }
    }
  }
  return { url, key };
}

const { url, key } = loadEnv();
if (!url || !key) {
  console.error("✗ 缺少 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY（env 或 .env.local）");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

function readJsonl(file) {
  const f = path.join(DATA, file);
  if (!fs.existsSync(f)) return [];
  const out = [];
  for (const line of fs.readFileSync(f, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line)); } catch { /* skip */ }
  }
  return out;
}

async function tableCount(table) {
  const { count, error } = await sb.from(table).select("id", { count: "exact", head: true });
  if (error) throw new Error(`${table} 计数失败: ${error.message}`);
  return count ?? 0;
}

async function insertBatched(table, rows) {
  const SIZE = 500;
  let done = 0;
  for (let i = 0; i < rows.length; i += SIZE) {
    const batch = rows.slice(i, i + SIZE);
    const { error } = await sb.from(table).insert(batch);
    if (error) throw new Error(`${table} 插入失败: ${error.message}`);
    done += batch.length;
    process.stdout.write(`\r  ${table}: ${done}/${rows.length}`);
  }
  if (rows.length) process.stdout.write("\n");
}

async function main() {
  console.log(`→ 目标 Supabase: ${url}`);
  console.log(`→ 模式: ${FORCE ? "强制(--force)" : "安全(表非空则跳过)"}\n`);

  // 1) 对话
  const convs = readJsonl("conversations.jsonl");
  const candTs = new Set(readJsonl("candidate-cases.jsonl").map((c) => c.ts).filter(Boolean));
  const convCount = await tableCount("innolab_conversations");
  if (convCount > 0 && !FORCE) {
    console.log(`• innolab_conversations 已有 ${convCount} 行 → 跳过（--force 可覆盖追加）`);
  } else if (convs.length) {
    const rows = convs.map((c) => ({
      ts: c.ts,
      access_label: c.access_label ?? null,
      domain: c.domain ?? null,
      source: c.source ?? null,
      is_follow_up: !!c.is_follow_up,
      follow_up_kind: c.follow_up_kind ?? null,
      prompt: c.prompt ?? null,
      output: c.output ?? null,
      prompt_length: c.prompt_length ?? 0,
      output_length: c.output_length ?? 0,
      ip_hash: c.ip_hash ?? null,
      completed: !!c.completed,
      user_key: c.user_key ?? null,
      is_candidate: candTs.has(c.ts),
    }));
    await insertBatched("innolab_conversations", rows);
    console.log(`✓ 对话导入 ${rows.length} 条（其中候选案例 ${[...candTs].length} 条）`);
  } else {
    console.log("• 无 conversations.jsonl 数据");
  }

  // 2) 留资（upsert，安全可重跑）
  const regs = readJsonl("registrations.jsonl");
  if (regs.length) {
    // 同 user_key 保留最新（jsonl 后写覆盖）
    const byKey = new Map();
    for (const r of regs) if (r.user_key) byKey.set(r.user_key, r);
    const rows = [...byKey.values()].map((r) => ({
      ts: r.ts,
      user_key: r.user_key,
      name: r.name ?? null,
      company: r.company ?? null,
      contact: r.contact ?? null,
      contact_type: r.contact_type ?? null,
    }));
    const { error } = await sb.from("innolab_registrations").upsert(rows, { onConflict: "user_key" });
    if (error) throw new Error(`留资 upsert 失败: ${error.message}`);
    console.log(`✓ 留资 upsert ${rows.length} 人`);
  } else {
    console.log("• 无 registrations.jsonl 数据");
  }

  // 3) 反馈
  const fb = readJsonl("feedback.jsonl");
  const fbCount = await tableCount("innolab_feedback");
  if (fbCount > 0 && !FORCE) {
    console.log(`• innolab_feedback 已有 ${fbCount} 行 → 跳过`);
  } else if (fb.length) {
    const rows = fb.map((f) => ({
      ts: f.ts,
      kind: f.kind ?? null,
      prompt: f.prompt ?? null,
      domain: f.domain ?? null,
      note: f.note ?? null,
      ip_hash: f.ip_hash ?? null,
    }));
    await insertBatched("innolab_feedback", rows);
    console.log(`✓ 反馈导入 ${rows.length} 条`);
  } else {
    console.log("• 无 feedback.jsonl 数据");
  }

  console.log("\n校验：");
  console.log(`  innolab_conversations = ${await tableCount("innolab_conversations")}`);
  console.log(`  innolab_registrations = ${await tableCount("innolab_registrations")}`);
  console.log(`  innolab_feedback      = ${await tableCount("innolab_feedback")}`);
  console.log("\n✓ 迁移完成。把 SUPABASE_URL + SERVICE_ROLE_KEY 留在 .env.local，重启即走 DB。");
}

main().catch((e) => { console.error("\n✗ 迁移失败:", e.message); process.exit(1); });
