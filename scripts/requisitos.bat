:: Verifica se o Chocolatey já está instalado
IF EXIST "C:\ProgramData\chocolatey" (
    @echo Chocolatey já está instalado. Tentando atualizar...
    powershell -Command "choco upgrade chocolatey -y"
) ELSE (
    :: Instala o Chocolatey (gerenciador de pacotes para Windows)
    powershell -Command "[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
)

:: Instala Node.js, Python (versão pré-lançamento) e Git usando o Chocolatey
choco install nodejs.install -y
choco install python --pre -y
choco install git.install -y

:: Clona o repositório para o diretório raiz do disco C:
cd /
git clone https://github.com/cstihmtj/automacaoSiconv.git

cd C:\automacaoSiconv
npm install --no-package-lock

@echo Instalação concluída com sucesso!
pause