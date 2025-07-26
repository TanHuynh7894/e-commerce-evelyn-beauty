# Danh sách thư mục chứa code cần obfuscate
$folders = @(
    "auth",
    "config",
    "controllers",
    "middlewares",
    "models",
    "routes",
    "utils",
    "view"
)

# Đường dẫn gốc là thư mục hiện tại chứa script
$rootPath = $PSScriptRoot
$distPath = Join-Path $rootPath "dist"

# Tạo thư mục dist nếu chưa tồn tại
if (-not (Test-Path $distPath)) {
    New-Item -Path $distPath -ItemType Directory -Force
}

# Obfuscate các file JS trong các thư mục chỉ định
foreach ($folder in $folders) {
    $sourcePath = Join-Path $rootPath $folder

    if (-not (Test-Path $sourcePath)) {
        Write-Host "Skipped (not found): $folder"
        continue
    }

    $outputPath = Join-Path $distPath $folder

    if (-not (Test-Path $outputPath)) {
        New-Item -Path $outputPath -ItemType Directory -Force
    }

    $files = Get-ChildItem -Path $sourcePath -Recurse -Filter *.js -ErrorAction SilentlyContinue

    if ($files.Count -eq 0) {
        Write-Host "No .js files in: $folder → skipped obfuscation"
        continue
    }

    foreach ($file in $files) {
        $relativePath = $file.FullName.Substring($sourcePath.Length)
        $destinationFile = Join-Path $outputPath $relativePath

        $destinationDir = Split-Path $destinationFile
        if (-not (Test-Path $destinationDir)) {
            New-Item -Path $destinationDir -ItemType Directory -Force
        }

        javascript-obfuscator $file.FullName --output $destinationFile --compact true --control-flow-flattening true
    }
}

# Obfuscate server.js nếu tồn tại
$serverFile = Join-Path $rootPath "server.js"
if (Test-Path $serverFile) {
    javascript-obfuscator $serverFile --output "$distPath\server.js" --compact true --control-flow-flattening true
}

# Sao chép thư mục public/products và public/profiles vào dist/public
$publicRoot = Join-Path $rootPath "public"
$publicDist = Join-Path $distPath "public"

$subDirs = @("products", "profiles")

foreach ($dir in $subDirs) {
    $src = Join-Path $publicRoot $dir
    $dst = Join-Path $publicDist $dir

    if (Test-Path $src) {
        Write-Host "Copying: public\$dir"
        Copy-Item -Path $src -Destination $dst -Recurse -Force
    } else {
        Write-Host "Skipped copy: public\$dir (not found)"
    }
}
