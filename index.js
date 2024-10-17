const puppeteer = require("puppeteer")
const lineReader = require("line-reader")
const fs = require("fs")
const delay = require("delay")
const path = require("path")
const readline = require("readline")
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const writeFile = require("./funcs/writeFile")
require("dotenv/config")
const dp = require("./automacoes/dp")
const audit = require("./automacoes/auditoria")
const main = require("./funcs/main")

var firstLine = true
var opcaoRobo
var browser, page

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

const readLines = async (filePath, opcaoRobo) => {
    return new Promise((resolve, reject) => {
        lineReader.eachLine(filePath, async (line, last, cb) => {
            try {
                var executeLine
                switch (parseInt(opcaoRobo)) {
                    case 1:
                        executeLine = await dp.lancarFolha(line.split(";"), firstLine, page, true)
                        break
                    case 2:
                        executeLine = await dp.lancarFolha(line.split(";"), firstLine, page, false)
                        break
                    case 3:
                        executeLine = await dp.anexarDoc(line.split(";"), firstLine, page, true)
                        break
                    case 4:
                        executeLine = await dp.rescisao(line.split(";"), firstLine, page, true)
                        break
                    case 5:
                        executeLine = await audit.rescisao(line.split(";"), firstLine, page, true)
                        break
                }
                if (executeLine) {
                    firstLine = false
                    console.log("Linha lida com sucesso! executeLine: ", executeLine)
                    writeFile("backup", "ok", "csv", `${line}`)
                    cb()
                } else {
                    console.log("Erro na leitura da linha! executeLine: ", executeLine)
                    writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Erro na leitura da linha!`)
                    writeFile("backup", "erro", "csv", `${line}`)
                    cb()
                }
                if (last) {
                    console.log("Leitura finalizada!")
                    writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Leitura finalizada!`)
                    resolve()
                    await main.closeBrowser()
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

const verifyFolder = async () => {
    const holeritesPath = path.join(__dirname, "holerites")
    if (!fs.existsSync(holeritesPath)) {
        fs.mkdirSync(holeritesPath, { recursive: true })
        return true
    }
}

const existFiles = async () => {
    try {
        await verifyFolder()
        const totalFiles = fs.readdirSync(path.join(__dirname, "holerites"))
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

const startDebug = async () => {
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
}

const iniciar = async (opcaoRobo) => {
    fs.readdir(__dirname, async (err, files) => {
        if (err) {
            console.error("Erro ao ler o diretório: ", err)
            await main.closeBrowser()
            return
        }
        const file = files.filter(file => path.extname(file).toLowerCase() === ".txt" || path.extname(file).toLowerCase() === ".csv")
        if ([1, 3, 4, 5].includes(opcaoRobo)) {
            if (file.length >= 1 && await existFiles()) {
                const firstLine = path.join(__dirname, file[0])
                if (await startDebug()) {
                    await main.acessarHome() ? await readLines(firstLine, opcaoRobo) : false
                }
                writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Leitura iniciada!`)
                console.log(`Leitura iniciada!`)
            } else {
                writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Nenhum arquivo encontrado no diretório!`)
                console.log("Nenhum arquivo encontrado no diretório!")
                await main.closeBrowser()
            }
        } else {
            if (await startDebug()) {
                await main.acessarHome() ? await readLines(firstLine, opcaoRobo) : false
            }
        }
        // const file = files.filter(file => path.extname(file).toLowerCase() === ".txt" || path.extname(file).toLowerCase() === ".csv")
        // if (file.length >= 1 && await existFiles()) {
        //     const firstLine = path.join(__dirname, file[0])
        //     writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Leitura iniciada!`)
        //     console.log(`Leitura iniciada!`)
        //     const loginData = await main.login()
        //     if (loginData.status) {
        //         const browser = loginData.browser
        //         const page = loginData.page
        //         await readLines(firstLine, opcaoRobo, browser, page)
        //     } else {
        //         writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Nenhum arquivo encontrado no diretório!`)
        //         console.log("Erro no login!")
        //         await main.closeBrowser()
        //     }
        // } else {
        //     writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Nenhum arquivo encontrado no diretório!`)
        //     console.log("Nenhum arquivo encontrado no diretório!")
        //     await main.closeBrowser()
        // }
    })
}

const start = async () => {
    console.log("1) Lançar c/ anexo")
    console.log("2) Lançar s/ anexo")
    console.log("3) Incluir anexo")
    console.log("4) Rescisão DP")
    console.log("5) Rescisão Auditoria")

    rl.question("Digite a opção p/ iniciar: ", async (opcaoRobo) => {
        opcaoRobo = opcaoRobo
        switch (parseInt(opcaoRobo)) {
            case 0:
                console.log("Processo cancelado!")
                await main.closeBrowser()
                process.exit(0)
            default:
                await iniciar(parseInt(opcaoRobo))
                break
        }
        rl.close()
    })
}

start()