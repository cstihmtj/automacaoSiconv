const lineReader = require("line-reader")
const fs = require("fs")
const path = require("path")
const readline = require("readline")
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const writeFile = require("./funcs/writeFile")
require("dotenv/config")
const dp = require("./automacoes/dp")
const audit = require("./automacoes/auditoria")
const main = require("./funcs/main")
const fetch = require("node-fetch");

let firstLine = true
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

const existFiles = async () => {
    try {
        const totalFiles = fs.readdirSync(holeritesPath)
        if (totalFiles.length >= 1) {
            writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${totalFiles.length} Holerites encontrados`)
            return true
        } else {
            writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Nenhum holerite encontrado - Total: ${totalFiles.length}!`)
            console.log(`Nenhum holerite encontrado - Total: ${totalFiles.length}!`)
            return false
        }
    } catch (error) {
        console.log("Não foi possivel obter os arquivos holerites!")
        return false
    }
}

const automacaoViaArquivo = async (filePath, opcao) => {
    return new Promise((resolve, reject) => {
        lineReader.eachLine(filePath, async (linhaLida, last, cb) => {
            try {
                let executeLine
                let anexo = [1, 5, 3, 6].includes(opcao)
                linhaLida = linhaLida.split(";")
                switch (opcao) {
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                        executeLine = await dp.lancarPagamento(linhaLida, firstLine, page, anexo, holeritesPath)
                        break;
                    case 5:
                    case 6:
                        executeLine = await dp.anexarDoc(linhaLida, firstLine, page, anexo, holeritesPath)
                        break;
                    // case 8:
                    //     executeLine = await audit.lancarPagamento(linhaLida, firstLine, page, anexo, holeritesPath)
                    //     break;
                    default:
                        break;
                }
                if (executeLine) {
                    firstLine = false
                    console.log("Linha lida com sucesso! executeLine: ", executeLine)
                    writeFile("log", "ok", "csv", `${executeLine}`)
                    cb()
                } else {
                    console.log("Erro na leitura da linha! executeLine: ", executeLine)
                    writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Erro na leitura da linha!`)
                    writeFile("log", "erro", "csv", `${executeLine}`)
                    cb()
                }
                if (last) {
                    console.log("Leitura finalizada!")
                    writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Leitura finalizada!`)
                    // await resetFolder()
                    await main.closeBrowser()
                    resolve()
                }
            } catch (error) {
                console.log(`Erro na leitura do arquivo siconv.csv!`)
                writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Erro na leitura do arquivo siconv.csv!`)
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
        console.log(`startDebug: ${error}`)
        return false
    }
}

const iniciarManual = async (opcao) => {
    try {
        fs.readdir(txtPath, async (err, files) => {
            if (err) {
                console.log("Erro ao ler o diretório: ", err)
                await main.closeBrowser()
                return
            }
            const file = files.filter(file => path.extname(file).toLowerCase() === ".txt" || path.extname(file).toLowerCase() === ".csv")
            if (file.length >= 1 && await existFiles()) {
                const firstLine = path.join(txtPath, file[0])
                if (await startDebug()) {
                    if (await main.acessarHome()) {
                        writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Leitura iniciada!`)
                        console.log(`Leitura iniciada!`)
                        await automacaoViaArquivo(firstLine, opcao)
                    }
                }
            } else {
                writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Nenhum arquivo encontrado no diretório!`)
                console.log("Nenhum arquivo encontrado no diretório!")
                await main.closeBrowser()
            }
        })
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
    console.log("> 7) DP - Lançar rescisão;")
    console.log("> 8) Auditoria - Lançar Folha/Férias;")
    console.log("> 9) Auditoria - Rescisão;")
    console.log("> 0) Cancelar")

    rl.question("Digite a opção p/ iniciar: ", async (op) => {
        let opcao = parseInt(op)
        await iniciarManual(opcao)
        rl.close()
    })
}

start()