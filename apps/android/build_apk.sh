#!/usr/bin/env bash
# Zingdex 跃索 —— 无 Gradle 的最小 APK 构建脚本
#
# 用法：bash build_apk.sh
# 产物：dist/Zingdex-<版本>.apk
#
# 工具链按以下顺序自动探测，命中即用：
#   1. $JAVA_HOME / $ANDROID_SDK / $ANDROID_HOME
#   2. 本目录的 jdk/ 与 sdk/（prepare_toolchain.sh 下载的布局）
#   3. 本机通用工具链 D:\.AGENT-WORK STATION\android-build\{jdk17,sdk}
#   4. 旧版布局 ./jdk/jdk-17.0.2 + ./build-tools/android-14 + ./platform/android-34
set -euo pipefail

cd "$(dirname "$0")"

PY="${PYTHON:-python}"
# 让 python 能 import 上级目录的 app_version.py（版本单一数据源）
export PYTHONPATH="$(cd .. && pwd)${PYTHONPATH:+:$PYTHONPATH}"
VER="$("$PY" -c "import app_version; print(app_version.VERSION_NAME)")"
VCODE="$("$PY" -c "import app_version; print(app_version.VERSION_CODE)")"

to_win() {
  if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else printf '%s' "$1"; fi
}

first_existing() {
  for candidate in "$@"; do
    if [ -n "$candidate" ] && [ -e "$candidate" ]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
  return 1
}

# ------------------------------------------------------------------ JDK
JDK="$(first_existing "${JAVA_HOME:-}" "./jdk/jdk-17.0.2" "./jdk" \
        "/d/.AGENT-WORK STATION/android-build/jdk17" || true)"
if [ -z "$JDK" ] || [ ! -x "$JDK/bin/java.exe" ]; then
  echo "找不到 JDK 17。请设置 JAVA_HOME，或先执行 bash prepare_toolchain.sh" >&2
  exit 1
fi
JAVA="$(to_win "$JDK")/bin/java.exe"
JAVAC="$(to_win "$JDK")/bin/javac.exe"
KEYTOOL="$(to_win "$JDK")/bin/keytool.exe"

# ------------------------------------------------------------------ SDK
SDK="$(first_existing "${ANDROID_SDK:-}" "${ANDROID_HOME:-}" "./sdk" \
        "/d/.AGENT-WORK STATION/android-build/sdk" || true)"
if [ -z "$SDK" ]; then
  echo "找不到 Android SDK。请设置 ANDROID_SDK，或先执行 bash prepare_toolchain.sh" >&2
  exit 1
fi

BT="$(first_existing "$SDK/build-tools/34.0.0" "$SDK/build-tools/android-14" "./build-tools/android-14" || true)"
AJAR="$(first_existing "$SDK/platforms/android-34/android.jar" "./platform/android-34/android.jar" || true)"
if [ -z "$BT" ] || [ -z "$AJAR" ]; then
  echo "找不到 build-tools 34 或 android.jar（platform 34）。" >&2
  echo "  SDK = $SDK" >&2
  exit 1
fi

AAPT2="$BT/aapt2.exe"
ZIPALIGN="$BT/zipalign.exe"
D8_JAR="$BT/lib/d8.jar"
SIGNER_JAR="$BT/lib/apksigner.jar"

for f in "$AAPT2" "$ZIPALIGN" "$D8_JAR" "$SIGNER_JAR"; do
  if [ ! -e "$f" ]; then
    echo "工具链缺少文件：$f" >&2
    exit 1
  fi
done

# ------------------------------------------------------------------ 签名
# 密钥库与口令不随仓库分发。构建前请在仓库外准备好：
#   KS_PATH      指向 .jks 文件（默认 keystore/zingdex-demo.jks，该目录已被 .gitignore 排除）
#   KS_PASS_FILE 指向一个只含口令的单行文本文件（默认 keystore/ks.pass）
# 也可以用环境变量 KS_PASS 直接给出，但不要把口令写进任何被提交的文件。
KS="${KS_PATH:-keystore/zingdex-demo.jks}"
KS_ALIAS="${KS_ALIAS:-zingdex}"
if [ -z "${KS_PASS:-}" ]; then
  KS_PASS_FILE="${KS_PASS_FILE:-keystore/ks.pass}"
  if [ ! -f "$KS_PASS_FILE" ]; then
    echo "缺少签名口令：请设置 KS_PASS，或把口令写入 $KS_PASS_FILE（该文件不入库）" >&2
    exit 1
  fi
  KS_PASS="$(tr -d '
' < "$KS_PASS_FILE")"
fi
if [ ! -f "$KS" ]; then
  echo "缺少密钥库：$KS（该文件不入库，请从备份恢复或另行生成）" >&2
  exit 1
fi

OUT_DIR="dist"
APK_NAME="Zingdex-${VER}.apk"
WORK="work"

echo "Zingdex v${VER} (versionCode ${VCODE})"
echo "  JDK      : $JDK"
echo "  SDK      : $SDK"
echo "  build-tools: $BT"

echo "[0/8] 清理"
rm -rf "$WORK"
mkdir -p "$WORK/classes" "$WORK/dex" "$OUT_DIR"

echo "[1/8] 生成图标资源"
"$PY" make_android_icon.py

echo "[2/8] 复制站点资源到 assets"
SITE_SRC="${SITE_DIR:-../site}"
[ -d "$SITE_SRC" ] || SITE_SRC="../../site"
if [ ! -d "$SITE_SRC" ]; then
  echo "找不到站点目录。请把 site/ 放在本目录同级，或用 SITE_DIR=/path/to/site 指定。" >&2
  exit 1
fi
echo "  source: $SITE_SRC"
rm -rf app/assets
mkdir -p app/assets
cp -r "$SITE_SRC" app/assets/site

echo "[3/8] aapt2 compile"
"$AAPT2" compile --dir app/res -o "$WORK/res.zip"

echo "[4/8] aapt2 link"
# 版本号只有一个来源（app_version.py）：先把清单里的写死值替换掉再交给 aapt2
sed -e "s/android:versionCode=\"[0-9]*\"/android:versionCode=\"$VCODE\"/" \
    -e "s/android:versionName=\"[^\"]*\"/android:versionName=\"$VER\"/" \
    app/AndroidManifest.xml > "$WORK/AndroidManifest.xml"
"$AAPT2" link \
  -o "$WORK/base.apk" \
  -I "$AJAR" \
  --manifest "$WORK/AndroidManifest.xml" \
  -A app/assets \
  --min-sdk-version 23 \
  --target-sdk-version 34 \
  --version-code "$VCODE" \
  --version-name "$VER" \
  "$WORK/res.zip"

echo "[5/8] javac"
mapfile -t SRC < <(find app/java -name "*.java")
"$JAVAC" -encoding UTF-8 -source 8 -target 8 -bootclasspath "$AJAR" -classpath "$AJAR" \
  -d "$WORK/classes" "${SRC[@]}"

echo "[6/8] d8 -> classes.dex"
mapfile -t CLS < <(find "$WORK/classes" -name "*.class")
"$JAVA" -cp "$D8_JAR" com.android.tools.r8.D8 \
  --lib "$AJAR" --min-api 23 --output "$WORK/dex" "${CLS[@]}"

"$PY" - "$WORK/base.apk" "$WORK/dex/classes.dex" "$WORK/unsigned.apk" <<'PY'
import shutil, sys, zipfile
base, dex, out = sys.argv[1], sys.argv[2], sys.argv[3]
shutil.copyfile(base, out)
with zipfile.ZipFile(out, "a", zipfile.ZIP_DEFLATED) as z:
    z.write(dex, "classes.dex")
print("   dex merged ->", out)
PY

echo "[7/8] zipalign"
"$ZIPALIGN" -f -p 4 "$WORK/unsigned.apk" "$WORK/aligned.apk"
"$ZIPALIGN" -c -p 4 "$WORK/aligned.apk" >/dev/null && echo "  对齐校验通过"

echo "[8/8] 签名"
if [ ! -f "$KS" ]; then
  echo "  未找到证书 $KS，生成自签名证书（仅用于本地安装，不可用于上架）"
  mkdir -p "$(dirname "$KS")"
  "$KEYTOOL" -genkeypair -keystore "$KS" -alias "$KS_ALIAS" \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$KS_PASS" -keypass "$KS_PASS" \
    -dname "CN=Zingdex, OU=Motion, O=Zingdex, L=Shanghai, C=CN" -noprompt
fi

"$JAVA" -jar "$SIGNER_JAR" sign \
  --ks "$KS" --ks-pass "pass:$KS_PASS" \
  --key-pass "pass:$KS_PASS" --ks-key-alias "$KS_ALIAS" \
  --out "$OUT_DIR/$APK_NAME" "$WORK/aligned.apk"

"$JAVA" -jar "$SIGNER_JAR" verify --print-certs "$OUT_DIR/$APK_NAME" | head -8

echo
echo "清单校验"
"$AAPT2" dump badging "$OUT_DIR/$APK_NAME" | grep -E "^(package|application-label|sdkVersion|targetSdkVersion|launchable-activity)" || true

echo
echo "产物：$(pwd)/$OUT_DIR/$APK_NAME"
ls -la "$OUT_DIR/$APK_NAME"
"$PY" - "$OUT_DIR/$APK_NAME" <<'PY'
import hashlib, sys
path = sys.argv[1]
h = hashlib.sha256(open(path, "rb").read()).hexdigest()
import os
print("   size   : %.1f KB" % (os.path.getsize(path) / 1024.0))
print("   sha256 : " + h)
PY
