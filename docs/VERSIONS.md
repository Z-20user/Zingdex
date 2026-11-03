# 版本史 / Version History

只记录对外发布过的版本。更早的内部构建不在此表。

| 版本 | 日期 | 产物 | 说明 |
|---|---|---|---|
| **3.1.1** | 2026-11-03 | `Zingdex-3.1.1-android.apk` · `-windows-portable.zip` | 修复技术交流区块布局；品牌统一显示 Zingdex · 跃索 |
| 3.1.0 | 2026-11-03 | `Zingdex-3.1.0-android.apk` · `-windows-portable.zip` | 开源定稿：代码 Apache-2.0、数据 CC BY 4.0；monorepo；签名密钥移出仓库 |
| 3.0.2 | 2026-11-03 | `FrameFolio-3.0.2-android.apk` · `-windows-portable.zip` | 使用说明去掉「安装版/便携版」表述 |
| 3.0.1 | 2026-11-03 | `FrameFolio-3.0.1-android.apk` · `-windows-portable.zip` | 移除二维码与保存入口，只留邮箱 |
| 3.0.0 | 2026-11-03 | `FrameFolio-3.0.0-android.apk` · `-windows-portable.zip` | 首次以 FrameFolio / 帧册 发布，MIT |
| 2.1.3 及更早 | 2026-10 | 已归档 | 带授权界面的版本，见 `docs/AUTHORIZATION-RETROSPECTIVE.md` |

## 命名沿革

```
TRANSIENT / 瞬态  ──►  FrameFolio / 帧册 (3.0)  ──►  Zingdex · 跃索 (3.1)
```

包名始终为 `com.transientlab.motion`，不随改名变动，保证覆盖升级。

## 保留策略

- **从 3.0 起，每个版本的安装包都保留在 Releases，不删除**
- 旧版可以继续下载、继续安装
- 只有出现严重安全问题时才会撤下某个产物，并在此表中说明

## 维护节奏

个人独立维护，每周最多更新一次（通常周末）；紧急 Bug 除外。
