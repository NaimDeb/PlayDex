# Reproduit le job backend de la CI en local, sans rien pousser.
#
#   .\test-local.ps1                       # lance toute la suite
#   .\test-local.ps1 -Filter Optimistic    # un seul test (option --filter de phpunit)
#   .\test-local.ps1 -Down                 # arrete et supprime la base apres les tests
#
# La base MySQL reste lancee entre deux runs (iteration rapide).
# Les clefs JWT locales (config/jwt) + la passphrase de .env suffisent.

param(
    [string]$Filter = "",
    [switch]$Down
)

Set-Location $PSScriptRoot

Write-Host "==> Demarrage de la base MySQL de test (docker)" -ForegroundColor Cyan
docker compose -f compose.test.yml up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "Echec du demarrage de la base (docker est-il lance ?)" -ForegroundColor Red
    exit 1
}

Write-Host "==> Attente que MySQL soit pret..." -ForegroundColor Cyan
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    $status = docker inspect --format '{{.State.Health.Status}}' playdex-mysql-test 2>$null
    if ($status -eq "healthy") { $ready = $true; break }
    Start-Sleep -Seconds 2
}
if (-not $ready) {
    Write-Host "MySQL n'est pas pret apres 60s. Voir: docker logs playdex-mysql-test" -ForegroundColor Red
    exit 1
}

Write-Host "==> Migrations (env=test)" -ForegroundColor Cyan
php bin/console doctrine:migrations:migrate --no-interaction --env=test
if ($LASTEXITCODE -ne 0) {
    Write-Host "Echec des migrations" -ForegroundColor Red
    exit 1
}

Write-Host "==> PHPUnit" -ForegroundColor Cyan
if ($Filter -ne "") {
    php bin/phpunit --filter $Filter
} else {
    php bin/phpunit
}
$testExit = $LASTEXITCODE

if ($Down) {
    Write-Host "==> Arret de la base de test" -ForegroundColor Cyan
    docker compose -f compose.test.yml down -v
}

exit $testExit
