@echo off
setlocal
set "FLASH_CANVAS_DIR=%~dp0"
if exist "%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe" (
    start "" "%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe" "%FLASH_CANVAS_DIR%flash-canvas.code-workspace"
) else if exist "%ProgramFiles%\Microsoft VS Code\Code.exe" (
    start "" "%ProgramFiles%\Microsoft VS Code\Code.exe" "%FLASH_CANVAS_DIR%flash-canvas.code-workspace"
) else (
    echo VS Code was not found in its standard install locations. Opening the preview only.
)
start "" "%FLASH_CANVAS_DIR%index.html"
