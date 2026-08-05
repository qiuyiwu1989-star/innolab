#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
构建 InnoLab 对外版 skill 包。

单一真源：methods/ + cases/ + references/METHOD_INDEX.md 与网站共用，
本脚本只做「私人版 → 对外版」的投影：
  1. 换上对外版 SKILL.md（skill-dist/SKILL.md），私人版 SKILL.md 不动
  2. 脱敏：真人姓名、内部引用 token
  3. 自动同步方法数（根治 skill/网站数量漂移）
  4. 安全闸门：产物里若残留任何敏感词，直接中止，不出包

用法：  python3 scripts/build-skill.py
产物：  dist/innolab/ 与 dist/innolab-skill-v<版本>.zip
"""

import json
import re
import shutil
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist" / "innolab"

ENGINES = [
    ("cognition", "认知"),
    ("strategy", "战略"),
    ("generation", "生成"),
    ("decision", "决策"),
    ("product", "产品"),
    ("evolution", "进化"),
]

# 脱敏：真人姓名 → 角色。仅作用于产物，源文件保留真名。
REDACTIONS = [
    # 真实团队名单 —— 保留「12 人跨职能」这个结构事实，去掉所有人名
    (r"团队：12\s*人（[^）]*）", "团队：12 人（CEO + 产品 + 设计 + AI 架构 + GPU 工程等跨职能配置）"),
    (r"AIIP\s*项目\s*12\s*人团队（[^）]*）", "AIIP 项目 12 人跨职能团队（CEO + 产品 + 设计 + AI 架构 + GPU 工程等）"),
    # IP 角色名以真人姓氏命名 → 换成同主题化名
    (r"老蔡", "老茶"),
    (r"OldCai", "LaoCha"),
    # 其余团队成员姓名（若出现在别处）
    (r"诗中", "产品负责人"),
    (r"胡艺", "设计负责人"),
    (r"老沙", "GPU 工程"),
]

# 产物中绝不允许出现的东西；命中即中止构建。
# 只放「通用形状」的规则——具体的密码片段/服务器地址写在下面那个本地黑名单里，
# 免得防泄漏的规则本身把秘密泄漏进这个公开仓库。
FORBIDDEN = [
    r"老蔡", r"诗中", r"胡艺", r"老沙",                     # 真人姓名
    r"wiki_obj_token",                                      # 内部引用 token
    r"sk-[A-Za-z0-9]{20}", r"tp-[A-Za-z0-9]{20}",           # 模型 API key
    r"ilmcp_[a-f0-9]{8}", r"iladm_[a-f0-9]{8}",             # 自签发凭据
    r"eyJhbGciOi",                                          # JWT
    r"\b(?:\d{1,3}\.){3}\d{1,3}\b",                         # 任何 IPv4
    r"1[3-9]\d{9}(?!\d)",                                   # 手机号
    r"(?i)(password|passwd|secret|token)\s*[:=]\s*\S{6,}",  # 明文赋值
]

# 本地私密黑名单（每行一个字面量，不进 git）：服务器密码片段、内网地址等
_BLOCK = ROOT / "谱" / "私密" / "blocklist.txt"
if _BLOCK.exists():
    FORBIDDEN += [
        re.escape(line.strip())
        for line in _BLOCK.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.startswith("#")
    ]


def count_methods():
    """按引擎统计方法卡数量（.md 排除 .guide.md）。"""
    counts = {}
    for eng, zh in ENGINES:
        d = ROOT / "methods" / eng
        counts[eng] = len([p for p in d.glob("*.md") if not p.name.endswith(".guide.md")])
    return counts


def sync_counts(text, counts, n_case=None):
    """把方法数/案例数写实——彻底消灭 skill 与网站数量对不上的漂移。"""
    total = sum(counts.values())
    breakdown = " / ".join(f"{zh} {counts[eng]}" for eng, zh in ENGINES)
    n_file = total * 2  # 每个方法一张卡 + 一篇指南

    text = re.sub(
        r"收录 \*?\*?\d+ 个方法论\*?\*?（[^）]*）",
        f"收录 **{total} 个方法论**（{breakdown}）",
        text,
    )
    text = re.sub(r"\d+ 个方法论", f"{total} 个方法论", text)
    text = re.sub(r"\d+ 个方法总索引", f"{total} 个方法总索引", text)
    text = re.sub(r"——\d+ 个战略", f"——{total} 个战略", text)
    text = re.sub(r"（\d+ 张卡 \+ \d+ 篇指南", f"（{total} 张卡 + {total} 篇指南", text)
    text = re.sub(r"InnoLab \d+ 方法体系", f"InnoLab {total} 方法体系", text)
    text = re.sub(r"\d+ 个文件、约", f"{n_file} 个文件、约", text)
    # 目录树里的分引擎数量
    for eng, zh in ENGINES:
        text = re.sub(rf"({zh}引擎)\s+\d+", rf"\g<1> {counts[eng]}", text)
    if n_case is not None:
        text = re.sub(r"\d+ 个实战案例", f"{n_case} 个实战案例", text)
        text = re.sub(r"\d+ 个实战案例，按领域", f"{n_case} 个实战案例，按领域", text)
    return text, total


def redact(text):
    for pat, rep in REDACTIONS:
        text = re.sub(pat, rep, text)
    return text


def strip_internal_fields(obj):
    """递归剥离案例里的内部引用字段。"""
    if isinstance(obj, dict):
        return {k: strip_internal_fields(v) for k, v in obj.items() if k != "wiki_obj_token"}
    if isinstance(obj, list):
        return [strip_internal_fields(v) for v in obj]
    return obj


def main():
    src_skill = ROOT / "skill-dist" / "SKILL.md"
    if not src_skill.exists():
        sys.exit("✗ 缺少 skill-dist/SKILL.md（对外版）")

    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True)

    counts = count_methods()
    total = sum(counts.values())
    # 实战案例数（不含总索引本身）
    n_case = len([p for p in (ROOT / "cases").rglob("*.json") if p.name != "case-index.json"])

    # 1) SKILL.md（对外版 + 数量同步）
    text = src_skill.read_text(encoding="utf-8")
    text, total = sync_counts(text, counts, n_case)
    version = re.search(r"^version:\s*(\S+)", text, re.M)
    version = version.group(1) if version else "0.0.0"
    (DIST / "SKILL.md").write_text(redact(text), encoding="utf-8")

    # 1b) README.md（分发说明，同样同步数量与脱敏）
    readme = ROOT / "skill-dist" / "README.md"
    if readme.exists():
        rt, _ = sync_counts(readme.read_text(encoding="utf-8"), counts, n_case)
        rt = re.sub(r"innolab-skill-v[\d.]+\.zip", f"innolab-skill-v{version}.zip", rt)
        (DIST / "README.md").write_text(redact(rt), encoding="utf-8")

    # 2) methods/（卡 + 指南，脱敏）
    n_md = 0
    for eng, _ in ENGINES:
        out = DIST / "methods" / eng
        out.mkdir(parents=True, exist_ok=True)
        for p in sorted((ROOT / "methods" / eng).glob("*.md")):
            (out / p.name).write_text(redact(p.read_text(encoding="utf-8")), encoding="utf-8")
            n_md += 1

    # 3) cases/（脱敏 + 剥离内部字段）
    n_json = 0
    for p in sorted((ROOT / "cases").rglob("*.json")):
        rel = p.relative_to(ROOT / "cases")
        out = DIST / "cases" / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        try:
            data = strip_internal_fields(json.loads(p.read_text(encoding="utf-8")))
            body = json.dumps(data, ensure_ascii=False, indent=2)
        except json.JSONDecodeError:
            body = p.read_text(encoding="utf-8")
        out.write_text(redact(body), encoding="utf-8")
        n_json += 1

    # 4) references/METHOD_INDEX.md（唯一对外索引）
    (DIST / "references").mkdir(parents=True, exist_ok=True)
    idx = (ROOT / "references" / "METHOD_INDEX.md").read_text(encoding="utf-8")
    idx = re.sub(r"> \d+个方法论", f"> {total}个方法论", idx)
    (DIST / "references" / "METHOD_INDEX.md").write_text(redact(idx), encoding="utf-8")

    # 5) 安全闸门 —— 有一处残留就不出包
    hits = []
    for f in DIST.rglob("*"):
        if not f.is_file():
            continue
        content = f.read_text(encoding="utf-8", errors="ignore")
        for pat in FORBIDDEN:
            for m in re.finditer(pat, content):
                hits.append(f"{f.relative_to(DIST)} :: {m.group()[:40]}")
    if hits:
        shutil.rmtree(DIST)
        print("✗ 构建中止：产物含敏感内容，已删除 dist（前 10 条）", file=sys.stderr)
        for h in hits[:10]:
            print("   -", h, file=sys.stderr)
        sys.exit(1)

    # 5b) 完整性闸门 —— 索引断链 / 未登记方法 / 悬空案例引用，任一命中即中止
    idx_text = (DIST / "references" / "METHOD_INDEX.md").read_text(encoding="utf-8")
    rows = re.findall(r"^\|\s*([A-Z]{2}\d{2})\s*\|(.+)$", idx_text, re.M)
    ids, listed, broken = [], set(), []
    for mid, rest in rows:
        cells = [c.strip() for c in rest.split("|") if c.strip()]
        rel = cells[-1]
        ids.append(mid)
        listed.add(rel)
        if not (DIST / "methods" / rel).exists():
            broken.append(f"{mid} → methods/{rel}")

    on_disk = {
        f"{eng}/{p.name}"
        for eng, _ in ENGINES
        for p in (DIST / "methods" / eng).glob("*.md")
        if not p.name.endswith(".guide.md")
    }
    ci = json.loads((DIST / "cases" / "case-index.json").read_text(encoding="utf-8"))
    dangling = sorted(
        {m for c in ci.get("cases", []) for m in c.get("related_methods", []) if m not in set(ids)}
    )

    problems = []
    if broken:
        problems.append(f"索引断链 {len(broken)}: {broken[:5]}")
    if len(ids) != len(set(ids)):
        problems.append(f"索引存在重复 ID（{len(ids)} 条 / {len(set(ids))} 唯一）")
    if on_disk - listed:
        problems.append(f"方法卡未进索引 {len(on_disk - listed)}: {sorted(on_disk - listed)[:5]}")
    if dangling:
        problems.append(f"案例引用了不存在的方法 {len(dangling)}: {dangling[:8]}")

    if problems:
        shutil.rmtree(DIST)
        print("✗ 构建中止：包完整性不过关，已删除 dist", file=sys.stderr)
        for p_ in problems:
            print("   -", p_, file=sys.stderr)
        sys.exit(1)

    # 6) 打包
    zip_path = ROOT / "dist" / f"innolab-skill-v{version}.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(DIST.rglob("*")):
            if f.is_file():
                z.write(f, Path("innolab") / f.relative_to(DIST))

    size = zip_path.stat().st_size / 1024 / 1024
    print(f"✓ 构建完成  v{version}")
    print(f"  方法 {total} 个（{' / '.join(f'{zh}{counts[e]}' for e, zh in ENGINES)}）")
    print(f"  文件 方法卡+指南 {n_md} · 案例 {n_case}（json {n_json}）")
    print(f"  闸门 敏感词 0 命中 · 索引 {len(ids)} 条 0 断链 · 案例引用 0 悬空")
    print(f"  → {DIST.relative_to(ROOT)}/")
    print(f"  → {zip_path.relative_to(ROOT)}  ({size:.1f} MB)")


if __name__ == "__main__":
    main()
