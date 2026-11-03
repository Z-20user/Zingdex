#!/usr/bin/env bash
# Zingdex 跃索 —— Windows 桌面应用构建脚本（PyInstaller onefile）
# 产物：dist/Zingdex.exe（原生窗口，不打开浏览器，不联网）
# 用法：bash build_exe.sh
set -euo pipefail

cd "$(dirname "$0")"

# 选一个装了 PyInstaller + pywebview 的 Python
pick_python() {
  local cand
  for cand in "${PYTHON:-}" python "C:/Python/Python311/python.exe" py; do
    [ -n "$cand" ] || continue
    if "$cand" -c "import PyInstaller, PIL, webview" >/dev/null 2>&1; then
      printf '%s' "$cand"
      return 0
    fi
  done
  for cand in "${PYTHON:-}" python "C:/Python/Python311/python.exe"; do
    [ -n "$cand" ] || continue
    if "$cand" -m pip --version >/dev/null 2>&1; then
      echo "正在为 $cand 安装 pyinstaller / pillow / pywebview ..." >&2
      "$cand" -m pip install --quiet --disable-pip-version-check pyinstaller pillow pywebview >&2 || continue
      printf '%s' "$cand"
      return 0
    fi
  done
  return 1
}

PY="$(pick_python || true)"
if [ -z "$PY" ]; then
  echo "找不到可用的 Python（需要 pyinstaller + pillow + pywebview）。请设置 PYTHON 环境变量。" >&2
  exit 1
fi

VER="$("$PY" -c "import app_version; print(app_version.VERSION_NAME)")"
FILEVER="$("$PY" -c "import app_version; print('.'.join(map(str, app_version.FILE_VERSION)))")"

to_win() {
  if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else printf '%s' "$1"; fi
}
ROOT="$(to_win "$(pwd)")"

echo "[0/5] Zingdex v$VER (file version $FILEVER)"
echo "  python   : $PY"

echo "[1/5] 生成图标"
"$PY" make_icon.py

echo "[2/5] 清理"
rm -rf build-work dist

echo "[3/5] 打包（onefile + 无控制台 + 原生窗口）"
"$PY" -m PyInstaller \
  --noconfirm --clean --onefile --noconsole \
  --name Zingdex \
  --icon "$ROOT/icon.ico" \
  --version-file "$ROOT/version.txt" \
  --add-data "$ROOT/site;site" \
  --collect-all webview \
  --collect-all pythonnet \
  --collect-all clr_loader \
  --hidden-import clr \
  --exclude-module numpy \
  --exclude-module PIL \
  --exclude-module matplotlib \
  --exclude-module tkinter.test \
  --distpath dist \
  --workpath build-work \
  --specpath build-work \
  main.py

echo "[4/5] 自检（启动窗口 → 读组件页 → 测剪贴板 → 退出）"
rm -f "$APPDATA/Zingdex/selftest.json" 2>/dev/null || true
timeout 45 "./dist/Zingdex.exe" --selftest >/dev/null 2>&1 || true
sleep 1
if [ -f "$APPDATA/Zingdex/selftest.json" ]; then
  cat "$APPDATA/Zingdex/selftest.json"
else
  echo "  自检未产出结果（可手动运行 dist/Zingdex.exe 检查）" >&2
fi

echo "[5/5] 完成"
ls -la dist/Zingdex.exe
echo
echo "产物：$ROOT/dist/Zingdex.exe"
