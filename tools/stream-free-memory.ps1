# 直播前腾内存：游戏（Edge）和直播（OBS）都开好之后，双击桌面「直播前腾内存.bat」运行。
# 只关下面「要关的程序」名单里的东西；游戏服务、Edge、OBS、终端窗口、系统进程一律不碰。
# 加参数 -List 只列出会关什么，不真关（测试用）。
param([switch]$List)

$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

# 要关的程序（进程名，不带 .exe）
$targets = @(
    'Antigravity', 'language_server',      # Antigravity 及其语言服务（最占内存）
    'opencode-cli', 'opencode',
    'DeepSeek Harness',
    'claude',                              # Claude 桌面程序（直播时不用）
    'chrome',                              # Chrome（游戏用 Edge 跑）
    'Code', 'Cursor',                      # 编辑器，开着就关
    'MSPCManager', 'MSPCManagerCore'       # 微软电脑管家界面（约 400MB；后台服务不动）
)
# 这些 node 是 AI 工具的插件服务，命令行里带这些字样的才关；游戏服务的 node 不带
$nodeToolPattern = 'codegraph|rea-agents|chrome-devtools-mcp|npx-cli|opencode|mcp'

function FreeMB { [int](Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory).AvailableMBytes }

Write-Host ''
Write-Host '====== 直播前腾内存 ======' -ForegroundColor Cyan

# 先确认游戏和直播都在跑，免得关错时机
$edge = Get-Process msedge
$obs = Get-Process obs64, obs
$game = Get-NetTCPConnection -State Listen -LocalPort 5173
$warn = @()
if (-not $edge) { $warn += 'Edge 没开（游戏没开？）' }
if (-not $obs)  { $warn += 'OBS 没开' }
if (-not $game) { $warn += '游戏服务没在运行（5173 端口没有监听）' }
if ($warn.Count -gt 0 -and -not $List) {
    Write-Host ''
    foreach ($w in $warn) { Write-Host "  注意：$w" -ForegroundColor Yellow }
    $ans = Read-Host '还要继续关吗？输入 y 继续，直接回车退出'
    if ($ans -ne 'y') { exit }
}

# 收集要关的进程
$procs = @(Get-Process | Where-Object { $targets -contains $_.ProcessName })
$nodes = @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object {
    $_.CommandLine -match $nodeToolPattern -and $_.CommandLine -notmatch 'MAPWARSJ\\node_modules\\.bin\\..\\vite'
})

$before = FreeMB
Write-Host ''
Write-Host ("关之前可用内存：{0:N0} MB" -f $before)
Write-Host ''
if ($procs.Count -eq 0 -and $nodes.Count -eq 0) {
    Write-Host '没有要关的程序，已经很干净了。' -ForegroundColor Green
} else {
    Write-Host '要关的程序：'
    $procs | Group-Object ProcessName | ForEach-Object {
        $mb = ($_.Group | Measure-Object WorkingSet64 -Sum).Sum / 1MB
        Write-Host ("  {0,-20} {1,3} 个进程  约 {2,6:N0} MB" -f $_.Name, $_.Count, $mb)
    }
    if ($nodes.Count -gt 0) { Write-Host ("  {0,-20} {1,3} 个进程" -f 'AI 插件服务(node)', $nodes.Count) }

    if ($List) { Write-Host ''; Write-Host '（-List 模式：只列出，没有关）' -ForegroundColor Yellow; exit }

    # 先礼貌地关窗口，等 5 秒；还没退的再强制结束
    foreach ($p in $procs) { if ($p.MainWindowHandle -ne 0) { [void]$p.CloseMainWindow() } }
    Start-Sleep -Seconds 5
    foreach ($p in $procs) { if (-not $p.HasExited) { Stop-Process -Id $p.Id -Force } }
    foreach ($n in $nodes) { Stop-Process -Id $n.ProcessId -Force }
    Start-Sleep -Seconds 3

    $after = FreeMB
    Write-Host ''
    Write-Host ("关之后可用内存：{0:N0} MB（多出 {1:N0} MB）" -f $after, ($after - $before)) -ForegroundColor Green
}

# 关完再确认一次游戏和直播没被误伤
Write-Host ''
if (Get-NetTCPConnection -State Listen -LocalPort 5173) { Write-Host '  游戏服务：正常' -ForegroundColor Green } else { Write-Host '  游戏服务：没在运行！' -ForegroundColor Red }
if (Get-Process msedge) { Write-Host '  Edge：正常' -ForegroundColor Green } else { Write-Host '  Edge：没开' -ForegroundColor Red }
if (Get-Process obs64, obs) { Write-Host '  OBS：正常' -ForegroundColor Green } else { Write-Host '  OBS：没开' -ForegroundColor Red }
Write-Host ''
Read-Host '按回车关闭这个窗口'
