# Zingdex / 跃索

离线动效规格库：**20,000 条场景条目 · 500 个基础特效 · 11 类设备适配系数**。
给 AI 编码助手和前端开发者用：检索 → 取码 → 适配。

版本 **3.1.0** · 完全免费 · MIT（Skill 与文档）· 应用本体不提供源码

> 国外有 GSAP Skills、Transitions.dev，国内还没有离线、大规模、带多端系数的 AI 动效规格库——所以做了这个。

---

## 一、中文

**下载**（Release 只有两个文件）
| 文件 | 平台 | 体积 |
|---|---|---|
| `Zingdex-3.1.0-android.apk` | 安卓，直接安装 | 2.5 MB |
| `Zingdex-3.1.0-windows-portable.zip` | Windows 便携版，解压即用、免安装 | 112 MB |

**三步用起来**
```bash
node skill/tools/find-motion.js "商品列表" --device phone   # 检索 → fx 编号
node skill/tools/extract-motion.js fx-n001-01               # 取码 → HTML + CSS
node skill/tools/extract-motion.js --list                   # 列全部基础特效
```

**边界**：HTML+CSS 同取；换设备乘系数（手表 0.62/0.55、车机 0.75/0.70、手机 0.82/0.72、桌面 1.08/1.18）；改节奏用 `--fx-dur`/`--fx-ease`，不改关键帧名。

**文档**：[MANUAL.md](MANUAL.md) 手册 · [LATEST.md](LATEST.md) 最新版 · [VERSIONS.md](VERSIONS.md) 版本史 · [skill/SKILL.md](skill/SKILL.md) 技能总纲

**开源范围**：应用本体免费使用、不提供源码；Skill 与文档 MIT。
**反馈**：优先 GitHub Issues；邮箱 `hello@zingdex.com`（待域名启用）。

### 维护节奏

个人独立维护（在校学生），**每周最多更新一次，通常周末**；紧急 Bug 除外。
功能请求按周排期，不承诺即时响应；收费闭环、小程序、账号系统暂不启动。

### 基础设施 / Infrastructure

| 项 | 规划 | 状态 |
|---|---|---|
| 主域名 | `zingdex.com` / `zingdex.dev` | 待注册确认 |
| 中文域名 | 不建议 `yuesuo` 系列（有同名公司）；备选 `zingdex.cn` | 建议放弃中文域名 |
| 文档站 | `docs.zingdex.com` | 暂不部署 |
| 下载站 | 优先 GitHub Releases；备选 `dl.zingdex.com` | 使用 GitHub |
| npm 包 | `zingdex` | 检索未占用，可发布；备选 `@zingdex/cli` |
| GitHub 组织 | `zingdex` | 大概率可用；备选 `zingdex-labs` |
| 邮箱 | `hello@zingdex.com` | 待主域名确认后启用 |
| 社交占位 | `@zingdex`（X / GitHub / V2EX / 即刻） | 建议先占位 |
| 商标 | 第 9 类软件、第 42 类软件设计开发 | 商业化前再查；当前不注册 |
| 中文品牌 | 跃索 | 仅作品牌称呼，不用于域名 |

---

## 二、English

**What**: an offline motion-spec library — 20,000 scene entries, 500 base effects, per-device scaling for 11 device classes.

**Download**
| File | Platform | Size |
|---|---|---|
| `Zingdex-3.1.0-android.apk` | Android | 2.5 MB |
| `Zingdex-3.1.0-windows-portable.zip` | Windows portable (no install) | 112 MB |

**Commands**
```bash
node skill/tools/find-motion.js "product list" --device phone
node skill/tools/extract-motion.js fx-n001-01
node skill/tools/extract-motion.js --list
```

**Scope**: app binaries free, source not published; skill and docs MIT.
**Cadence**: solo-maintained, at most one update per week.
**Contact**: GitHub Issues first; `hello@zingdex.com` once the domain is live.

---

## 三、For AI agents

```yaml
project: Zingdex
project_zh: 跃索
version: 3.1.0
license: {app_binaries: free-use-no-source, skill_and_docs: MIT}
entrypoint: skill/SKILL.md

assets:
  - {name: Zingdex-3.1.0-android.apk, platform: android, min_sdk: 23, size_mb: 2.5}
  - {name: Zingdex-3.1.0-windows-portable.zip, platform: windows, install: none, size_mb: 112}

commands:
  search:  {run: 'node skill/tools/find-motion.js "<kw>" [--device d] [--cat c] [--max ms] [--json]', returns: 'scenes[] -> {id, zh, domain, devices, cats[] -> {zh, ms, mc, fx}}'}
  extract: {run: 'node skill/tools/extract-motion.js <fx-id|effect-id> [--json]', returns: '{html, css, js, note}'}
  list:    {run: 'node skill/tools/extract-motion.js --list [family]', returns: 'effect ids by family'}

data_model:
  scenes: 201
  entries: 20000
  effects: 500
  chain: "SCENES[].cats[].fx -> LIB_PAY[fx] -> {h,c} (100% resolve)"

device_scaling:
  phone: [0.82, 0.72]
  phone_lg: [0.88, 0.80]
  desktop_xl: [1.08, 1.18]
  tablet: [1.00, 1.00]
  watch: [0.62, 0.55]
  car: [0.75, 0.70]
  kiosk: [1.00, 1.10]

invariants:
  - take html and css together
  - never rename keyframes without updating references
  - entrance plays once; no infinite
  - max 2 concurrent loops per screen
  - honor prefers-reduced-motion (jump to end state)
  - stop frame loops when element is removed

fallbacks: [shorten keyword, drop filters, run --list, never invent ids]

infra:
  domain: zingdex.com (pending)
  npm: zingdex
  github_org: zingdex
  email: hello@zingdex.com (pending)
```
