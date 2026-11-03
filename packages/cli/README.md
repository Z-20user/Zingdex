# zingdex-cli

命令行取用动效。

```bash
npx zingdex-cli find "商品列表" --device phone
```

或在仓库内：

```bash
node packages/cli/bin/zingdex.js find "商品列表" --device phone
```

## 四个命令

```bash
zingdex find "<关键词>" [--device <设备>] [--cat <类别>] [--max <毫秒>] [--json]
zingdex get  <fx-id|effect-id> [--device <设备>] [--json]
zingdex list [族]
zingdex stats
```

| 命令 | 做什么 |
|---|---|
| `find` | 按关键词找场景，输出可直接取码的 `fx` 编号 |
| `get` | 按编号取 HTML / CSS / JS，按设备缩放后输出 |
| `list` | 列 500 个基础特效编号，按族分组（`enter` / `light` / `exit` …） |
| `stats` | 打印数据规模 |

## 常用

```bash
# 手表上要一个入场，取出来已经是缩放后的
zingdex find "卡片" --cat 入场 --device watch
zingdex get fx-s001-03 --device watch

# 机器读
zingdex find "加载" --json | jq '.[0].cats[0].fx'
```

## 降级顺序

查不到时按这个顺序来，**不要凭记忆编编号**：

1. 换更短的词
2. 去掉 `--device` / `--cat` / `--max`
3. `zingdex list <族>` 看实际有哪些编号

## 许可

Apache-2.0（代码）· CC BY 4.0（数据）
