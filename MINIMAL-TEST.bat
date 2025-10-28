@echo off
echo Step 1: Basic echo works
pause
setlocal EnableDelayedExpansion
echo Step 2: Delayed expansion enabled
pause
set "TEST=value"
echo Step 3: Variable set: %TEST%
pause
echo Done!
pause
