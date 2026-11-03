# 更新日志 / Changelog

遵循 [语义化版本](https://semver.org/lang/zh-CN/)。日期为发布日。

## 2026-11-03 · v3.1.1（当前）

- 修复设置页「技术交流」区块布局：残留的空白二维码占位已删除，改为两列纯文本卡片
  （邮箱 / 反馈格式），窄屏自动单列
- 品牌显示统一为 **Zingdex · 跃索**（页面标题、窗口标题、关于页一致）

## 2026-11-03 · v3.1.0（开源定稿）

- 项目定名 **Zingdex · 跃索**，弃用名称：FrameFolio、帧册、transient、TRANSIENT
- **源码全部开源**：代码 Apache-2.0，数据与文档 CC BY 4.0（此前为「仅发布二进制」）
- 仓库改为 monorepo：`apps/`（web / desktop / android）+ `packages/`（data / core / schema / cli）
- Windows 端只出便携版 zip，不再生成安装程序
- Skill 精简为 6 个文件，命令契约固定
- README 三段式（中文 / English / For AI agents）
- 联系方式仅保留邮箱；二维码与「联系作者」入口已移除
- 签名密钥与口令移出仓库，构建时从仓库外读取

## 2026-11-03 · v3.0.2

- 使用说明去掉「安装版 / 便携版」表述，统一为「Windows 版」
- 移除微信二维码与保存入口，只留邮箱
- 页面更名为 FrameFolio / 帧册（后于 3.1.0 再次更名）

## 2026-11-03 · v3.0.1

- 修复技术交流区块的空白占位
- 三个板块三种解释的结构定稿

## 2026-11-03 · v3.0.0

- 首次以 FrameFolio / 帧册 发布，MIT 许可
- 20,000 条组件、500 特效、201 场景、11 类设备系数

---

更早的版本（v0.0.1 → v2.1.3）见 `docs/VERSIONS.md` 与 GitHub Releases。
