const fs = require("fs");
const { PDFDocument } = require("pdf-lib");
const pdfParse = require("pdf-parse");

const separarPdf = async (inputPath, outputDir, textoReferencia) => {
    try {
        const pdfBuffer = fs.readFileSync(inputPath);
        const pdfDoc = await PDFDocument.load(pdfBuffer);

        const { text } = await pdfParse(pdfBuffer);
        const paginasTexto = text.split(/\f/);

        let paginasSeparadas = [];
        let nomesArquivos = [];
        paginasTexto.forEach((paginaTexto, indice) => {
            if (paginaTexto.includes(textoReferencia)) {
                paginasSeparadas.push(indice);
                const nomeArquivo = paginaTexto.match(new RegExp(`${textoReferencia}\\s*(\\d+)`))
                nomesArquivos.push(nomeArquivo ? nomeArquivo[1] : `pagina_${indice + 1}`);
            }
        });

        for (let i = 0; i < paginasSeparadas.length; i++) {
            const novoPdf = await PDFDocument.create();
            const inicio = paginasSeparadas[i];
            const fim = paginasSeparadas[i + 1] || pdfDoc.getPageCount();
            const paginas = await novoPdf.copyPages(pdfDoc, [...Array(fim - inicio).keys()].map(p => p + inicio));

            paginas.forEach(pagina => novoPdf.addPage(pagina));
            const pdfBytes = await novoPdf.save();

            fs.writeFileSync(`${outputDir}/${nomesArquivos[i]}.pdf`, pdfBytes);
        }
        return true
    } catch (error) {
        console.log("separarPdf: ", error)
        return false
    }
}

module.exports = separarPdf