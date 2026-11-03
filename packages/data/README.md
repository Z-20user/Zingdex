# @zingdex/data

动效数据的 Node 读取接口。数据本体在仓库的 `apps/web/assets/`，这里只做读取，不复制，避免漂移。

```bash
npm i @zingdex/data
```

```js
const data = require("@zingdex/data");

data.stats();      // { scenes:201, entries:20000, baseEffects:500, components:18, canvasEffects:24 }
data.scenes();     // 201 个场景，每个带 cats[] 条目
data.entry("fx-s001-07");   // { html, css, js } 或 null
data.baseEffects();         // 500 条，键为 enter-01 这类编号
data.components();          // 18 个可调参数的成品组件
data.canvasEffects();       // 24 条 Canvas / WebGL 特效
```

## 数据从哪来

数据不在这个包里，而是跟应用共用同一份文件：

```
apps/web/assets/data.js         120 个场景
apps/web/assets/engine.js        81 个场景（追加）
apps/web/assets/lib/*.js        201 个分片，20,000 条 LIB_PAY 条目
apps/web/assets/effects.js       18 个成品组件
apps/web/assets/engine_*.js     500 个基础特效的 HTML / CSS / JS
apps/web/assets/lib-gl.js        24 条 Canvas / WebGL 特效
```

因此本包**必须在 Zingdex 仓库内使用**，或用 `ZINGDEX_ASSETS` 指向那个目录：

```bash
ZINGDEX_ASSETS=./apps/web/assets node your-script.js
```

## 许可

数据 CC BY 4.0 —— 商用可以，署名必须。见仓库根 `LICENSE-DATA`。
