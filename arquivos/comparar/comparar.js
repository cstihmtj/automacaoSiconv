const fs = require("fs")
const path = require("path")
const chapasOk = []

const verifyFiles = (origin) => {
    const filesInDir = fs.readdirSync(__dirname);
    const requiredFiles = origin ? ["novoTxt.txt"] : ["siconv.csv", "txt.csv"];
    const allFilesExist = requiredFiles.every(file => filesInDir.includes(file));
    return allFilesExist
}

const writeFile = async (texto) => {
    try {
        var filePath = path.join(__dirname, "novoTxt.txt")
        var appendOptions = {};
        if (fs.existsSync(filePath)) {
            appendOptions = { flag: "a" };
        }
        fs.writeFile(filePath, texto, appendOptions, (err) => {
            if (err) {
                console.log("Erro ao escrever no arquivo:", err)
                return;
            }
        })
    } catch (error) {
        console.log("Erro ao criar pasta ou arquivo:", error)
    }
}

const getChapas = () => {
    var data = fs.readFileSync("siconv.csv").toLocaleString();
    var rows = data.split("\n");
    for (const row of rows) {
        if (!row) return
        var columns = row.split(",")
        var chapa = columns[1].replace("...", "").split("-")
        chapa = chapa[2]
        chapasOk.push(chapa)
    }
}

const getOriginalFile = () => {
    var data = fs.readFileSync("txt.csv").toLocaleString();
    var rows = data.split("\n");
    for (const row of rows) {
        if (!row) return
        var columns = row.split(";")
        var chapa = columns[2].split("-")
        chapa = chapa[2]
        if (!chapasOk.find(c => c == chapa)) {
            writeFile(row)
        }
    }
}

const start = () => {
    if (verifyFiles()) {
        getChapas()
        getOriginalFile()
        !verifyFiles(true) ? console.log("Nenhum valor encontrado, ou o total de chapas comparadas são iguais!") : console.log("Arquivo gerado com sucesso!")
    } else {
        console.log("Os arquivos SICONV.CSV E TXT.CSV NÃO FORAM ENCONTRADOS!")
    }
}

start()