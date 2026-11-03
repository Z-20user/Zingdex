/* Zingdex · 跃索 —— Service Worker
 *
 * 策略：
 *   install  → 读 assets/precache.json，把整个站点放进缓存
 *   fetch    → 缓存优先；未命中时走网络并顺手缓存
 *   版本变化 → 新 SW 接管，清掉旧缓存
 *
 * 注意：SW 只在 https 或 localhost 生效；直接双击 index.html（file://）不会注册，也不影响使用。
 */
const CACHE_PREFIX = "zingdex-";
const PRECACHE_URL = "assets/precache.json";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const res = await fetch(PRECACHE_URL, { cache: "no-cache" });
      const meta = await res.json();
      const cache = await caches.open(CACHE_PREFIX + meta.version);
      // 并发 8 路抓取，避免一次开 200 个连接
      const queue = meta.files.slice();
      const workers = Array.from({ length: 8 }, async () => {
        while (queue.length) {
          const rel = queue.shift();
          try {
            await cache.add(new Request(rel, { cache: "reload" }));
          } catch (e) {
            /* 单个文件失败不阻塞整体 */
          }
        }
      });
      await Promise.all(workers);
      self.__zingdexVersion = meta.version;
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = self.__zingdexVersion ? CACHE_PREFIX + self.__zingdexVersion : null;
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n.startsWith(CACHE_PREFIX) && n !== keep).map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_PREFIX + (self.__zingdexVersion || "runtime"));
      const hit = await caches.match(req, { ignoreSearch: true });
      if (hit) return hit;

      try {
        const res = await fetch(req);
        if (res && res.ok && res.type === "basic") {
          cache.put(req, res.clone());
        }
        return res;
      } catch (e) {
        // 离线且未缓存：导航请求回落到首页，其余返回 504
        if (req.mode === "navigate") {
          const shell = await caches.match("index.html", { ignoreSearch: true });
          if (shell) return shell;
        }
        return new Response("离线且未缓存", { status: 504, statusText: "Offline" });
      }
    })()
  );
});
