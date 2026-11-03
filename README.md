# Zingdex · 跃索

**离线界面动效库：20,000 条场景条目 · 500 个基础特效 · 11 类设备适配系数。**
给前端开发者和 AI 编码助手用：检索 → 取码 → 适配，三步闭环。

版本 **3.1.1** · 代码 [Apache-2.0](LICENSE) · 数据与文档 [CC BY 4.0](LICENSE-DATA) · 完全开源

[下载](#下载) · [快速开始](#三步用起来) · [仓库结构](#仓库结构) · [构建](#从源码构建) · [数据来源](docs/DATA-PROVENANCE.md) · [商标](TRADEMARK.md)

---

## 一、中文说明

### 是什么

一套能搜、能看、能复制的界面动效库。每条都是**真实界面 + 作用其上的动效**，
不是色块换名字。全部离线，不联网、不申请权限、不收集任何数据。

### 下载

| 文件 | 平台 | 体积 |
|---|---|---|
| [`Zingdex-3.1.1-android.apk`](https://github.com/Z-20user/frame-folio/releases/latest) | 安卓 6.0+，直接安装 | 2.5 MB |
| [`Zingdex-3.1.1-windows-portable.zip`](https://github.com/Z-20user/frame-folio/releases/latest) | Windows 10+，解压运行 `Zingdex.exe` | 112 MB |

也可以在浏览器里直接用：`apps/web/index.html`（无需服务器）。
网页版是 **PWA**：首次打开后整站进缓存，断网可用，也可以「安装」到桌面/主屏。

### 三步用起来

```bash
node skill/tools/find-motion.js "商品列表" --device phone   # 1 检索，得 fx 编号
node skill/tools/extract-motion.js fx-s001-07               # 2 取码，得 HTML+CSS
node skill/tools/extract-motion.js --list                   # 3 不确定时列全部特效
```

克隆仓库后无需任何配置，工具会自动读取 `apps/web/assets/`。

### 或者用 npm（不需要克隆仓库）

```bash
npm i zingdex-cli
npx zingdex find "商品列表" --device phone
npx zingdex get fx-s001-07 --device watch
```

| 包 | 用途 |
|---|---|
| [`zingdex-cli`](https://www.npmjs.com/package/zingdex-cli) | 命令行（含数据，开箱即用） |
| [`zingdex-data`](https://www.npmjs.com/package/zingdex-data) | 20,000 条数据的 Node 读取接口 |
| [`zingdex-core`](https://www.npmjs.com/package/zingdex-core) | 按设备缩放、生成独立预览页 |
| [`zingdex-plugin-sdk`](https://www.npmjs.com/package/zingdex-plugin-sdk) | 加自己的动效，不动核心数据 |

### 边界（这几条是硬约束）

- **HTML 与 CSS 必须同取**：只拿 CSS 不会动，只拿 HTML 是块静止的界面
- **换设备必须乘系数**：手表 ×0.62/×0.55、车机 ×0.75/×0.70、手机 ×0.82/×0.72、桌面 ×1.08/×1.18
- **改节奏用参数**：`--fx-dur` / `--fx-ease`，不要改关键帧名
- **入场只播一次**：同屏循环 ≤2；元素移除即停帧循环；尊重 `prefers-reduced-motion`
- **查不到就降级**：换词 → 去筛选 → `--list` 看实际编号，**不要凭记忆编 id**

### 仓库结构

```
apps/web/         网页版（纯静态，含 PWA：可安装、可离线）
apps/desktop/     Windows 版（Electron 主进程 + 打包脚本）
apps/android/     安卓版（免 Gradle 手工构建链）
packages/data/    动效数据读取 API（数据本体在 apps/web/assets）
packages/core/    按设备系数编译与缩放
packages/schema/  数据结构与插件的 JSON Schema
packages/cli/     命令行工具（zingdex find / get / list / stats）
packages/plugin-sdk/  给第三方加自有动效的扩展点
tools/            生成、打包、自检脚本
skill/            给 AI 助手用的技能说明（6 个文件）
docs/             手册、架构、开发者指引、数据来源审计
legacy/           不再使用的旧实现（PyInstaller 桌面版）
```

### 从源码构建

```bash
# 网页版：直接用浏览器打开 apps/web/index.html，无构建步骤

# 安卓版（需要 Android SDK build-tools + JDK，并自备签名密钥）
cd apps/android && ./prepare_toolchain.sh && ./build_apk.sh

# Windows 版（需要 Node.js 18+）
cd apps/desktop && npm install && npm run dist
```

签名密钥**不在仓库里**。构建前请设置 `KS_PATH`（.jks 路径）与
`KS_PASS_FILE`（只含口令的单行文本），详见 `apps/android/build_apk.sh` 头部注释。

### 维护节奏

个人独立维护，每周最多更新一次（通常周末）；紧急 Bug 除外。
收费闭环、小程序、账号体系暂不启动。

### 联系

技术交流邮箱：2083825368@qq.com
问题与建议请走 [Issues](https://github.com/Z-20user/frame-folio/issues)。

---

## 二、English

**What.** An offline motion-spec library — 20,000 scene entries, 500 base effects,
per-device scaling for 11 device classes. Every entry is a real interface with real
motion applied to it, not a recoloured block. Fully offline: no network calls, no
permissions, no telemetry.

**Download.** Android APK (2.5 MB, Android 6.0+) and a portable Windows zip
(112 MB, Windows 10+) from [Releases](https://github.com/Z-20user/frame-folio/releases/latest).
The web build runs straight from `apps/web/index.html` — no server needed.

**Three commands** (no configuration after cloning):

```bash
node skill/tools/find-motion.js "product list" --device phone
node skill/tools/extract-motion.js fx-s001-07
node skill/tools/extract-motion.js --list
```

**Or via npm** (no clone needed):

```bash
npm i zingdex-cli
npx zingdex find "product list" --device phone
```

Packages: `zingdex-cli`, `zingdex-data`, `zingdex-core`, `zingdex-plugin-sdk`.

**Boundaries.**
Always take HTML + CSS together — CSS alone does not animate, HTML alone is a still frame.
Scale per device before shipping: watch ×0.62/×0.55, car ×0.75/×0.70,
phone ×0.82/×0.72, desktop ×1.08/×1.18. Tune rhythm with `--fx-dur` / `--fx-ease`,
never rename keyframes. Entrance animations play once; at most two concurrent loops
per screen; stop frame loops when the element is removed; honour `prefers-reduced-motion`.
If a lookup misses, shorten the keyword, drop filters, then run `--list` — never
invent an id from memory.

**Repository layout.**

```
apps/web/         static web build
apps/desktop/     Electron shell + packaging
apps/android/     manual build chain (no Gradle)
packages/data/    the dataset (CC BY 4.0)
packages/core/    motion runtime
packages/schema/  JSON Schema for the data
packages/cli/     command-line tools
tools/            generators and packaging scripts
skill/            AI-assistant skill (6 files)
docs/             manual, version history, provenance audit
```

**Build.** Web needs no build. Android needs Android build-tools + a JDK and your own
signing key (`KS_PATH`, `KS_PASS_FILE`). Desktop needs Node.js 18+.

**Licensing.** Source code is Apache-2.0. Data and documentation are CC BY 4.0 —
commercial use is fine, attribution is required. Names and logos are not licensed;
see [TRADEMARK.md](TRADEMARK.md).

**Cadence.** Solo-maintained, at most one update per week.

---

## 三、For AI agents

```yaml
project: Zingdex
aliases: ["跃索", "Zingdex 跃索"]
version: 3.1.1
license:
  code: Apache-2.0          # apps/, packages/{core,cli,schema}, tools/
  data_and_docs: CC-BY-4.0  # packages/data/, docs/, skill/, README
  trademark: reserved       # names and logos, see TRADEMARK.md
entrypoint: skill/SKILL.md
repo_layout:
  web: apps/web
  desktop: apps/desktop
  android: apps/android
  data: packages/data
  core: packages/core
  cli: packages/cli
  skill: skill

assets:
  - name: Zingdex-3.1.1-android.apk
    platform: android
    min_sdk: 23
    size_mb: 2.5
  - name: Zingdex-3.1.1-windows-portable.zip
    platform: windows
    runtime: system Edge/Chromium (WebView2)
    size_mb: 112

commands:
  install:
    npm: "npm i zingdex-cli"
    repo: "git clone <repo> && node skill/tools/…"
  search:
    run: node skill/tools/find-motion.js "<keyword>" [--device <dev>] [--cat <cat>] [--max <ms>] [--json]
    npmm_run: npx zingdex find "<keyword>" --device <dev>
    returns: scenes[] -> {id, zh, domain, devices, cats[] -> {zh, ms, mc, fx}}
  extract:
    run: node skill/tools/extract-motion.js <fx-id|effect-id> [--json]
    returns: {html, css, js, note}
  list:
    run: node skill/tools/extract-motion.js --list [family]
    returns: effect ids grouped by family

lib_resolution:            # 按顺序
  - env ZINGDEX_LIB
  - skill/library-path.txt
  - <repo>/apps/web       # 克隆仓库后即可用，无需配置

data_model:
  scenes: 201              # apps/web/assets/lib/d001..d201.js
  entries: 20000           # LIB_PAY keys, verified 2026-11-03
  effects: 500             # apps/web/assets/effects.js
  canvas_effects: 24       # apps/web/assets/lib-gl.js
  entry_to_code: "LIB_PAY[fx] -> {h, c} (100% resolve, 0 missing)"

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
  - do not invent fx ids; run --list when a lookup misses

fallbacks:
  - shorten keyword
  - drop --device / --cat / --max
  - run --list to inspect actual ids
  - never invent ids from memory

do_not:
  - copy the name "Zingdex" / "跃索" into a derived product's name or logo
  - reuse the package id com.transientlab.motion in a fork
  - strip the attribution when redistributing data
```

**Read next**: [`skill/SKILL.md`](skill/SKILL.md) → [`skill/references/02-retrieval.md`](skill/references/02-retrieval.md)
→ [`skill/references/04-device-rules.md`](skill/references/04-device-rules.md) →
[`docs/DATA-PROVENANCE.md`](docs/DATA-PROVENANCE.md)

---

## 文档

| 文档 | 给谁看 |
|---|---|
| [使用手册](docs/MANUAL.md) | 装机、找动效、取代码、换设备 |
| [常见问题](docs/FAQ.md) | 「能商用吗」「为什么这么大」这类问题 |
| [架构说明](docs/ARCHITECTURE.md) | 想改代码的人：东西在哪、改哪里会炸 |
| [开发者指引](docs/DEVELOPING.md) | 从 clone 到构建出三个端 |
| [版本史](docs/VERSIONS.md) | 每个版本改了什么 |
| [数据来源审计](docs/DATA-PROVENANCE.md) | 数据哪来的、有没有第三方内容 |
| [仓库指标](docs/METRICS.md) | 规模、体积、健康线 |
| [发布流程](docs/RELEASING.md) | 发 npm 包、发 Release、版本号怎么升 |
| [商业化触发条件](docs/COMMERCIAL.md) | 什么情况下才会考虑收费（现在不收费） |
| [治理](GOVERNANCE.md) | 谁决定什么、版本怎么走 |
| [参与贡献](CONTRIBUTING.md) | 提 PR 的流程与红线 |

## 许可

| 内容 | 许可证 |
|---|---|
| 源代码（`apps/`、`packages/core`、`packages/cli`、`packages/schema`、`tools/`） | [Apache-2.0](LICENSE) |
| 动效数据（`packages/data/`、`apps/web/assets/`） | [CC BY 4.0](LICENSE-DATA) |
| 文档与技能说明（`docs/`、`skill/`） | [CC BY 4.0](LICENSE-DATA) |
| 名称与图标 | 保留权利，见 [TRADEMARK.md](TRADEMARK.md) |

第三方组件见 [NOTICE](NOTICE)。数据来源审计见 [docs/DATA-PROVENANCE.md](docs/DATA-PROVENANCE.md)。
