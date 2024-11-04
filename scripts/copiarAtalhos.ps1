# Caminho do atalho que você deseja copiar
$atalho1 = "C:\ARQUIVOS ROBO.lnk"
$atalho2 = "C:\INICIAR ROBO.lnk"

# Obtém todos os perfis de usuário no sistema
$perfils = Get-WmiObject Win32_UserProfile | Where-Object { $_.Special -eq $false }

# Loop através de cada perfil de usuário
foreach ($perfil in $perfils) {
    $areaTrabalho = Join-Path $perfil.LocalPath 'Desktop'
    
    # Verifica se a área de trabalho do usuário existe
    if (Test-Path $areaTrabalho) {
        # Copia os atalhos para a área de trabalho do usuário
        Copy-Item $atalho1 -Destination $areaTrabalho -Force
        Copy-Item $atalho2 -Destination $areaTrabalho -Force
    }
}
