# 帧册 / FrameFolio

**为 AI 编码助手和前端开发者准备的离线动效规格库。**
20,000 条场景条目 · 500 个基础特效 · 11 类设备适配系数，支持「检索 → 取码 → 适配」三步。

**完全免费，MIT 开源。** 历史授权界面仅作存档，不影响使用；商业授权 / 定制 / 托管另询，当前不运营收费闭环。

> 国外有 GSAP Skills、Transitions.dev，国内还没有离线、大规模、带多端系数的 AI 动效规格库——所以做了这个。

---

## 下载

| 文件 | 平台 | 体积 |
|---|---|---|
| `FrameFolio-3.0.0-android.apk` | 安卓（直接安装） | 2.6 MB |
| `FrameFolio-3.0.0-windows.exe` | Windows（双击即用） | 113 MB |

> 只提供这两个产物。Windows 不提供安装程序，解压/双击即用。

## 三个命令

```bash
node skill/tools/find-motion.js "商品列表" --device phone   # 检索，拿到 fx 编号
node skill/tools/extract-motion.js fx-n001-01               # 取 HTML + CSS
node skill/tools/extract-motion.js --list                   # 列出 500 个基础特效
```

## 设备系数

手机 ×0.82/×0.72 · 桌面大屏 ×1.08/×1.18 · 手表 ×0.62/×0.55 · 车机 ×0.75/×0.70 · 终端 ×1.00/×1.10（时长/位移）
完整表见 [skill/references/04-device-rules.md](skill/references/04-device-rules.md)。

## 维护节奏 / Maintenance Cadence

个人独立维护（在校学生），**每周最多更新一次，通常周末**；紧急 Bug 除外。
功能请求按周排期，不承诺即时响应；收费闭环、小程序、账号系统暂不启动。

---

# FrameFolio (English)

**An offline motion-spec library for AI coding assistants and front-end developers.**
20,000 scene entries · 500 base effects · per-device scaling for 11 device classes.

**Free and MIT-licensed.** The legacy licensing UI is archived only; no paid flow is running today.

> GSAP Skills and Transitions.dev exist for the English-speaking world; there was no offline, large-scale,
> device-aware motion spec library for Chinese-language projects — so this one was built.

## Download

| File | Platform | Size |
|---|---|---|
| `FrameFolio-3.0.0-android.apk` | Android | 2.6 MB |
| `FrameFolio-3.0.0-windows.exe` | Windows (double-click) | 113 MB |

## Commands

```bash
node skill/tools/find-motion.js "product list" --device phone
node skill/tools/extract-motion.js fx-n001-01
node skill/tools/extract-motion.js --list
```

## Maintenance

Solo-maintained by a student. **At most one update per week (usually weekend)**; urgent bug fixes excepted.
Feature requests are scheduled weekly, no immediate-response promise.

## Docs

- Skill: [skill/README.md](skill/README.md) · [skill/SKILL.md](skill/SKILL.md)
- Retrieval: [skill/references/02-retrieval.md](skill/references/02-retrieval.md)
- Device rules: [skill/references/04-device-rules.md](skill/references/04-device-rules.md)
- Version history: [VERSIONS.md](VERSIONS.md) · Latest: [LATEST.md](LATEST.md)
- Licensing archive: [LICENSING-LEGACY.md](LICENSING-LEGACY.md)

## Feedback & Sponsor

- Issues: bug reports and scene requests use the templates.
- Sponsor: see the link in the repository sidebar (no rights attached).
