@echo off
chcp 65001 >nul
echo ========================================
echo   启动MAPWAR本地Vite服务器
echo ========================================
echo.
echo 正在以开发模式启动 Vite 服务器...
echo (支持 TypeScript 动态热更新及路网/事件编辑器保存 API)
echo.
echo 请使用浏览器访问命令行中输出的本地地址 (通常为 http://localhost:5173)
echo.
echo 按 Ctrl+C 停止服务器
echo ========================================
echo.

npm run dev

pause
