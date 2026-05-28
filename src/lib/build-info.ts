// 编译时读取的构建信息，footer 显示用。
// SSR / build 期间执行一次（Node 环境）。客户端用静态值，不重新读。

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

interface BuildInfo {
  sha: string;
  shortSha: string;
  builtAt: string; // ISO
  version: string;
}

let _info: BuildInfo | null = null;

function safeExec(cmd: string): string {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

function readPackageVersion(): string {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
    );
    return typeof pkg.version === "string" ? pkg.version : "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export function getBuildInfo(): BuildInfo {
  if (_info) return _info;
  // 优先用 env（部署时可以 inject），否则 git rev-parse
  const sha =
    process.env.NEXT_PUBLIC_GIT_SHA ||
    process.env.GIT_SHA ||
    safeExec("git rev-parse HEAD") ||
    "unknown";
  const shortSha = sha.slice(0, 7);
  const builtAt =
    process.env.NEXT_PUBLIC_BUILD_TIME ||
    process.env.BUILD_TIME ||
    new Date().toISOString();
  const version = readPackageVersion();
  _info = { sha, shortSha, builtAt, version };
  return _info;
}
