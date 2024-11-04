const writeFile = require("../funcs/writeFile")
const delay = require("delay");

const lancarPagamento = async (row, countLines, page) => {
    try {
        console.log(`Lendo linha ${countLines} - CHAPA: ${row[11]} - ${row[12]}`)
        if (countLines == 0) {
            await page.goto(process.env.HOSTAUD1)
            await Promise.all([
                page.waitForNavigation({ waitUntil: ["load", "networkidle2"] }),
                await page.waitForSelector("#consultarNumeroConvenio", { visible: true }),
                await page.type("#consultarNumeroConvenio", row[0]),
                await page.waitForSelector("#form_submit", { visible: true }),
                await page.click("#form_submit")
            ]);
            await Promise.all([
                page.waitForNavigation({ waitUntil: ["load", "networkidle2"] }),
                await page.waitForSelector("#tbodyrow > tr > td > div > a", { visible: true }),
                await page.click("#tbodyrow > tr > td > div > a"),
            ]);
            await page.waitForSelector("input[value='Novo Pagamento']", { visible: true });
            await page.click("input[value='Novo Pagamento']");
            await delay(500)
        } else {
            await page.goto(process.env.HOSTAUD2)
            await Promise.all([
                page.waitForNavigation({ waitUntil: ["load", "networkidle2"] }),
                await page.waitForSelector("input[value='Novo Pagamento']", { visible: true }),
                await page.click("input[value='Novo Pagamento']")
            ]);
            await delay(500)
        }

        let [opcaoEncontrada] = await page.$x(`//option[contains(., "${row[2]}")]`);
        if (opcaoEncontrada) {
            let optValue = await (await opcaoEncontrada.getProperty("value")).jsonValue();
            await page.select(`#formEditarPagamentoOBTV\\:manterPagamentoOBTVControleNotaFiscalCombo`, optValue)
            await page.waitForFunction(() => {
                const carregando = document.querySelector(".carregando")
                return !carregando || carregando.style.display === "none"
            });
        }
        await delay(500)

        if (opcaoEncontrada != null) {
            await page.waitForSelector("#formEditarPagamentoOBTV\\:DetalhesPagamento_lbl", { visible: true })
            await page.click("#formEditarPagamentoOBTV\\:DetalhesPagamento_lbl")
            await delay(500)
            await page.waitForSelector("#textoObservacaoPagamento", { visible: true })
            await page.type("#textoObservacaoPagamento", `PGTO ${row[12]}`)
            await delay(500)
            await page.waitForSelector("#formEditarPagamentoOBTV\\:DocumentoLiquidacao_lbl", { visible: true })
            await page.click("#formEditarPagamentoOBTV\\:DocumentoLiquidacao_lbl")
            await delay(500)

            let isDialogHandled = false;
            await Promise.all([
                await page.on("dialog", async dialog => {
                    if (!isDialogHandled) {
                        isDialogHandled = true;
                        await delay(500);
                        await dialog.accept();
                    }
                })
            ])

            await page.waitForSelector("input[value='Concluir Pagamento']", { visible: true })
            await Promise.all([page.click("input[value='Concluir Pagamento']"), page.waitForNavigation({ waitUntil: "networkidle0" })]);

            const hasError = await page.evaluate(() => { return document.querySelector("#popUpLayer2") !== null; });
            if (hasError) {
                writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${row[11]}: erro no envio do item`);
                console.log(`${new Date().toLocaleString()} - ${row[11]}: erro no envio do item`);
                return false;
            } else {
                writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${row[11]}: pagamento realizado!`)
                console.log(`${new Date().toLocaleString()} - ${row[11]}: pagamento realizado!`)
                return true
            }
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

const rescisao = async (row, countLines, page) => {
    try {
        if (countLines) {
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