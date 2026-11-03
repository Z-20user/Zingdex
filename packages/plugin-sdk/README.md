# @zingdex/plugin-sdk

给 Zingdex 加**你自己的动效**，不用改核心的那 20,000 条数据。

```bash
npm i @zingdex/plugin-sdk
```

## 最小例子

```js
const { definePlugin, createRegistry } = require("@zingdex/plugin-sdk");

const mine = definePlugin({
  name: "my-brand",
  version: "1.0.0",
  effects: [{
    id: "x-brand-rise",
    zh: "品牌上浮",
    html: "<div class='x-brand-rise'>内容</div>",
    css: `
      .x-brand-rise{animation:x-brand-rise-in .32s cubic-bezier(.16,1,.3,1) both}
      @keyframes x-brand-rise-in{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
    `,
    tags: ["入场"],
  }],
});

const reg = createRegistry({ plugins: [mine] });
const out = reg.get("x-brand-rise");
// -> { id, html, css, js, device, source: "my-brand", ... }
```

内置动效照常可用：`reg.get("fx-s001-07")` 会走原库。

## 三条硬规则

| 规则 | 为什么 |
|---|---|
| 编号必须以 `x-` 开头 | `fx-*` 是内置命名空间，第三方占了会冲突 |
| `html` 与 `css` 必须同时给 | 只给 css 没有元素可动，只给 html 是一帧静止画面 |
| 关键帧名带自己前缀 | 多个插件同时存在时，`fadeIn` 这种通用名会互相覆盖 |

违反任意一条，`definePlugin` 直接抛错，不会带着问题跑起来。

## API

### `definePlugin(spec) → Plugin`

校验并冻结插件定义。不产生副作用，可以安全地重复调用。

```
spec = {
  name: string          必填，插件名
  version?: string
  description?: string
  effects: Effect[]     必填，至少一条
}

Effect = {
  id: string            必填，^x-[a-z0-9]+(-[a-z0-9]+)*$
  zh: string            必填，中文名
  en?: string
  html: string          必填
  css: string           必填
  js?: string
  tags?: string[]       第一个 tag 会作为类别显示
  device?: string[]     适用设备，留空表示全部
}
```

### `createRegistry({ plugins }) → Registry`

| 方法 | 说明 |
|---|---|
| `get(id, { device })` | 取一条；插件优先，其次内置库 |
| `find(keyword, { device })` | 只搜插件动效，返回 `{ id, zh, mc, fx, plugin }[]` |
| `list()` | `{ 插件名: [id...] }` |

插件动效**不参与自动设备缩放** —— 系数怎么设取决于你的设计，SDK 不替你猜。

## 什么时候该写插件，什么时候不该

**该写**：品牌色、品牌曲线、公司设计规范里独有的节奏。
这些跟着你的产品走，不该混进通用库。

**不该写**：只是改了时长或颜色的内置动效。
直接取内置的，用 `--fx-dur` / `--fx-ease` 调，别复制一份。

## 许可

SDK 本身 Apache-2.0。**你的插件归你**，想用什么许可都行 —— 只是别用「Zingdex」命名，见仓库根 `TRADEMARK.md`。
