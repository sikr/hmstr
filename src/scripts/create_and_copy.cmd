@echo off
if not exist %1\dist\data mkdir %1\dist\data
if not exist %1\dist\log mkdir %1\dist\log
if not exist %1\dist\ssl mkdir %1\dist\ssl
xcopy /d /y %1\src\ssl\ca.pem %1\dist\ssl
xcopy /d /y %1\src\ssl\cert.pem %1\dist\ssl
xcopy /d /y %1\src\ssl\key.pem %1\dist\ssl
xcopy /d /y %1\src\data\devices.json %1\dist\data
xcopy /d /y %1\src\data\channels.json %1\dist\data
xcopy /d /y %1\src\data\datapoints.json %1\dist\data
xcopy /d /y %1\src\data\rooms.json %1\dist\data