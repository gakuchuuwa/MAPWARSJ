@echo off
chcp 65001 >nul
setlocal
rem ============================================================
rem  MAPWAR 专用「无缓存」Edge 窗口
rem  ----------------------------------------------------------
rem  用处：这个窗口里的 Edge 完全不落磁盘缓存，任何一次 F5（不用按 Ctrl）
rem        都是全新拉取，效果等同于 Ctrl+F5。
rem  说明：
rem    1) --disk-cache-size=1 / --media-cache-size=1 把磁盘缓存压到最小；
rem    2) 必须用独立 --user-data-dir：Edge 已在运行时，新开的 msedge.exe 只会把
rem       网址交给旧进程，命令行参数会被丢掉。独立配置目录才会真正隔离；
rem    3) 该目录是另开的配置（无你的登录态/收藏），专供本机调试本地站点。
rem  用法：双击本文件，或 edge-no-cache.cmd http://localhost:5173/
rem ============================================================

set "EDGE=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=C:\Program Files\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" (
    echo 找不到 msedge.exe，请确认 Edge 已安装。
    pause
    exit /b 1
)

set "PROFILE=%LOCALAPPDATA%\MAPWARSJ\edge-nocache-profile"
if not exist "%PROFILE%" mkdir "%PROFILE%" >nul 2>&1

set "TARGET=%~1"
if "%TARGET%"=="" set "TARGET=http://localhost:5173/"

start "" "%EDGE%" --user-data-dir="%PROFILE%" --disk-cache-size=1 --media-cache-size=1 --disable-application-cache --no-first-run --no-default-browser-check --new-window "%TARGET%"

endlocal
