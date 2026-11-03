# -*- coding: utf-8 -*-
"""一次性补丁：让 build_apk.sh 在 link 前用 app_version 覆盖清单里的版本号。"""
import io

BS = chr(92)  # 反斜杠，别用转义，heredoc 会吃掉

p = 'build_apk.sh'
s = io.open(p, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'

old_lines = [
    'echo "[4/8] aapt2 link"',
    '"$AAPT2" link ' + BS,
    '  -o "$WORK/base.apk" ' + BS,
    '  -I "$AJAR" ' + BS,
    '  --manifest app/AndroidManifest.xml ' + BS,
]

new_lines = [
    'echo "[4/8] aapt2 link"',
    '# 版本号只有一个来源（app_version.py）：先把清单里的写死值替换掉再交给 aapt2',
    'sed -e "s/android:versionCode=' + BS + '"[0-9]*' + BS + '"/android:versionCode=' + BS + '"$VCODE' + BS + '"/" ' + BS,
    '    -e "s/android:versionName=' + BS + '"[^' + BS + '"]*' + BS + '"/android:versionName=' + BS + '"$VER' + BS + '"/" ' + BS,
    '    app/AndroidManifest.xml > "$WORK/AndroidManifest.xml"',
    '"$AAPT2" link ' + BS,
    '  -o "$WORK/base.apk" ' + BS,
    '  -I "$AJAR" ' + BS,
    '  --manifest "$WORK/AndroidManifest.xml" ' + BS,
]

old = nl.join(old_lines)
new = nl.join(new_lines)
assert old in s, '找不到 link 段落'
io.open(p, 'w', encoding='utf-8', newline='').write(s.replace(old, new, 1))
print('patched')
