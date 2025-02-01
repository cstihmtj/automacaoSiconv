const lineReader = require("line-reader")
const fs = require("fs")
const path = require("path")
const readline = require("readline")
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const writeFile = require("./funcs/writeFile")
require("dotenv/config")
const dp = require("./automacoes/dp")
const audit = require("./automacoes/auditoria")
const rh = require("./automacoes/rh")
const main = require("./funcs/main")
const { spawn } = require("child_process");
const { performance } = require("perf_hooks");

let browser, page

const holeritesPath = path.join(__dirname, "arquivos", "holerites")
const txtPath = path.join(__dirname, "arquivos", "txt")

process.on("SIGINT", async () => {
    console.log("\nInterrompido pelo usuário (Ctrl+C).")
    await main.closeBrowser()
    process.exit(0)
})

process.on("SIGTERM", async () => {
    console.log("\nProcesso terminado.")
    await main.closeBrowser()
    process.exit(0)
})

const resetFolder = async () => {
    try {
        for (const path of [holeritesPath, txtPath]) {
            fs.existsSync(path) ? fs.rmSync(path, { recursive: true, force: true }) : false
            fs.mkdirSync(path, { recursive: true })
        }
        writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - pasta holerites resetada!`)
        return true
    } catch (error) {
        console.log("resetFolder: ", error)
        return false
    }
}

const verifyHoleritesExist = async () => {
    try {
        const totalFiles = fs.readdirSync(holeritesPath)
        if (fs.existsSync(holeritesPath) && totalFiles.length == 1) {
            writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${totalFiles.length} Holerite unificado encontrado!`)
            return [true, totalFiles.length]
        } else if (fs.existsSync(holeritesPath) && totalFiles.length > 1) {
            writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${totalFiles.length} Holerites separados encontrados!`)
            return [true, totalFiles.length]
        } else {
            writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Nenhum holerite encontrado - Total: ${totalFiles.length}!`)
            console.log(`Nenhum holerite encontrado - Total: ${totalFiles.length}!`)
            return [false, false]
        }
    } catch (error) {
        console.log("Não foi possivel obter os arquivos holerites!")
        return false
    }
}

const verifyTxtExist = async () => {
    try {
        const txtFiles = fs.readdirSync(txtPath);
        if (txtFiles.length === 1) {
            const files = txtFiles.filter(file => [".txt", ".csv"].includes(path.extname(file).toLowerCase()));

            if (files.length > 0) {
                writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${files.length} TXT encontrado!`);
                return [true, files];
            } else {
                writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Nenhum arquivo TXT ou CSV encontrado!`);
                console.log("Nenhum arquivo TXT ou CSV encontrado!");
                return [false, []];
            }
        } else if (txtFiles.length > 1) {
            writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Múltiplos arquivos TXT encontrados!`);
            console.log("Múltiplos arquivos TXT encontrados!");
            return [false, []];
        } else {
            writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Nenhum arquivo TXT encontrado!`);
            console.log("Nenhum arquivo TXT encontrado!");
            return [false, []];
        }
    } catch (error) {
        console.log("Não foi possível obter o arquivo TXT!", error);
        writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Erro ao obter o arquivo TXT!`);
        return [false, []];
    }
};

const automacaoViaArquivo = async (filePath, opcao) => {
    let anexo = [1, 5, 3, 6, 7].includes(opcao)
    let countLines = 0
    let time = 0
    return new Promise((resolve, reject) => {
        lineReader.eachLine(filePath, async (linhaLida, last, cb) => {
            const start = performance.now();
            try {
                let executeLine
                let colunas = linhaLida.split(";")
                switch (opcao) {
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                        executeLine = await dp.lancarPagamento(colunas, countLines, page, anexo, holeritesPath)
                        break;
                    case 5:
                    case 6:
                        executeLine = await dp.anexarDoc(colunas, countLines, page, anexo, holeritesPath)
                        break;
                    case 7:
                    case 8:
                        executeLine = await dp.lancarRescisao(colunas, countLines, page, anexo, holeritesPath)
                        break;
                    case 9:
                        executeLine = await audit.lancarPagamento(colunas, countLines, page)
                        break;
                    case 10:
                        executeLine = await audit.rescisao(colunas, countLines, page)
                        break;
                    case 11:
                        executeLine = await rh.cadastrar(colunas, countLines, page)
                        break;
                    case 12:
                        executeLine = await dp.excluirDoc(colunas, countLines, page)
                        break;
                    default:
                        break;
                }
                const end = performance.now();
                const tempoTotal = Math.round((end - start) / 1000)
                if (executeLine) {
                    countLines++
                    console.log(`Chapa ${colunas[12] ? colunas[12] : colunas[1]} executada com sucesso! - Tempo total: ${tempoTotal} seg`)
                    writeFile("log", `${colunas[0].replace("/", "_")}`, "csv", `${linhaLida} `)
                    colunas = []
                    cb()
                } else {
                    countLines++
                    console.log(`Erro na leitura da Chapa ${colunas[12] ? colunas[12] : colunas[1]}`)
                    writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Erro na leitura da linha!`)
                    writeFile("log", "erro", "csv", `${linhaLida} `)
                    colunas = []
                    cb()
                }
                if (last) {
                    console.log("Leitura finalizada!")
                    writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Leitura finalizada!`)
                    await main.closeBrowser()
                    resolve()
                }
            } catch (error) {
                console.log(`Erro na leitura do arquivo TXT!`)
                writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Erro na leitura do arquivo TXT!`)
                await main.closeBrowser()
                reject(error)
            }
        })
    })
}

const startDebug = async () => {
    try {
        const browserOk = await main.startDebug()

        if (browserOk.status) {
            browser = browserOk.browser
            page = browserOk.page
            return true
        } else {
            writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Erro ao efetuar tentativa de login!`)
            console.log("Erro ao efetuar tentativa de login!")
            await main.closeBrowser()
            return false
        }
    } catch (error) {
        console.log(`startDebug: ${error} `)
        return false
    }
}

const separarHolerites = () => {
    try {
        writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Iniciando separação do Holerite por chapas!`)
        console.log(`Iniciando separação do Holerite por chapas!`);
        const pythonScript = "funcs/main.py";
        const processo = spawn("python", [pythonScript]);
        processo.stdout.on("data", (data) => {
            console.log(`stdout: ${data}`);
        });
        processo.stderr.on("data", (data) => {
            console.error(`stderr: ${data}`);
        });
        processo.on("error", (error) => {
            writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Erro ao separar os holerites: ${error}`)
            console.error(`Erro ao separar os holerites: ${error}`);
        });
        processo.on("close", (code) => {
            writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Holerites separados com sucesso!`)
            console.log(`Holerites separados com sucesso!`);
        });
    } catch (error) {
        writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Erro ao separar os holerites: ${error}`)
        console.error(`Erro ao separar os holerites: ${error}`);
    }
}

const iniciarManual = async (opcao) => {
    try {
        const [holeritesExist, totalHolerites] = await verifyHoleritesExist();
        const [txtExist, files] = await verifyTxtExist();
        const opcoesComAnexo = [1, 5, 3, 6].includes(opcao)

        if ((opcoesComAnexo && holeritesExist && txtExist) ||
            (!opcoesComAnexo && txtExist)) {
            const filePath = path.join(txtPath, files[0])
            opcoesComAnexo && totalHolerites == 1 ? await separarHolerites() : false
            if (await startDebug()) {
                if (await main.acessarHome()) {
                    writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Leitura iniciada!`)
                    console.log(`Leitura iniciada na opção: ${opcao}!`)
                    await automacaoViaArquivo(filePath, opcao)
                }
            }
        }
    } catch (error) {
        console.log("Erro ao ler o diretório: ", error)
        await main.closeBrowser()
        return
    }
}

const start = async () => {
    console.log("> 1) DP - Lançar Folha com anexo;")
    console.log("> 2) DP - Lançar Folha sem anexo;")
    console.log("> 3) DP - Lançar Férias com anexo;")
    console.log("> 4) DP - Lançar Férias sem anexo;")
    console.log("> 5) DP - Incluir anexo p/ Folha;")
    console.log("> 6) DP - Incluir anexo p/ Férias;")
    console.log("> 7) DP - Lançar rescisão com anexo;")
    console.log("> 8) DP - Lançar rescisão sem anexo;")
    console.log("> 9) Auditoria - Lançar Folha/Férias;")
    console.log("> 10) Auditoria - Rescisão;")
    console.log("> 11) RH - Lançar contas de pagamento;")
    // console.log("> 11) DP - Excluir doc. de liquidação;")
    console.log("> 0) Cancelar")

    rl.question("Digite a opção p/ iniciar: ", async (op) => {
        let opcao = parseInt(op)
        await iniciarManual(opcao)
        rl.close()
    })
}

start()