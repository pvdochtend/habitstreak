$wslIp = wsl -d kali-linux hostname -I
$wslIp = $wslIp.Trim()

netsh interface portproxy delete v4tov4 listenport=3001 listenaddress=0.0.0.0

netsh interface portproxy add v4tov4 `
 listenaddress=0.0.0.0 listenport=3001 `
 connectaddress=$wslIp connectport=3001
