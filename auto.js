const fs = require("fs")
const path = require("path")
const readline = require("readline")
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const writeFile = require("./funcs/writeFile")
require("dotenv/config")
const dp = require("./automacoes/dp")
const audit = require("./automacoes/auditoria")
const main = require("./funcs/main")
const separarPdf = require("./funcs/splitPdf")
const fetch = require("node-fetch");

let browser, page

const holeritesPath = path.join(__dirname, "arquivos", "holerites")
const txtPath = path.join(__dirname, "arquivos", "txt")

const hostApi = "http://192.168.220.143:2222"
// const hostApi = "http://localhost:2222"

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

const iniciarAutomatizado = async (opcaoData, opcao, params) => {
    try {
        if (opcaoData.length === 0) return;
        console.log(`Leitura iniciada!`)
        writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Leitura iniciada!`)
        if (await startDebug()) {
            if (await main.acessarHome()) {
                for (const [i, row] of opcaoData.entries()) {
                    let linhaLida = Object.keys(row).map(function (k) { return row[k] });
                    let anexo = [1, 5, 3, 6].includes(opcao)
                    let executeLine
                    switch (opcao) {
                        case 1:
                        case 2:
                        case 3:
                        case 4:
                            executeLine = await dp.lancarPagamento(linhaLida, i, page, anexo, holeritesPath)
                        case 5:
                        case 6:
                            executeLine = await dp.anexarDoc(linhaLida, i, page, anexo, holeritesPath)
                        case 8:
                        case 9:
                            executeLine = await audit.lancarPagamento(linhaLida, i, page)
                        default:
                            break;
                    }
                    if (executeLine) {
                        firstLine = false
                        console.log("Linha lida com sucesso! executeLine: ", executeLine)
                        writeFile("log", "ok", "csv", `${linhaLida}`)
                    } else {
                        console.log("Erro na leitura da linha! executeLine: ", executeLine)
                        writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Erro na leitura da linha!`)
                        writeFile("log", "erro", "csv", `${linhaLida}`)
                    }
                    // LEITURA DA ULTIMA LINHA
                    if (i === opcaoData.length - 1) {
                        console.log("Leitura finalizada!")
                        writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Leitura finalizada!`)
                        await resetFolder()
                        await main.closeBrowser()
                    }
                }
            }
        }
    } catch (error) {
        console.log(error)
    }
}

const getValuesFromConsole = (question) => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
};

const getCodFilial = (SECAO) => {
    switch (parseInt(SECAO)) {
        case 980:
            return "01.02.002.101"
        case 981:
            return "01.02.002.102"
        case 982:
            return "01.02.002.103"
        case 983:
            return "01.02.002.104"
        default:
            return false
    }
}

const parametrosBusca = async (opcao) => {
    let anexo = [1, 5, 3, 6].includes(opcao)
    let params = []
    switch (opcao) {
        case 1:
        case 2:
        case 5:
            var ANO = await getValuesFromConsole("Digite o ANO DE COMP: ");
            var MES = await getValuesFromConsole("Digite o MES DE COMP: ");
            var NPERIODO = await getValuesFromConsole("Digite o Nº PERIODO: ");
            var SECAO = getCodFilial(await getValuesFromConsole("\n980) Casai Brasilia\n981) Dsei Alto Rio Juruá\n982) Dsei Tapajós\n983) Dsei Porto Velho\nDigite o Nº da Unidade: "));
            var CHAPA = await getValuesFromConsole("Digite a CHAPA (Separadas por virgula): ");

            var URL_DATA = `${hostApi}/siconv/dadosFolha?SECAO=${SECAO}&ANO=${ANO}&MES=${MES}&NROPERIODO=${NPERIODO}${CHAPA ? `&CHAPA=${CHAPA}` : ""}`
            var URL_FILES = anexo ? `${hostApi}/siconv/holerites?SETOR=${SECAO}&ANO=${ANO}&MES=${MES}${CHAPA ? `&CHAPA=${CHAPA}` : ""}` : false
            params.push({ ANO, MES, NPERIODO, SECAO, CHAPA, URL_DATA, URL_FILES })
            rl.close();
            break;
        case 3:
        case 4:
        case 6:
            var DATAINICIO = await getValuesFromConsole("Digite a DATA DE INICIO: ");
            var DATAFIM = await getValuesFromConsole("Digite a DATA DE FIM: ");
            var SECAO = getCodFilial(await getValuesFromConsole("\n980) Casai Brasilia\n981) Dsei Alto Rio Juruá\n982) Dsei Tapajós\n983) Dsei Porto Velho\nDigite o Nº da Unidade: "));
            var CHAPA = await getValuesFromConsole("Digite a CHAPA (Separadas por virgula): ");
            var URL_DATA = `${hostApi}/siconv/dadosFerias?SECAO=${SECAO}&DATAINICIO=${DATAINICIO}&DATAFIM=${DATAFIM}${CHAPA ? `&CHAPA=${CHAPA}` : ""}`
            var URL_FILES = anexo ? true : false //PENDENTE DE TRANSFORMAR O HOLERITE ATUAL DE FERIAS
            params.push({ DATAINICIO, DATAFIM, SECAO, CHAPA, URL_DATA })
            rl.close();
            break;
        case 8:
            var ANO = await getValuesFromConsole("Digite o ANO DE COMP: ");
            var MES = await getValuesFromConsole("Digite o MES DE COMP: ");
            var NPERIODO = await getValuesFromConsole("Digite o Nº PERIODO: ");
            var SECAO = getCodFilial(await getValuesFromConsole("\n980) Casai Brasilia\n981) Dsei Alto Rio Juruá\n982) Dsei Tapajós\n983) Dsei Porto Velho\nDigite o Nº da Unidade: "));
            var CHAPA = await getValuesFromConsole("Digite a CHAPA (Separadas por virgula): ");
            var URL_DATA = `${hostApi}/siconv/dadosFolha?SECAO=${SECAO}&ANO=${ANO}&MES=${MES}&NROPERIODO=${NPERIODO}${CHAPA ? `&CHAPA=${CHAPA}` : ""}`
            params.push({ ANO, MES, NPERIODO, SECAO, CHAPA, URL_DATA })
            rl.close();
            break;
        case 9:
            var DATAINICIO = await getValuesFromConsole("Digite o inicio do periodo: ");
            var DATAFIM = await getValuesFromConsole("Digite o fim do periodo : ");
            var SECAO = getCodFilial(await getValuesFromConsole("\n980) Casai Brasilia\n981) Dsei Alto Rio Juruá\n982) Dsei Tapajós\n983) Dsei Porto Velho\nDigite o Nº da Unidade: "));
            var CHAPA = await getValuesFromConsole("Digite a CHAPA (Separadas por virgula): ");
            var URL_DATA = `${hostApi}/siconv/dadosFerias?SECAO=${SECAO}&DATAINICIO=${DATAINICIO}&DATAFIM=${DATAFIM}${CHAPA ? `&CHAPA=${CHAPA}` : ""}`
            params.push({ ANO, MES, NPERIODO, SECAO, CHAPA, URL_DATA })
            rl.close();
            break;
        default:
            console.log("Opção inválida!");
            await main.closeBrowser()
            rl.close();
            params = null
            break;
    }
    writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Busca por parametros: ${[URL_DATA, URL_FILES]}`)
    return params
}

const getData = async (URL) => {
    try {
        const response = await fetch(`${URL}`, { method: "GET" });
        if (!response.ok) { throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`); }

        const data = await response.json();
        if (data.length > 0) {
            return data;
        } else {
            console.log("Nenhum dado encontrado.");
            writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Nenhum dado encontrado! ${URL}`)
            return null;
        }
    } catch (error) {
        console.log("Erro ao buscar os dados:", error);
        writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Erro ao buscar os dados! ${URL}`)
        return null;
    }
};

const downloadPDF = async (url) => {
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/pdf"
            }
        });
        if (!response.ok) {
            throw new Error(`Erro ao buscar o PDF: ${response.statusText}`);
        }
        const contentDisposition = response.headers.get("Content-Disposition");
        let fileName = "holerites.pdf";
        if (contentDisposition && contentDisposition.includes("filename=")) {
            fileName = contentDisposition
                .split("filename=")[1]
                .split(";")[0]
                .replace(/['"]/g, "");
        }
        const filePath = path.join(holeritesPath, fileName);
        const fileBuffer = await response.buffer();
        await fs.promises.writeFile(filePath, fileBuffer)
        return filePath;
    } catch (error) {
        console.log("Erro ao baixar o PDF:", error.message);
        return false
    }
}

const start = async () => {
    console.log("--- AUTOMAÇÃO  SICONV ---\n")
    console.log("---    CSTI - HMTJ    ---\n")
    console.log("1) DP - Lançar Folha c/ anexo")
    console.log("2) DP - Lançar Folha s/ anexo")
    console.log("3) DP - Lançar Férias c/ anexo")
    console.log("4) DP - Lançar Férias s/ anexo")
    console.log("5) DP - Incluir anexo p/ Folha")
    console.log("6) DP - Incluir anexo p/ Férias")
    console.log("7) DP - Lançar rescisão")
    console.log("8) Auditoria - Lançar Folha")
    console.log("9) Auditoria - Lançar Férias")
    console.log("10) Auditoria - Rescisão")
    console.log("0) Cancelar\n")

    rl.question("Digite a opção p/ iniciar: ", async (op) => {
        let opcao = parseInt(op)
        const params = await parametrosBusca(opcao)
        const opcaoData = params.length == 1 ? await getData(params[0].URL_DATA) : null
        if (opcaoData != null) {
            const holeritesBaixados = params[0].URL_FILES ? await downloadPDF(params[0].URL_FILES) : false
            if (holeritesBaixados) {
                params[0].CHAPA.includes(",") ? await separarPdf(holeritesBaixados, holeritesPath, "Matrícula: ") : false
            }
            await iniciarAutomatizado(opcaoData, opcao, params[0])
        }
        rl.close()
    })
}

start()