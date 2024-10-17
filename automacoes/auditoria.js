const lancarFolha = async (linhaLida) => {
    try {
        if (firstLine) {
            await page.goto(process.env.HOSTAUD1);
            await page.waitForSelector("#consultarNumeroConvenio", { visible: true });
            await page.type("#consultarNumeroConvenio", linhaLida[0]);
            await page.waitForSelector("#form_submit", { visible: true });
            await page.click("#form_submit");
            await page.waitForSelector("#tbodyrow > tr > td > div > a", { visible: true });
            await page.click("#tbodyrow > tr > td > div > a");
            await page.waitForSelector("input[value='Novo Pagamento']", { visible: true });
            await page.click("input[value='Novo Pagamento']");
            await page.waitForNavigation();
        } else {
            await page.goto(process.env.HOSTAUD1);
            await page.waitForSelector("input[value='Novo Pagamento']", { visible: true });
            await page.click("input[value='Novo Pagamento']");
            await page.waitForNavigation();
        }
        const selectElement = await page.waitForSelector("#formEditarPagamentoOBTV\\:manterPagamentoOBTVControleNotaFiscalCombo", { visible: true })
        var optionValues, optionText;
        [optionValues, optionText] = await page.evaluate((selectElement, opcaoPSelecionar) => {
            const select = selectElement;
            const options = select.options;
            var optionValues;
            for (const i = 0; i < options.length; i++) {
                var option = options[i];
                if (option.textContent.includes(opcaoPSelecionar)) {
                    select.value = option.value;
                    optionValues = option.value;
                    optionText = option.textContent
                    break;
                }
            }
            return [optionValues, optionText];
        }, selectElement, opcaoPSelecionar)
        if (optionValues != undefined) {
            await page.evaluate(() => {
                carregando()
                A4J.AJAX.Submit("_viewRoot", "formEditarPagamentoOBTV", event, {
                    "oncomplete": function (request, event, data) {
                        completo()
                    }, "parameters": {
                        "formEditarPagamentoOBTV:_idJsp91": "formEditarPagamentoOBTV:_idJsp91"
                    }, "actionUrl": "/voluntarias/obtv/ManterPagamentoConvenioOBTV/detalharPagamentoConvenioOBTV.jsf?javax.portlet.faces.DirectLink=true"
                })
            })
            await delay(5000)
            await page.waitForSelector("#formEditarPagamentoOBTV\\:DetalhesPagamento_lbl", { visible: true })
            await page.click("#formEditarPagamentoOBTV\\:DetalhesPagamento_lbl")
            await page.waitForSelector("#textoObservacaoPagamento", { visible: true })
            await page.type("#textoObservacaoPagamento", observacaoPagamento.toUpperCase())
            await page.waitForSelector("#formEditarPagamentoOBTV\\:DocumentoLiquidacao_lbl", { visible: true })
            await page.click("#formEditarPagamentoOBTV\\:DocumentoLiquidacao_lbl")
            await page.waitForSelector("input[value='Concluir Pagamento']", { visible: true })
            page.on("dialog", async dialog => { await dialog.accept() })
            await page.click("input[value='Concluir Pagamento']")

            writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${linhaLida[11]}: pagamento realizado!`)
            console.log(`${new Date().toLocaleString()} - ${linhaLida[11]}: pagamento realizado!`)
            return true
        } else {
            writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${linhaLida[11]}: Chapa não encontrada p/ seleção!`)
            console.log(`${new Date().toLocaleString()} - ${linhaLida[11]}: Chapa não encontrada p/ seleção!`)
            return false
        }
    } catch (error) {
        writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${linhaLida[11]}: ${error}`);
        console.log(`${linhaLida[11]}: ${error}`);
        return false;
    }
}

const rescisao = async () => {
    console.log("Opção ainda não disponivel!")
    process.exit(0)
}

module.exports = { lancarFolha, rescisao }