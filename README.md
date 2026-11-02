# TRANSIENT · Motion Component Library

A searchable, previewable, copy-paste motion library: **20,000 scene-based components**,
**500 base effects**, across **11 device classes**. Fully offline, no network access required.

**Current version: 2.1.5** · 48 releases archived in [VERSIONS.md](VERSIONS.md)

---

## What it is

Every entry is a real interface plus a motion applied to it — not a shape renamed 25 times.

- **20,000 components**: portrait 16,290 · large screen 1,039 · car 799 · watch 864 · kiosk 1,008
- **500 base effects** in 18 families (enter, exit, state, light, morph, space, particle, physics,
  accent, ambient, type, swarm, beam, text, data, chart, noise, svg)
- **201 scenes** covering real product situations (e-commerce list, media player, dashboard…)
- **11 device classes**: phone, tablet, laptop, desktop, kiosk, car, TV, watch, AR/VR, e-ink, industrial panel
- **Offline by design** — no CDN, no web fonts, no telemetry, no network permission on Android

## Download

Open **Releases** and pick a version — each version is its own release.

| File | Platform | Size |
|---|---|---|
| `transient-2.1.5-android.apk` | Android (latest) | 2.5 MB |
| `transient-2.1.5-win-portable.zip` | Windows portable (latest) | 112 MB (≈293 MB unpacked) |
| `transient-1.12.43-win-installer.exe` | Windows installer (last installer build) | 113 MB |

> Since 2.1.4 the desktop build ships as a portable folder only. Use 1.12.43 if you need an installer.

## Install

- **Android** — install the APK directly; allow "unknown sources" once if prompted. Requires Android 6.0+ (API 23).
- **Windows portable** — unzip and run `TRANSIENT.exe` from inside the folder. Do **not** move the exe alone; the runtime files must stay next to it.
- **Windows installer (1.12.43)** — run the exe, choose a path, a desktop shortcut is created; uninstall from the app's settings.

The Windows build uses the system's built-in Edge / Chromium runtime (present on Windows 10 and 11).

## Using an effect

1. Search a scene ("product list", "loading", "card") in the app, or filter by device.
2. Open an entry — it plays live in the detail page.
3. Copy HTML + CSS (+ optional JS). All three parts are needed; CSS alone will not animate.
4. Override the rhythm with CSS variables instead of editing keyframes:

```css
.my-card{
  --fx-dur: 420ms;
  --fx-ease: cubic-bezier(0.16, 1, 0.3, 1);
}
```

Device scaling is not optional: watch ×0.62 / ×0.55, car ×0.75 / ×0.70,
phone ×0.82 / ×0.72, desktop ×1.08 / ×1.18 (duration / distance).

## Docs

| File | For | Contents |
|---|---|---|
| [LATEST.md](LATEST.md) | human + AI | Latest build, asset names, four-step entry |
| [VERSIONS.md](VERSIONS.md) | human | Full version history, newest first (48 releases) |
| [skill/SKILL.md](skill/SKILL.md) | AI | Retrieval workflow, data model, delivery contract |
| [skill/QUICKSTART.md](skill/QUICKSTART.md) | human | Five-minute quick start |
| [skill/references/](skill/references/) | AI | Data model, retrieval, layout tokens, device rules, settings, build & release, integration |
| [LICENSING-LEGACY.md](LICENSING-LEGACY.md) | human | Which builds still contain the old licensing UI, and how to remove it |
| [AUTHORIZATION-RETROSPECTIVE.md](AUTHORIZATION-RETROSPECTIVE.md) | human | How the licensing system was designed, why it was abandoned |

## AI skill

The `skill/` folder is a self-contained skill for assistants:

```bash
node skill/tools/find-motion.js  <library-dir> "product list" --device phone
node skill/tools/extract-motion.js <library-dir> enter-01
node skill/tools/extract-motion.js <library-dir> --list
```

`find-motion` returns scenes and entries with `fx-…` ids; `extract-motion` returns the
HTML / CSS / JS triple for a base effect id.

## Licensing note

All builds up to **2.1.5** still contain the early licensing UI (tiers, activation codes,
admin tokens). That system is discontinued and the software is free to use; the key app is
kept only as an archive. See [LICENSING-LEGACY.md](LICENSING-LEGACY.md).

---

# 瞬态 TRANSIENT · 动效组件库（中文）

可搜索、可预览、可复制的动效库：**20,000 条场景化组件**、**500 个特效基底**，覆盖 **11 类设备**。
完全离线，不申请网络权限。

**当前版本：2.1.5** · 已收录 48 个版本，见 [VERSIONS.md](VERSIONS.md)

## 是什么

每条都是「真实界面 + 作用其上的动效」，不是把同一个方块换 25 个名字。

- **20,000 条组件**：竖屏 16,290 · 大屏 1,039 · 车机 799 · 手表 864 · 终端 1,008
- **500 个特效基底**，18 个族（入场 / 退场 / 状态 / 光效 / 形变 / 空间 / 粒子 / 物理 /
  强调 / 氛围 / 排版 / 群体 / 光束 / 文字 / 数据 / 图表 / 噪波 / SVG）
- **201 个场景**，覆盖真实的界面情境
- **11 类设备**：手机 / 平板 / 笔记本 / 桌面 / 终端 / 车机 / 电视 / 手表 / AR·VR / 墨水屏 / 工业屏

## 下载

到 **Releases** 页选版本，每个版本一个 Release。

| 文件 | 平台 | 体积 |
|---|---|---|
| `transient-2.1.5-android.apk` | 安卓（最新） | 2.5 MB |
| `transient-2.1.5-win-portable.zip` | Windows 便携版（最新） | 112 MB（解压约 293 MB） |
| `transient-1.12.43-win-installer.exe` | Windows 安装版（最后一个安装版） | 113 MB |

> 2.1.4 起桌面端只出便携版；需要安装包请用 1.12.43。

## 安装

- **安卓**：直接安装；提示「未知来源」时允许一次。最低 Android 6.0（API 23）。
- **Windows 便携版**：解压后从文件夹里运行 `TRANSIENT.exe`，**不能只拷 exe**，运行库要与它同级。
- **Windows 安装版（1.12.43）**：双击 → 选路径 → 桌面生成快捷方式，设置里可卸载。

桌面端依赖系统自带的 Edge / Chromium 内核（Win10、Win11 均有）。

## 用一条动效

1. 在应用里搜索场景（「商品列表」「加载」「卡片」），或按设备筛选
2. 打开条目，详情页会真的动起来
3. 复制 HTML + CSS（有的还要 JS）——三件一起拿，只拿 CSS 不会动
4. 用 CSS 变量改节奏，不要改关键帧：

```css
.my-card{
  --fx-dur: 420ms;
  --fx-ease: cubic-bezier(0.16, 1, 0.3, 1);
}
```

设备换算不是可选项：手表 ×0.62/×0.55、车机 ×0.75/×0.70、手机 ×0.82/×0.72、桌面 ×1.08/×1.18（时长/位移）。

## 文档

| 文件 | 给谁 | 内容 |
|---|---|---|
| [LATEST.md](LATEST.md) | 人 + AI | 最新版说明、附件名、AI 四步入口 |
| [VERSIONS.md](VERSIONS.md) | 人 | 全部 48 个版本（最新在最上面） |
| [skill/SKILL.md](skill/SKILL.md) | AI | 检索流程、数据模型、交付契约 |
| [skill/QUICKSTART.md](skill/QUICKSTART.md) | 人 | 五分钟上手 |
| [skill/references/](skill/references/) | AI | 数据模型 / 检索 / 版面参数 / 设备规则 / 设置 / 构建发版 / 接入范式 |
| [LICENSING-LEGACY.md](LICENSING-LEGACY.md) | 人 | 哪些版本还带授权界面、怎么去掉 |
| [AUTHORIZATION-RETROSPECTIVE.md](AUTHORIZATION-RETROSPECTIVE.md) | 人 | 授权机制怎么设计、为什么放弃、重来怎么做 |

## AI 技能

`skill/` 是给助手用的完整技能：

```bash
node skill/tools/find-motion.js  <库目录> "商品列表" --device phone
node skill/tools/extract-motion.js <库目录> enter-01
node skill/tools/extract-motion.js <库目录> --list
```

## 授权说明

截至 **2.1.5**，所有版本仍保留早期授权界面（等级 / 激活码 / 管理员令牌）。
该体系已停用，软件免费使用；密钥 App 仅作历史存档。详见 [LICENSING-LEGACY.md](LICENSING-LEGACY.md)。
