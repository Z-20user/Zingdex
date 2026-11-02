---
name: transient-motion
description: 从 TRANSIENT 瞬态动效库检索并取用动效代码（20,000 条组件 / 500 特效 / 11 类设备）。当用户要做列表入场、加载进度、卡片抬起、页面转场、状态反馈等界面动效，或说「用这套动效库」时使用。
---

# TRANSIENT 瞬态 · 动效取用技能

两条命令走完全程：**检索 → 取码**。别再手工拼路径或猜编号。

## 一、标准流程（照抄即可）

```bash
# 1) 检索：拿到 fx 编号
node skill/tools/find-motion.js <库目录> "商品列表" --device phone

# 2) 取码：直接贴 fx 编号
node skill/tools/extract-motion.js <库目录> fx-n001-01
```

输出就是 HTML + CSS（有脚本的会给 JS），复制即用。

- 找不到时：换更短的词 → 去掉 `--device`/`--cat` → `--scenes` 看全部
- 只看基础特效：`extract-motion.js <库目录> --list`
- 首次使用：`node skill/tools/build-index.js <库目录>` 生成 `index.json`，之后检索读 1.9 MB JSON，不再解析 2 MB 源码
- `--device` 支持 11 类叫法（手机/平板/桌面/电视/车机/手表/终端…），工具映射到库里的 5 个分组，覆盖全部 201 个场景
- `--cat` 可用常用叫法：进度→加载、转场→退场、出现→入场、反馈→状态

## 二、数据链路（这条链是闭合的）

```
场景 SCENES（201 个）
  └─ 条目 cats[]：{ zh, ms, mc, fx: "fx-n001-01", fq }
       └─ 代码 LIB_PAY["fx-n001-01"]
            ├─ 16,000 条：{ e: "state-51", c: 覆盖式 CSS }
            │    → 结构取 ENGINE_HTML[e]，样式 = ENGINE_CSS[e] + c
            └─  4,000 条：{ h: HTML, c: CSS }  ← s/d 场景特写，无基底编号
```

**20,000 条全部可取码（实测 100%）**：16,000 条能回溯到 500 个基底特效之一；
4,000 条是场景特写（`s`/`d` 前缀），自带完整 HTML/CSS，没有 `e` 字段。
`extract-motion.js` 已按 `library.js` 的 `hydrate()` 规则自动合并，两种条目都输出可用代码。

| 编号 | 例子 | 取值位置 | 用途 |
|---|---|---|---|
| 条目编号 | `fx-n001-01` | `LIB_PAY` | **首选**，场景化、可直接用 |
| 特效编号 | `enter-01` | `ENGINE_*` | 通用素材，需自行配界面 |

## 三、取到代码后必须做的适配

```
实际时长 = 基准时长 × durScale      实际位移 = 基准位移 × distScale
```

| 设备 | 时长 | 位移 | 禁用 |
|---|---|---|---|
| 手机 | ×0.82 | ×0.72 | 动画模糊、大背景模糊 |
| 桌面大屏 | ×1.08 | ×1.18 | — |
| 手表 | ×0.62 | ×0.55 | 画布、WebGL、模糊、3D、位移>16px、循环 |
| 车机 | ×0.75 | ×0.70 | 画布、循环、高饱和闪烁、视差、3D |
| 终端 | ×1.00 | ×1.10 | 热区<56px |

详见 `references/04-device-rules.md`。

## 四、硬约束

1. 三件套同取：只拿 CSS 不动，只拿 HTML 没效果
2. 改节奏用 `--fx-dur` / `--fx-ease`，**不要改关键帧名**
3. 入场只播一次，不要 `infinite`
4. 同屏循环 ≤2
5. 有 `prefers-reduced-motion` 兜底（直接给终态）
6. 粒子/物理类：元素移除时停掉帧循环

## 五、文档地图

| 文件 | 内容 |
|---|---|
| `references/01-data-model.md` | 三层结构与字段 |
| `references/02-retrieval.md` | 检索手册与降级 |
| `references/03-layout-tokens.md` | 时长/缓动/错峰/配色 |
| `references/04-device-rules.md` | 11 类设备系数 |
| `references/05-settings.md` | 应用内 14 项设置 |
| `references/06-build-release.md` | 构建与发版 |
| `references/07-integration.md` | 三种接入 + 框架范式 |
| `index.json` | 预生成索引（检索用） |

## 六、交付契约

回答时必须给：**场景名 + id**、**条目名 + 时长 + 类别**、**代码**、**设备适配说明**、**来源编号**。
缺一项视为未完成。
