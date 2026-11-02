# 帧册 FrameFolio · Skill

给 AI 编码助手用的动效取用技能：检索场景 → 拿编号 → 取 HTML/CSS。

## 三个命令

```bash
node skill/tools/find-motion.js "商品列表" --device phone   # 检索
node skill/tools/extract-motion.js fx-n001-01               # 取码
node skill/tools/extract-motion.js --list                   # 全部基础特效
```

库目录写在 `skill/library-path.txt`，不用每次手打。

## 设备系数

| 设备 | 时长 | 位移 | 禁用 |
|---|---|---|---|
| 手机 | ×0.82 | ×0.72 | 动画模糊、大背景模糊 |
| 桌面大屏 | ×1.08 | ×1.18 | — |
| 手表 | ×0.62 | ×0.55 | 画布、模糊、3D、位移>16px、循环 |
| 车机 | ×0.75 | ×0.70 | 画布、循环、高饱和闪烁、视差、3D |
| 终端 | ×1.00 | ×1.10 | 热区<56px |

完整表格：`references/04-device-rules.md`

## 反馈

发现问题或想要某个场景，到仓库 Issues 提一条（用「场景请求」模板）。
维护节奏：每周最多更新一次，通常周末。
