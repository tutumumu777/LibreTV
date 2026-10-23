@echo off
chcp 65001 >nul
cd /d "%~dp0"
title LibreTV

if not exist "node_modules" (
  echo [LibreTV] 首次运行，正在安装依赖...
  call npm install --no-audit --no-fund
  if errorlevel 1 goto :fail
)

if not exist ".next" (
  echo [LibreTV] 首次运行，正在构建...
  call npm run build
  if errorlevel 1 goto :fail
)

echo [LibreTV] 启动中：http://127.0.0.1:8090
echo [LibreTV] 访问密码见 .env.local 的 PASSWORD
start "" "http://127.0.0.1:8090"
call npm start
goto :eof

:fail
echo.
echo [LibreTV] 启动失败，请检查上面的错误信息。
pause
