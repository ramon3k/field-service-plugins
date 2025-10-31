@echo off
echo Enabling TCP/IP for SQL Server Express...

:: Enable TCP/IP protocol
reg add "HKLM\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL15.SQLEXPRESS\MSSQLServer\SuperSocketNetLib\Tcp" /v "Enabled" /t REG_DWORD /d 1 /f

:: Set TCP port to 1433
reg add "HKLM\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL15.SQLEXPRESS\MSSQLServer\SuperSocketNetLib\Tcp\IPAll" /v "TcpPort" /t REG_SZ /d "1433" /f

:: Clear dynamic ports
reg add "HKLM\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL15.SQLEXPRESS\MSSQLServer\SuperSocketNetLib\Tcp\IPAll" /v "TcpDynamicPorts" /t REG_SZ /d "" /f

echo TCP/IP configuration updated. Restarting SQL Server service...

:: Restart SQL Server service
net stop "MSSQL$SQLEXPRESS"
net start "MSSQL$SQLEXPRESS"

echo Done! TCP/IP should now be enabled on port 1433.
pause