# TRANSIENT 瞬态 · 动效组件库

> 20,000 条动效组件，覆盖 11 类设备。桌面、手机、网页同源，完全离线。

**当前版本：2.1.5** · 入口文档见 **[LATEST.md](LATEST.md)** · 历史 46 个版本见 [VERSIONS.md](VERSIONS.md)

## 是什么

一套可搜索、可预览、可复制的动效组件库。每条都是真实界面 + 作用在其上的动效，
不是「一个方块换 25 个名字」。

- 组件 **20,000** 条：竖屏 16,290 · 大屏 1,039 · 车机 799 · 手表 864 · 终端 1,008
- 特效基底 **500** 个：过渡 / 粒子 / 光束 / 光效 / 文字 / 形变 / 物理 / 图表 / 噪波 / 路径
- 场景 **193** 个，其中 AI 场景 16 个
- 设备 **11 类**：手机 / 平板 / 笔记本 / 桌面 / 自助机 / 车机 / 电视 / 手表 / AR·VR / 墨水屏 / 工业屏
- 断网可用，不申请网络权限

## 下载

到 **Releases** 页找最新版本：

| 文件 | 形态 | 体积 |
|---|---|---|
| `transient-1.12.43-android.apk` | 安卓 | 2.7 MB |
| `transient-1.12.43-win-installer.exe` | Windows 安装版 | 113 MB |

## 安装

- **安卓**：直接安装；提示「未知来源」时允许一次即可。
- **Windows**：双击安装包 → 选路径 → 完成后桌面有快捷方式；设置里可一键卸载。

Windows 端依赖系统自带的 Edge / Chromium 内核（Win10、Win11 均有），无需另装。

## 已知限制

- Windows 便携版需整个文件夹一起使用，不能只拷 exe
- 数据写死在包内，更新需换新版本
- 1.12.x 版本内仍保留早期授权界面；后续版本会移除，改为完全免费

## 文档

| 文件 | 内容 |
|---|---|
| [CHANGELOG.md](CHANGELOG.md) | 从 1.6.x 到 1.12.43 的逐版本记录 |
| [docs/版本记录.md](docs/版本记录.md) | 同上，带细节 |
| [docs/开发流程与防护体系报告.md](docs/开发流程与防护体系报告.md) | 构建流水线、工程决策、防护边界 |
| [docs/开发数据/](docs/开发数据/) | 时间线、统计、现状快照、后续路线 |
| [VERSIONS.md](VERSIONS.md) | **全部 46 个版本的版本史**（最新在最上面） |
| [LATEST.md](LATEST.md) | 最新版说明 + 给 AI 的四步入口 |
| [LICENSING-LEGACY.md](LICENSING-LEGACY.md) | **谁带授权、怎么识别、怎么去掉** |
| [AUTHORIZATION-RETROSPECTIVE.md](AUTHORIZATION-RETROSPECTIVE.md) | **授权机制与多端部署的完整复盘**：怎么设计的、为什么放弃、重来怎么做 |

## AI 技能

[`skill/QUICKSTART.md`](skill/QUICKSTART.md) —— 五分钟上手
[`skill/SKILL.md`](skill/SKILL.md) —— 给 AI 的技能总纲（强制检索流程、交付契约）

参考文档：数据模型 / 检索手册 / 版面参数 / 设备规则 / 设置项 / 构建发版 / 接入范式，
都在 [`skill/references/`](skill/references/)。：数据模型、三步检索、三种接入方式、
设备适配约束、交付前自查。

配套命令行工具：

```bash
node skill/tools/find-motion.js <库目录> "商品列表" --device phone
node skill/tools/extract-motion.js <库目录> enter-01
node skill/tools/extract-motion.js <库目录> --list
```

输出场景与 `fx` 编号，直接对应到 `engine_html.js` / `engine_css.js` / `engine_js.js` 里的代码。

## 密钥 App（已停用）

`瞬态密钥` 是早期授权体系的一部分：手机上查看 / 领取激活码。
免费化之后这套体系不再需要，App 内的密钥数据也不再有效，仅作历史存档。
见 Releases 里的 `keys-v0.0.1.8.zwb`。

## 授权说明

1.12.x 的安装包内仍是早期授权界面（等级 / 激活码 / 管理员令牌）。
后续版本会整体移除，改为完全免费。
