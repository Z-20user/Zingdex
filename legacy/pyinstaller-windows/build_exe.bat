@echo off
chcp 65001 >nul
cd /d "%~dp0"

for /f "delims=" %%v in ('python -c "import app_version;print(app_version.VERSION_NAME)"') do set VER=%%v
echo [0/5] TRANSIENT v%VER%

echo [1/5] 检查依赖
python -m pip install --quiet --disable-pip-version-check pyinstaller pillow || goto :err

echo [2/5] 生成图标与启动画面
python make_icon.py || goto :err
python make_splash.py || goto :err

echo [3/5] 打包（onefile + 无控制台）
if exist build-work rmdir /s /q build-work
if exist dist rmdir /s /q dist
python -m PyInstaller --noconfirm --clean --onefile --noconsole ^
  --name TRANSIENT ^
  --icon "%cd%\icon.ico" ^
  --version-file "%cd%\version.txt" ^
  --add-data "%cd%\site;site" ^
  --add-data "%cd%\splash;splash" ^
  --exclude-module numpy --exclude-module PIL --exclude-module tkinter.test --exclude-module test ^
  --distpath dist --workpath build-work --specpath build-work ^
  launcher.py || goto :err

echo [4/5] 自检
if not exist dist\TRANSIENT.exe goto :err
dir dist\TRANSIENT.exe

echo [5/5] 完成
echo.
echo 产物: %cd%\dist\TRANSIENT.exe
pause
exit /b 0

:err
echo.
echo 构建失败，请检查上方报错。
pause
exit /b 1
