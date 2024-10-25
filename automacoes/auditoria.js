const writeFile = require("../funcs/writeFile")
const delay = require("delay");

const lancarPagamento = async (row, firstLine, page, observacaoPagamento) => {
    try {
        if (firstLine) {
            await page.goto(process.env.HOSTAUD1);
            await page.waitForSelector("#consultarNumeroConvenio", { visible: true });
            await page.type("#consultarNumeroConvenio", row[0]);
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
        var opcaoPSelecionar = row[2]
        var selectElement = await page.waitForSelector("#formEditarPagamentoOBTV\\:manterPagamentoOBTVControleNotaFiscalCombo", { visible: true })
        var optionValues
        optionValues = await page.evaluate((selectElement, opcaoPSelecionar) => {
            var select = selectElement;
            var options = select.options;
            var optionValues;
            for (var i = 0; i < options.length; i++) {
                var option = options[i];
                if (option.textContent.includes(opcaoPSelecionar)) {
                    select.value = option.value;
                    optionValues = option.value;
                    break;
                }
            }
            return optionValues;
        }, selectElement, opcaoPSelecionar)
        if (optionValues != undefined) {
            await page.evaluate(() => {
                const event = new Event("change", { bubbles: true });
                document.querySelector("#formEditarPagamentoOBTV\\:manterPagamentoOBTVControleNotaFiscalCombo").dispatchEvent(event)
            })
            await delay(2000)
            await page.waitForSelector("#formEditarPagamentoOBTV\\:DetalhesPagamento_lbl", { visible: true })
            await page.click("#formEditarPagamentoOBTV\\:DetalhesPagamento_lbl")
            await page.waitForSelector("#textoObservacaoPagamento", { visible: true })
            await page.type("#textoObservacaoPagamento", observacaoPagamento)
            await page.waitForSelector("#formEditarPagamentoOBTV\\:DocumentoLiquidacao_lbl", { visible: true })
            await page.click("#formEditarPagamentoOBTV\\:DocumentoLiquidacao_lbl")
            await page.waitForSelector("input[value='Concluir Pagamento']", { visible: true })
            page.on("dialog", async dialog => { await dialog.accept() })
            await page.click("input[value='Concluir Pagamento']")

            writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${row[11]}: pagamento realizado!`)
            console.log(`${new Date().toLocaleString()} - ${row[11]}: pagamento realizado!`)
            return true
        } else {
            writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${row[11]} - ${row[2]}: Item indisponivel p/ seleção!`)
            console.log(`${new Date().toLocaleString()} - ${row[11]} - ${row[2]}: Item indisponivel p/ seleção!`)
            return false
        }
    } catch (error) {
        writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${row[11]} - ${row[2]}: ${error}`);
        console.log(`${row[11]}: ${error}`);
        return false;
    }
}

const rescisao = async (row, firstLine, page) => {
    try {
        if (firstLine) {
            await page.goto(process.env.HOSTAUD1);
            await page.waitForSelector("#consultarNumeroConvenio", { visible: true });
            await page.type("#consultarNumeroConvenio", row[0]);
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
        var opcaoPSelecionar = row[2]
        var selectElement = await page.waitForSelector("#formEditarPagamentoOBTV\\:manterPagamentoOBTVControleNotaFiscalCombo", { visible: true })
        var optionValues
        optionValues = await page.evaluate((selectElement, opcaoPSelecionar) => {
            var select = selectElement;
            var options = select.options;
            var optionValues;
            for (var i = 0; i < options.length; i++) {
                var option = options[i];
                if (option.textContent.includes(opcaoPSelecionar)) {
                    select.value = option.value;
                    optionValues = option.value;
                    break;
                }
            }
            return optionValues;
        }, selectElement, opcaoPSelecionar)
        if (optionValues != undefined) {
            await page.evaluate(() => {
                const event = new Event("change", { bubbles: true });
                document.querySelector("#formEditarPagamentoOBTV\\:manterPagamentoOBTVControleNotaFiscalCombo").dispatchEvent(event)
            })
            await delay(2000)
            await page.waitForSelector("#formEditarPagamentoOBTV\\:DetalhesPagamento_lbl", { visible: true })
            await page.click("#formEditarPagamentoOBTV\\:DetalhesPagamento_lbl")
            await page.waitForSelector("#textoObservacaoPagamento", { visible: true })
            await page.type("#textoObservacaoPagamento", observacaoPagamento)
            await page.waitForSelector("#formEditarPagamentoOBTV\\:DocumentoLiquidacao_lbl", { visible: true })
            await page.click("#formEditarPagamentoOBTV\\:DocumentoLiquidacao_lbl")
            await page.waitForSelector("input[value='Concluir Pagamento']", { visible: true })

            page.on("dialog", async dialog => {
                await delay(3000)
                await dialog.accept()
            })

            await page.click("input[value='Concluir Pagamento']")

            writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${row[11]}: pagamento realizado!`)
            console.log(`${new Date().toLocaleString()} - ${row[11]}: pagamento realizado!`)
            return true
        } else {
            writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${row[11]} - ${row[2]}: Item indisponivel p/ seleção!`)
            console.log(`${new Date().toLocaleString()} - ${row[11]} - ${row[2]}: Item indisponivel p/ seleção!`)
            return false
        }
    } catch (error) {
        writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${row[11]} - ${row[2]}: ${error}`);
        console.log(`${row[11]}: ${error}`);
        return false;
    }
}

module.exports = { lancarPagamento, rescisao }