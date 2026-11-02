---
name: frame-folio
description: 帧册 FrameFolio 动效规格库的取用技能。当用户要做列表入场、加载进度、卡片抬起、页面转场、状态反馈等界面动效，或说「用帧册里的动效」时使用。
---

# 帧册 FrameFolio · 动效取用

## 一、解决什么问题

给 AI 编码助手一套**可检索、可直接取码**的动效规格：20,000 条场景条目、500 个基础特效、11 类设备适配系数。
不用凭记忆编 CSS，也不用从截图猜效果——按场景找到编号，直接拿到 HTML + CSS。

## 二、三个可跑命令

```bash
node skill/tools/find-motion.js "商品列表" --device phone
node skill/tools/extract-motion.js fx-n001-01
node skill/tools/extract-motion.js --list
```

- 第 1 条：检索，输出场景与条目编号（`fx-…`）
- 第 2 条：按编号取码，输出 HTML / CSS（有脚本时附 JS）
- 第 3 条：列出 500 个基础特效编号，按族分组

库目录：在命令后补路径；也可在本地建 `skill/library-path.txt` 写一行路径，或设环境变量 `FRAMEFOLIO_LIB`。

## 三、输入输出

| 命令 | 输入 | 输出 |
|---|---|---|
| `find-motion` | 关键词；可选 `--device` `--cat` `--max` `--scenes` `--limit` `--json` | 场景（id/中文名/领域/设备）+ 条目（类别/名称/时长/`fx` 编号） |
| `extract-motion` | `fx-…`（场景条目）或 `enter-01`（基础特效）；`--json` 可机读 | `{ html, css, js, note }` |
| `extract-motion --list` | 可选族名，如 `light` | 基础特效编号清单 |

数据链路是闭合的：`场景 → cats[].fx → LIB_PAY[fx] → {h,c}`，20,000 条实测全部命中。

## 四、边界

- 只取码，不改数据；要改内容请改生成脚本后重建索引
- 取到代码后必须按设备换算：手表 ×0.62/×0.55、车机 ×0.75/×0.70、手机 ×0.82/×0.72、桌面 ×1.08/×1.18
- 禁用项是硬约束（手表禁画布/模糊/循环；车机禁循环/高饱和闪烁/视差）
- 改节奏用 `--fx-dur` / `--fx-ease`，**不要改关键帧名**
- 查不到时按 `references/02-retrieval.md` 逐级降级，不要猜编号

详细规则见 `references/02-retrieval.md` 与 `references/04-device-rules.md`。
