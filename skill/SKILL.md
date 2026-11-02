---
name: frame-folio
description: 帧册 FrameFolio 动效规格库取用技能。要做列表入场、加载进度、卡片抬起、页面转场、状态反馈等界面动效，或说「用帧册的动效」时使用。
---

# 帧册 FrameFolio · 取用技能

## 一、特征（用它能得到什么）

- **量**：20,000 条场景条目，201 个场景，500 个基础特效，11 类设备系数
- **准**：条目编号 → 代码，链路闭合，20,000 条实测 100% 命中
- **快**：两条命令拿到可用代码，不解析源码、不猜编号
- **稳**：查不到有固定降级路径，不会编造 id

## 二、三个命令

```bash
node skill/tools/find-motion.js "商品列表" --device phone   # 检索 → 得 fx 编号
node skill/tools/extract-motion.js fx-n001-01               # 取码 → HTML + CSS
node skill/tools/extract-motion.js --list                   # 列 500 个基础特效
```

## 三、输入输出

| 命令 | 输入 | 输出 |
|---|---|---|
| `find-motion` | 关键词；`--device` `--cat` `--max` `--scenes` `--limit` `--json` | 场景 id / 名称 / 设备 + 条目（类别、时长、`fx`） |
| `extract-motion` | `fx-…` 或 `enter-01`；`--json` | `{html, css, js, note}` |
| `extract-motion --list` | 可选族名（`light`） | 特效编号清单 |

数据链路：`SCENES[].cats[].fx → LIB_PAY[fx] → {h, c}`

## 四、边界

1. HTML 与 CSS 必须同取；只拿 CSS 不会动
2. 换设备乘系数：手表 0.62/0.55 · 车机 0.75/0.70 · 手机 0.82/0.72 · 桌面 1.08/1.18
3. 用手表禁画布/模糊/循环；车机禁循环/高饱和闪烁/视差
4. 改节奏用 `--fx-dur` / `--fx-ease`，不改关键帧名
5. 入场只播一次；同屏循环 ≤2；元素移除即停帧循环；尊重 `prefers-reduced-motion`
6. 查不到就换词 → 去筛选 → `--list` 看实际编号，**不要凭记忆编 id**

详见 `references/02-retrieval.md`（检索与降级）与 `references/04-device-rules.md`（设备系数）。
