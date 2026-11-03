#!/usr/bin/env bash
# Zingdex 跃索 —— Electron 桌面应用构建（离线手动打包，不依赖 GitHub）
#
# 产物：desktop/dist/Zingdex-win32-x64/Zingdex.exe
#
# 构建提速的两处关键改动：
#   1. Electron 运行时（约 200 MB）只在版本变化时复制一次，命中缓存直接跳过
#   2. 站点资源只做一次拷贝再复用，不再每个环节各拷一遍
set -euo pipefail

cd "$(dirname "$0")"
PKG_DIR="$(pwd -W 2>/dev/null || pwd)"   # 原生 Windows 路径，Python 才认
cd apps/desktop

PY="${PYTHON:-C:/Python/Python311/python.exe}"
[ -x "$PY" ] || PY="$(command -v python || command -v python3)"
VER="$("$PY" -c "import sys; sys.path.insert(0,'$PKG_DIR'); import app_version; print(app_version.VERSION_NAME)")"
FV="$("$PY" -c "import sys; sys.path.insert(0,'$PKG_DIR'); import app_version; print('.'.join(map(str, app_version.FILE_VERSION)))")"

OUT="dist/Zingdex-win32-x64"
RT_VER="$(node -p "require('./node_modules/electron/package.json').version" 2>/dev/null || echo unknown)"

echo "Zingdex v${VER}（文件版本 ${FV}）"

echo "[1/6] 检查 Electron 运行时"
if [ ! -d node_modules/electron/dist ]; then
  echo "  缺少运行时，正在通过 npmmirror 下载…"
  ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/" node node_modules/electron/install.js
fi
if [ ! -f node_modules/electron/dist/electron.exe ]; then
  echo "Electron 运行时缺失，无法打包。" >&2
  exit 1
fi

echo "[2/6] 准备站点资源"
rm -rf site
mkdir -p site
cp -r ../web/. site/
cp ../../icon.ico icon.ico

echo "[3/6] 准备输出目录"
MARK="$OUT/.runtime-version"
CACHED=""
[ -f "$MARK" ] && CACHED="$(cat "$MARK")"
if [ "$CACHED" != "$RT_VER" ]; then
  echo "  运行时 ${RT_VER}（缓存 ${CACHED:-无}）→ 复制约 200 MB，仅此一次"
  rm -rf "$OUT"
  mkdir -p "$OUT"
  cp -r node_modules/electron/dist/. "$OUT"/
  mv "$OUT/electron.exe" "$OUT/Zingdex.exe"
  echo "$RT_VER" > "$MARK"
else
  echo "  运行时 ${RT_VER} 命中缓存，跳过 200 MB 复制"
fi

echo "[4/6] 放入应用文件"
rm -rf "$OUT/resources/app"
mkdir -p "$OUT/resources/app"
cp main.js preload.js update.js package.json icon.ico "$OUT/resources/app/"
cp -r site "$OUT/resources/app/site"
node ../tools/set_pkg_version.js "$OUT/resources/app/package.json" "$VER"

echo "[5/6] 写入图标与版本信息"
node patch-exe.js "$OUT/Zingdex.exe" icon.ico "$FV"

echo "[6/6] 自检"
# 开源版没有任何令牌机制：不生成、也不留 license.token
rm -f "$OUT/license.token"

# userData 已经迁到「exe 同目录\data」，自检结果也写在那里；老路径留作兜底
SELF_DIR="$OUT/data"
rm -f "$SELF_DIR/selftest.json" "$SELF_DIR/selftest-stage.txt" \
      "$APPDATA/Zingdex/selftest.json" "$APPDATA/Zingdex/selftest-stage.txt" 2>/dev/null || true
timeout 180 "$OUT/Zingdex.exe" --selftest >/dev/null 2>&1 || true
sleep 1
SELF_JSON=""
for cand in "$SELF_DIR/selftest.json" "$APPDATA/Zingdex/selftest.json"; do
  [ -f "$cand" ] && SELF_JSON="$cand" && break
done
if [ -z "$SELF_JSON" ]; then
  echo "  自检失败：没有产出结果，最后阶段：" >&2
  cat "$SELF_DIR/selftest-stage.txt" "$APPDATA/Zingdex/selftest-stage.txt" 2>/dev/null >&2 \
    || echo "  （没有阶段记录，可能启动即失败）" >&2
  exit 1
fi
cat "$SELF_JSON"

# 自检会在 data 里留下缓存、prefs、激活探针，不能打进安装包
rm -rf "$SELF_DIR"

echo
echo "产物：$(pwd)/$OUT/Zingdex.exe"
ls -la "$OUT/Zingdex.exe"
