# 帧册 / FrameFolio

离线动效规格库：**20,000 条场景条目 · 500 个基础特效 · 11 类设备系数**。
给 AI 编码助手和前端开发者用：检索 → 取码 → 适配，三步闭环。

版本 **3.0.1** · 免费 · MIT（Skill 与文档）· 应用本体不提供源码

---

## 一、中文说明

**是什么**
一套能搜、能看、能复制的界面动效库。每条都是真实界面 + 作用其上的动效，不是色块换名字。

**下载**（Release 里只有这两个）
| 文件 | 平台 | 体积 |
|---|---|---|
| `FrameFolio-3.0.1-android.apk` | 安卓，直接安装 | 2.4 MB |
| `FrameFolio-3.0.1-windows.exe` | Windows，双击即用 | 112 MB |

**三步用起来**
```bash
node skill/tools/find-motion.js "商品列表" --device phone   # 1 检索，得 fx 编号
node skill/tools/extract-motion.js fx-n001-01               # 2 取码，得 HTML+CSS
node skill/tools/extract-motion.js --list                   # 3 不确定时列全部特效
```

**边界**
- 三件套同取：只拿 CSS 不动，只拿 HTML 没效果
- 换设备必须乘系数：手表 ×0.62/×0.55、车机 ×0.75/×0.70、手机 ×0.82/×0.72、桌面 ×1.08/×1.18
- 改节奏用 `--fx-dur` / `--fx-ease`，不改关键帧名

**文档**：[MANUAL.md](MANUAL.md) 使用手册 · [LATEST.md](LATEST.md) 最新版 · [VERSIONS.md](VERSIONS.md) 版本史 · [skill/SKILL.md](skill/SKILL.md) 技能总纲

**开源范围**：应用本体免费使用、不提供源码；Skill 与文档 MIT。
**维护节奏**：个人独立维护，每周最多更新一次（通常周末）；收费闭环、小程序、账号暂不启动。
**联系**：技术交流邮箱 2083825368@qq.com

---

## 二、English

**What**: an offline motion-spec library — 20,000 scene entries, 500 base effects, per-device scaling for 11 device classes. Built for AI coding assistants and front-end developers.

**Download** (only two assets)
| File | Platform | Size |
|---|---|---|
| `FrameFolio-3.0.1-android.apk` | Android | 2.4 MB |
| `FrameFolio-3.0.1-windows.exe` | Windows (double-click) | 112 MB |

**Three commands**
```bash
node skill/tools/find-motion.js "product list" --device phone
node skill/tools/extract-motion.js fx-n001-01
node skill/tools/extract-motion.js --list
```

**Boundaries**: always take HTML + CSS together; scale per device (watch ×0.62/×0.55, car ×0.75/×0.70, phone ×0.82/×0.72, desktop ×1.08/×1.18); tune rhythm with `--fx-dur` / `--fx-ease`, never rename keyframes.

**Docs**: [MANUAL.md](MANUAL.md) · [LATEST.md](LATEST.md) · [VERSIONS.md](VERSIONS.md) · [skill/SKILL.md](skill/SKILL.md)

**Scope**: app binaries free, source not published; Skill and docs are MIT.
**Cadence**: solo-maintained, at most one update per week.
**Contact**: 2083825368@qq.com

---

## 三、For AI agents

```yaml
project: FrameFolio
version: 3.0.1
license:
  app_binaries: free-use, source not published
  skill_and_docs: MIT
entrypoint: skill/SKILL.md

assets:
  - name: FrameFolio-3.0.1-android.apk
    platform: android
    min_sdk: 23
    size_mb: 2.4
  - name: FrameFolio-3.0.1-windows.exe
    platform: windows
    runtime: system edge/chromium
    size_mb: 112

commands:
  search:
    run: node skill/tools/find-motion.js "<keyword>" [--device <dev>] [--cat <cat>] [--max <ms>] [--json]
    returns: scenes[] -> {id, zh, domain, devices, cats[] -> {zh, ms, mc, fx}}
  extract:
    run: node skill/tools/extract-motion.js <fx-id|effect-id> [--json]
    returns: {html, css, js, note}
  list:
    run: node skill/tools/extract-motion.js --list [family]
    returns: effect ids grouped by family

data_model:
  scenes: 201            # SCENES[] in assets/data.js + engine.js
  entries: 20000         # cats[].fx
  effects: 500           # ENGINE_HTML/CSS/JS
  entry_to_code: "SCENES[].cats[].fx -> LIB_PAY[fx] -> {h,c} (100% resolve)"

device_scaling:            # duration / distance
  phone:      [0.82, 0.72]
  phone_lg:   [0.88, 0.80]
  desktop_xl: [1.08, 1.18]
  tablet:     [1.00, 1.00]
  watch:      [0.62, 0.55]
  car:        [0.75, 0.70]
  kiosk:      [1.00, 1.10]

invariants:
  - html and css must be taken together
  - never rename keyframes without updating references
  - entrance plays once; do not use infinite
  - max 2 concurrent loops per screen
  - honor prefers-reduced-motion (jump to end state)
  - stop frame loops when element is removed

fallbacks:
  - shorten keyword
  - drop --device / --cat / --max
  - run --list to inspect actual ids
  - never invent ids from memory
```

**Read next**: [skill/SKILL.md](skill/SKILL.md) → [skill/references/02-retrieval.md](skill/references/02-retrieval.md) → [skill/references/04-device-rules.md](skill/references/04-device-rules.md)
