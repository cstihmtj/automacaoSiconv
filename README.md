# Guia de utilização - Robô SICONV
### Para executar o processo, siga os passos abaixo:
    1. Excluir arquivos nas pastas ARQUIVOS/TXT e ARQUIVOS/HOLERITES:
        - Apague todos os arquivos existentes nessas pastas.
    2. Controle de chapas executadas:
        - Para cada execução, será criado um arquivo com nome correspondente ao código do contrato da filial executada.
        - Este arquivo, terá uma copia das linhas executadas com sucesso apartir do TXT original.
    3. Iniciar o robô:
        - Clique no atalho "INICIAR ROBO" na área de trabalho. Uma tela preta será exibida para selecionar uma das opções disponíveis.
    4. Escolher uma das opções:
        - Opção 1: DP - Lançar Folha com anexo - Requisitos: arquivos TXT e HOLERITES nas pastas ARQUIVOS/TXT e ARQUIVOS/HOLERITES.
        - Opção 2: DP - Lançar Folha sem anexo - Requisito: arquivo TXT na pasta ARQUIVOS/TXT.
        - Opção 3: DP - Lançar Férias com anexo - Requisitos: arquivos TXT e HOLERITES nas pastas ARQUIVOS/TXT e ARQUIVOS/HOLERITES.
        - Opção 4: DP - Lançar Férias sem anexo - Requisito: arquivo TXT na pasta ARQUIVOS/TXT.
        - Opção 5: DP - Incluir anexo para Folha - Requisitos: arquivos TXT e HOLERITES nas pastas ARQUIVOS/TXT e ARQUIVOS/HOLERITES.
        - Opção 6: DP - Incluir anexo para Férias - Requisitos: arquivos TXT e HOLERITES nas pastas ARQUIVOS/TXT e ARQUIVOS/HOLERITES.
        - Opção 7: DP - Lançar Rescisão - Em desenvolvimento.
        - Opção 8: Auditoria - Lançar Folha/Férias - Requisito: arquivo TXT na pasta ARQUIVOS/TXT.
        - Opção 9: Auditoria - Rescisão - Em desenvolvimento.
    5. Verificação dos arquivos necessários:
        - O robô verificará a presença dos arquivos exigidos para a opção selecionada.
        - Se algum arquivo estiver faltando, uma mensagem de erro será exibida.
        - Caso exista um unico arquivo .PDF na pasta HOLERITES, o ROBO irá tentar separa-lo em CHAPAS considerando que seja o arquivo unificado.
        - Caso exista mais de um arquivo, o ROBO irá ignorar, considerando que já estejam separados por CHAPA.
    6. Processo de automação:
        - Caso todos os arquivos estejam presentes, o robô iniciará o processo, navegando até a tela de login do SICONV.
        - Será necessária a confirmação do uso do certificado uma vez pelo usuário; após isso, o processo será totalmente automatizado.
    7. Quando o robô travar:
        - Se o robô travar, não encerre o processo. Ele ficará travado por no máximo 3 minutos e continuará automaticamente após esse período.
    8. Relatório de execução:
        Após cada execução, os seguintes arquivos serão gerados na pasta LOG: 
        - "contrato".csv: contém um "backup" das linhas do arquivo TXT processadas com sucesso.
        -  erro.csv: contém um "backup" das linhas do arquivo TXT que não foram processadas corretamente.
        - geral.txt: fornece um panorama geral de cada execução, útil para controle do CSTI.
    # 9. Importante:
        - Não altere as pastas exceto LOG e ARQUIVOS. Caso contrário, o robô poderá apresentar problemas durante a execução.
        - Caso exista mais de um arquivo TXT na pasta, o robô não executará! 
## Esses passos visam garantir uma execução correta do processo e minimizar erros operacionais.
Em caso de dúvidas, procure o CSTI!