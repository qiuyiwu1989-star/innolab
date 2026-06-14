#!/usr/bin/env python3
"""
InnoLab 一键安全部署（paramiko 版，零额外依赖）—— 根除 502 反复。

用法:  python3 deploy.py

安全原则（针对过去反复出现的 502）:
  1. 先本地 build，RC≠0 立即中止 —— 坏代码绝不上服务器
  2. SFTP 同步「改动过的源码目录」（src/ cases/ methods/ 等），不碰 .next/node_modules/data/.env.local
  3. 服务器 build；RC≠0 则保留旧 .next + 运行中进程不动 —— 站点不挂
  4. 只有 build 成功才 pm2 restart
  5. 部署后健康检查；任何一步失败明确报错并保护现场

密码：环境变量 INNOLAB_SSH_PASS，或运行时交互输入。
"""
import os
import sys
import subprocess
import time
import getpass

HOST = "43.159.171.3"
USER = "ubuntu"
REMOTE = "/home/ubuntu/innolab"
PM2_APP = "innolab"
SITE_URL = "https://innolab.cc/"

# 需要同步的源码路径（白名单，避免误传 .next/node_modules/data）
SYNC_PATHS = [
    "src", "cases", "methods", "public", "db", "scripts",
    "package.json", "package-lock.json", "next.config.ts",
    "tsconfig.json", "postcss.config.mjs", "SYSTEM_PROMPT.md",
]

G, R, Y, X = "\033[32m", "\033[31m", "\033[33m", "\033[0m"
def step(m): print(f"{Y}▶ {m}{X}")
def ok(m): print(f"{G}✓ {m}{X}")
def die(m): print(f"{R}✗ {m}{X}"); sys.exit(1)


def main():
    if not os.path.exists("package.json"):
        die("请在项目根目录运行")

    try:
        import paramiko
    except ImportError:
        die("缺少 paramiko：pip3 install paramiko")

    pw = os.environ.get("INNOLAB_SSH_PASS") or getpass.getpass("服务器密码: ")

    # ── 1. 本地 build 守门 ──────────────────────────
    step("本地 build 验证…")
    r = subprocess.run("npm run build", shell=True, capture_output=True, text=True)
    if r.returncode != 0 or "Compiled successfully" not in (r.stdout + r.stderr):
        print((r.stdout + r.stderr)[-1500:])
        die("本地 build 失败 —— 已中止，服务器未受影响")
    ok("本地 build 通过")

    # ── 连接 ────────────────────────────────────────
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=pw)

    def run(cmd, timeout=420):
        i, o, e = ssh.exec_command(cmd, timeout=timeout)
        o.channel.recv_exit_status()
        return o.read().decode() + e.read().decode()

    # ── 2. 同步源码（rsync over ssh，更快更可靠）──────
    step("同步源码…")
    # 优先用本地 rsync（若有），否则回退 SFTP 递归
    if subprocess.run("command -v rsync && command -v sshpass", shell=True,
                      capture_output=True).returncode == 0:
        rsh = f"sshpass -p {pw} ssh -o StrictHostKeyChecking=no"
        paths = " ".join(SYNC_PATHS)
        rc = subprocess.run(
            f"rsync -az -e '{rsh}' {paths} {USER}@{HOST}:{REMOTE}/",
            shell=True).returncode
        if rc != 0:
            die("rsync 失败")
    else:
        sftp = ssh.open_sftp()
        def put_dir(local, remote):
            run(f"mkdir -p {remote}")
            for name in os.listdir(local):
                lp, rp = os.path.join(local, name), f"{remote}/{name}"
                if name in (".next", "node_modules", ".git", "data"):
                    continue
                if os.path.isdir(lp):
                    put_dir(lp, rp)
                else:
                    sftp.put(lp, rp)
        for p in SYNC_PATHS:
            if os.path.isdir(p):
                put_dir(p, f"{REMOTE}/{p}")
            elif os.path.isfile(p):
                sftp.put(p, f"{REMOTE}/{p}")
        sftp.close()
    ok("源码已同步")

    # ── 2.5 安装依赖（package.json 可能新增依赖，如 @supabase/supabase-js）──
    step("服务器安装依赖…")
    inst = run("cd " + REMOTE + " && source ~/.nvm/nvm.sh && "
               "npm install --no-audit --no-fund 2>&1 | tail -3; "
               "echo RC=${PIPESTATUS[0]}")
    print(inst.strip())
    if "RC=0" not in inst:
        ssh.close()
        die("依赖安装失败 —— 旧 .next 与运行进程未动，站点仍在线")
    ok("依赖就绪")

    # ── 3. 服务器 build（失败保留旧站点）─────────────
    step("服务器 build…")
    out = run(f"cd {REMOTE} && source ~/.nvm/nvm.sh && npm run build 2>&1 | tail -3; "
              f"echo RC=${{PIPESTATUS[0]}}")
    print(out.strip())
    if "RC=0" not in out:
        ssh.close()
        die("服务器 build 失败 —— 旧 .next 与运行进程未动，站点仍在线")
    ok("服务器 build 成功")

    # ── 4. 重启 ─────────────────────────────────────
    step("重启 pm2…")
    run(f"source ~/.nvm/nvm.sh && pm2 restart {PM2_APP} --update-env")
    ok("已重启")

    # ── 5. 健康检查 ─────────────────────────────────
    step("健康检查…")
    time.sleep(6)
    code = "000"
    for i in range(1, 6):
        code = run(f"curl -s -m8 -o /dev/null -w '%{{http_code}}' {SITE_URL}").strip()
        if code == "200":
            ok(f"站点在线 (HTTP 200)")
            break
        print(f"  第 {i} 次：{code}，重试…")
        time.sleep(4)
    ssh.close()
    if code != "200":
        die(f"健康检查失败：{code} —— 请查 pm2 logs {PM2_APP}")

    print()
    ok(f"部署完成 —— {SITE_URL}")
    print(f"{Y}提示：git commit + push 让 GitHub 与线上同步{X}")


if __name__ == "__main__":
    main()
