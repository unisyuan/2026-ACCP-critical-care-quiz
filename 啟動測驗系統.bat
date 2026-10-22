@echo off
chcp 65001 >nul
title ACCP 重症藥學 150 題 複習測驗系統
echo 正在啟動 2026 ACCP/ASHP 重症藥學 複習系統...
python "%~dp0start_server.py"
pause
