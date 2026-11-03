#!/usr/bin/env bash
# Zingdex 跃索 —— Android 构建工具链准备（无需 Android Studio / Gradle）
#
# 会下载并解压三件套到本目录：
#   jdk/          OpenJDK 17（含 javac / keytool）
#   build-tools/  Android build-tools 34（aapt2 / zipalign / d8 / apksigner）
#   platform/     Android platform 34（android.jar）
#
# 用法：bash prepare_toolchain.sh
set -euo pipefail

cd "$(dirname "$0")"

JDK_URL="https://repo.huaweicloud.com/openjdk/17.0.2/openjdk-17.0.2_windows-x64_bin.zip"
BT_URL="https://dl.google.com/android/repository/build-tools_r34-windows.zip"
# 注意：platform-34_r03.zip 官方已下线（404），必须用带扩展号的包
PLATFORM_URL="https://dl.google.com/android/repository/platform-34-ext7_r03.zip"

CACHE=".cache"
mkdir -p "$CACHE"

fetch() {
  local url="$1" out="$2"
  if [ -s "$out" ]; then
    echo "  已存在：$out（跳过下载）"
    return
  fi
  echo "  下载 $url"
  curl -fL --retry 2 --max-time 900 -o "$out" "$url"
  if [ ! -s "$out" ]; then
    echo "  下载失败或文件为空：$out" >&2
    return 1
  fi
}

unpack() {
  local zip="$1" dest="$2"
  mkdir -p "$dest"
  if command -v unzip >/dev/null 2>&1; then
    unzip -q -o "$zip" -d "$dest"
  else
    python -c "import sys,zipfile; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])" "$zip" "$dest"
  fi
}

echo "[1/3] OpenJDK 17"
fetch "$JDK_URL" "$CACHE/jdk17.zip"
[ -d jdk ] || unpack "$CACHE/jdk17.zip" jdk

echo "[2/3] build-tools 34"
fetch "$BT_URL" "$CACHE/buildtools.zip"
[ -d build-tools ] || unpack "$CACHE/buildtools.zip" build-tools

echo "[3/3] platform 34"
fetch "$PLATFORM_URL" "$CACHE/platform34.zip"
[ -d platform ] || unpack "$CACHE/platform34.zip" platform

echo
echo "校验："
[ -x jdk/jdk-17.0.2/bin/javac.exe ] && echo "  javac      OK" || echo "  javac      缺失"
[ -x build-tools/android-14/aapt2.exe ] && echo "  aapt2      OK" || echo "  aapt2      缺失"
[ -f platform/android-34/android.jar ] && echo "  android.jar OK" || echo "  android.jar 缺失"
echo
echo "接下来执行：bash build_apk.sh"
