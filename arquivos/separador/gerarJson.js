const fs = require('fs');
const path = require('path');
const PDFParser = require('pdf2json');

// Caminho do arquivo PDF de entrada
const inputPdfPath = path.join(__dirname, "TRCT PORTO VELHO.pdf");

// Caminho do arquivo de saída JSON
const outputJsonPath = path.join(__dirname, 'output.json');

// Função para processar o PDF e salvar em JSON
function convertPdfToJson(inputPdfPath, outputJsonPath) {
    const pdfParser = new PDFParser();

    // Evento de erro
    pdfParser.on('pdfParser_dataError', (errData) => {
        console.error('Erro ao processar o PDF:', errData.parserError);
    });

    // Evento quando os dados do PDF são prontos
    pdfParser.on('pdfParser_dataReady', (pdfData) => {
        // Salvar os dados no formato JSON no arquivo de saída
        fs.writeFileSync(outputJsonPath, JSON.stringify(pdfData, null, 2), 'utf-8');
        console.log('PDF convertido para JSON com sucesso!');
    });

    // Carregar e processar o arquivo PDF
    pdfParser.loadPDF(inputPdfPath);
}

// Chamar a função para converter o PDF
convertPdfToJson(inputPdfPath, outputJsonPath);