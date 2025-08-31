
@echo off
setlocal
cd /d "%~dp0"
REM Start a local HTTP server for the preview site on port 8080
where py >nul 2>nul
if %ERRORLEVEL%==0 (
  start "" http://localhost:8080/index.html
  py -3 -m http.server 8080
  goto :eof
)
where python >nul 2>nul
if %ERRORLEVEL%==0 (
  start "" http://localhost:8080/index.html
  python -m http.server 8080
  goto :eof
)
echo.
echo Python is required but was not found.
echo Download from https://www.python.org/downloads/ and re-run this file.
pause
