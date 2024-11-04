const fs = require("fs");
const path = require("path");

const writeFile = async (pasta, arquivo, formato, texto) => {
    try {
        var filePath = path.join(`./${pasta}`, `${arquivo}.${formato}`)
        var appendOptions = {};
        if (fs.existsSync(filePath)) {
            appendOptions = { flag: "a" };
        }
        fs.mkdir(`./${pasta}`, { recursive: true }, (err) => {
            if (err) {
                console.log("Erro ao criar a pasta:", err)
                return;
            }
            texto += "\r\n";
            fs.writeFile(filePath, texto, appendOptions, (err) => {
                if (err) {
                    console.log("Erro ao escrever no arquivo:", err)
                    return;
                }
            })
        })
    } catch (error) {
        console.log("Erro ao criar pasta ou arquivo:", error)
    }
}

module.exports = writeFile