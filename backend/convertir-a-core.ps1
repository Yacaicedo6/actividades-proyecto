# Script para convertir un usuario en CORE
# Uso: .\convertir-a-core.ps1 -username "yan"

param(
    [Parameter(Mandatory=$true)]
    [string]$username
)

$dbPath = "$PSScriptRoot\test.db"

if (-not (Test-Path $dbPath)) {
    Write-Host "❌ Error: No se encuentra test.db" -ForegroundColor Red
    Write-Host "Asegúrate de estar en la carpeta backend y que el servidor haya creado la base de datos." -ForegroundColor Yellow
    exit 1
}

Write-Host "🔄 Conectando a base de datos..." -ForegroundColor Cyan

# Verificar si el usuario existe
$checkQuery = "SELECT username, role FROM users WHERE username = '$username';"
$currentUser = sqlite3 $dbPath $checkQuery

if ([string]::IsNullOrEmpty($currentUser)) {
    Write-Host "❌ Error: Usuario '$username' no existe" -ForegroundColor Red
    Write-Host "`nUsuarios disponibles:" -ForegroundColor Yellow
    sqlite3 $dbPath "SELECT username, role FROM users;"
    exit 1
}

Write-Host "✓ Usuario encontrado: $currentUser" -ForegroundColor Green

# Actualizar a CORE
$updateQuery = "UPDATE users SET role = 'core' WHERE username = '$username';"
sqlite3 $dbPath $updateQuery

# Verificar
$verifyQuery = "SELECT username, role FROM users WHERE username = '$username';"
$updatedUser = sqlite3 $dbPath $verifyQuery

Write-Host "`n✅ Usuario actualizado:" -ForegroundColor Green
Write-Host $updatedUser -ForegroundColor White

Write-Host "`n📝 Todos los usuarios en el sistema:" -ForegroundColor Cyan
sqlite3 $dbPath "SELECT id, username, role FROM users;"

Write-Host "`n✨ ¡Listo! Recarga la página en el navegador para ver los cambios." -ForegroundColor Green
