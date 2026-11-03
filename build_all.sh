#!/usr/bin/env bash
# Zingdex 跃索 —— 一次构建两端产物
# 用法：bash build_all.sh
# 产物：apps/desktop/dist/Zingdex-win32-x64/Zingdex.exe 与 apps/android/dist/Zingdex-<版本>.apk
set -euo pipefail

cd "$(dirname "$0")"

echo "==================== Windows exe ===================="
bash build_exe.sh

echo
echo "==================== Android apk ===================="
( cd apps/android && bash build_apk.sh )

echo
echo "==================== 汇总 ===================="
ls -la dist/
ls -la apps/android/dist/
