@echo off
echo Test 1: Basic echo works
echo Test 2: Writing to file > setup-test.log
echo Test 3: File written >> setup-test.log
echo Test 4: Using date/time: %date% %time% >> setup-test.log
echo Test 5: Using path: %~dp0 >> setup-test.log
setlocal EnableDelayedExpansion
echo Test 6: After EnableDelayedExpansion >> setup-test.log
echo.
echo All tests passed! Check setup-test.log
pause
