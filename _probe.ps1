$ErrorActionPreference = 'Continue'
$body = '{"username":"probe01","password":"***","nickname":"p"}'
try { Invoke-RestMethod -Uri 'http://localhost:1910/api/auth/register' -Method Post -ContentType 'application/json' -Body $body | Out-Null } catch { }
$login = Invoke-RestMethod -Uri 'http://localhost:1910/api/auth/login' -Method Post -ContentType 'application/json' -Body '{"username":"probe01","password":"***"}'
if (-not $login.token) { Write-Output 'LOGIN-FAIL'; exit 1 }
$h = @{ Authorization = "Bearer $($login.token)" }

foreach ($u in @(
    'http://localhost:1910/api/shipInfo/all',
    'http://localhost:1910/api/runtime',
    'http://localhost:1910/api/port/all',
    'http://localhost:1910/api/alertRecord/list?limit=200'
)) {
    $sw = [Diagnostics.Stopwatch]::StartNew()
    try {
        $resp = Invoke-WebRequest -Uri $u -Headers $h -UseBasicParsing -TimeoutSec 300
        $sw.Stop()
        $kb = [math]::Round(($resp.RawContentLength / 1KB), 1)
        Write-Output ("{0}  ->  {1} KB  in {2} ms" -f ($u.Split('?')[0]), $kb, [int]$sw.ElapsedMilliseconds)
    } catch {
        $sw.Stop()
        Write-Output ("{0}  ->  ERROR {1}" -f ($u.Split('?')[0]), $_.Exception.Message)
    }
}
