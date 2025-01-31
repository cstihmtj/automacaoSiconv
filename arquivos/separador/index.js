const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

// Caminho do arquivo PDF de entrada
const filePath = path.join(__dirname, "TRCT PORTO VELHO.pdf");
// Caminho do arquivo JSON gerado a partir do PDF
const jsonFilePath = path.join(__dirname, "output.json");
// Diretório de saída para os PDFs divididos
const outputDir = path.join(__dirname, "TRCT PORTO VELHO");

// Função para obter o nome do arquivo a partir da página, agora utilizando o arquivo JSON
async function getFileName(pageIndex) {
    return new Promise((resolve, reject) => {
        // Ler o arquivo JSON
        fs.readFile(jsonFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error("Erro ao ler o arquivo JSON:", err);
                reject(err);
                return;
            }

            try {
                const pdfData = JSON.parse(data); // Parse do arquivo JSON
                const page = pdfData.Pages[pageIndex];
                let fileName = "";

                if (page && page.Texts && page.Texts.length > 31) {
                    const textsArray = page.Texts[31].R; // Acessando a posição 31
                    if (textsArray && textsArray.length > 0) {
                        const texto = decodeURIComponent(textsArray[0].T); // Decodificando
                        if (/^\d{11}$/.test(texto)) { // Verificando se é um CPF (11 dígitos)
                            fileName = texto;
                        }
                    }
                }

                resolve(fileName);
            } catch (err) {
                console.error("Erro ao processar os dados do JSON:", err);
                reject(err);
            }
        });
    });
}

async function dividirPdf(inputPdfPath) {
    const inputPdfBytes = fs.readFileSync(inputPdfPath);

    // Carregar o PDF original
    const inputPdfDoc = await PDFDocument.load(inputPdfBytes);
    const numPages = inputPdfDoc.getPageCount();

    // Dividir o PDF em arquivos de 2 páginas
    let fileIndex = 1;
    for (let i = 0; i < numPages; i += 2) {
        const doc = await PDFDocument.create();
        const fileName = await getFileName(i); // Obtendo o CPF como nome do arquivo

        if (fileName) {
            console.log(`Gerando arquivo para CPF: ${fileName}`);
            const [copiedPage1] = await doc.copyPages(inputPdfDoc, [i]);
            doc.addPage(copiedPage1);
            if (i + 1 < numPages) {
                const [copiedPage2] = await doc.copyPages(inputPdfDoc, [i + 1]);
                doc.addPage(copiedPage2);
            }
            const outputPdfBytes = await doc.save();
            fs.writeFileSync(path.join(outputDir, `${fileName}.pdf`), outputPdfBytes);
            fileIndex++;
        } else {
            console.log(`Nome de arquivo não encontrado para a página ${i}`);
        }
    }

    console.log(`${fileIndex - 1} arquivos PDF foram gerados.`);
}

// Chamar a função para dividir o PDF
dividirPdf(filePath).catch(err => console.error(err));
