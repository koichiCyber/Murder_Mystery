@echo off
title MurdleGamr
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Download the LTS version from https://nodejs.org then run this again.
  pause
  exit /b
)

rem ===================================================================
rem  DIFFICULTY / DO KHO     (edit this block, save, then run again)
rem ===================================================================
rem  Preset / Mức độ:
rem    EASY   = good team favored: Accomplice sees SUSPECT only, can't withhold,
rem             seizes from round 5 (Team) / 6 (Free-for-all), Police safe on a
rem             wrong arrest, 10 rounds
rem    NORMAL = balanced (tested ~50/50 in Team mode)
rem    HARD   = Accomplice favored: seizes from round 2 (Team) / 3 (Free-for-all), Detective has no
rem             free retry, 5 rounds
set DIFFICULTY=NORMAL

rem  Optional overrides - remove "rem " at the start of a line to use it.
rem  Tùy chỉnh riêng - bỏ chữ "rem " ở đầu dòng để dùng.
rem  Accomplice sees the WEAPON too? (1 = yes, 0 = suspect only)
rem set ACC_SEES_WEAPON=1
rem  First round the Accomplice may seize the answer (Team mode / Free-for-all)
rem set ACC_SEIZE_ROUND_TEAM=4
rem set ACC_SEIZE_ROUND_FFA=5
rem  Accomplice may withhold a card once? (1 = yes, 0 = no)
rem set ACC_CAN_WITHHOLD=1
rem  Police wrong arrest: ELIMINATE (Police is out) or SAFE (only loses the power)
rem set POLICE_WRONG_ARREST=ELIMINATE
rem  Detective survives the first wrong accusation? (1 = yes, 0 = no)
rem set DETECTIVE_FREE_RETRY=1
rem  Default round limit (the host can still change it in the lobby)
rem set MAX_ROUNDS=8
rem ===================================================================

rem ===================================================================
rem  ONLINE PLAY via Cloudflare Tunnel (friends outside your home network)
rem  Choi online qua Cloudflare Tunnel (ban be o ngoai mang nha)
rem    1 = start a tunnel too (needs cloudflared, see README)   0 = local only
set USE_TUNNEL=1
rem ===================================================================

if "%USE_TUNNEL%"=="1" (
  where cloudflared >nul 2>nul
  if errorlevel 1 (
    echo.
    echo [Tunnel] cloudflared is not installed, so the game runs on your network only.
    echo          Install it with:  winget install Cloudflare.cloudflared
    echo          then close this window and run start.bat again.
    echo.
    node server.js
    pause
    exit /b
  )
  start "MurdleGamr server" cmd /k node server.js
  timeout /t 2 /nobreak >nul
  echo.
  echo [Tunnel] Look for the address ending in .trycloudflare.com below.
  echo          Send that address to your friends. Close this window to stop the tunnel.
  echo.
  cloudflared tunnel --url http://localhost:3000
  pause
  exit /b
)

node server.js
pause
