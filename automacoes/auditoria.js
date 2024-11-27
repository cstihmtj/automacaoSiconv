const writeFile = require("../funcs/writeFile")

const lancarPagamento = async (row, countLines, page) => {
    try {
        console.log(`Lendo linha ${countLines} - CHAPA: ${row[11]} - ${row[12]}`)
        if (countLines === 0) {
            await page.goto(process.env.HOSTAUD1, { waitUntil: "networkidle2" });
            await page.waitForSelector("#consultarNumeroConvenio", { visible: true });
            await page.type("#consultarNumeroConvenio", row[0]);
            await page.waitForSelector("#form_submit", { visible: true });
            await Promise.all([
                page.click("#form_submit"),
                page.waitForNavigation({ waitUntil: "networkidle2" })
            ]);
            await page.waitForSelector("#tbodyrow > tr > td > div > a", { visible: true });
            await Promise.all([
                page.click("#tbodyrow > tr > td > div > a"),
                page.waitForNavigation({ waitUntil: "networkidle2" })
            ]);
            await page.waitForSelector("input[value='Novo Pagamento']", { visible: true });
            await Promise.all([
                await page.click("input[value='Novo Pagamento']"),
                page.waitForNavigation({ waitUntil: "networkidle2" })
            ]);
        } else {
            await page.goto(process.env.HOSTAUD2, { waitUntil: "networkidle2" });
            await page.waitForSelector("input[value='Novo Pagamento']", { visible: true });
            await Promise.all([
                await page.click("input[value='Novo Pagamento']"),
                page.waitForNavigation({ waitUntil: "networkidle2" })
            ]);
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

        if (opcaoEncontrada != null) {
            await page.waitForSelector("#formEditarPagamentoOBTV\\:DetalhesPagamento_lbl", { visible: true })
            await page.click("#formEditarPagamentoOBTV\\:DetalhesPagamento_lbl")
            await page.waitForSelector("#textoObservacaoPagamento", { visible: true })
            await page.type("#textoObservacaoPagamento", `PGTO ${row[12]}`)

            let isDialogHandled = false;
            await Promise.all([
                await page.on("dialog", async dialog => {
                    if (!isDialogHandled) {
                        isDialogHandled = true;;
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
        if (countLines === 0) {
            await page.goto(process.env.HOSTAUD1, { waitUntil: "networkidle2" });
            await page.waitForSelector("#consultarNumeroConvenio", { visible: true });
            await page.type("#consultarNumeroConvenio", row[0]);
            await page.waitForSelector("#form_submit", { visible: true });
            await Promise.all([
                page.click("#form_submit"),
                page.waitForNavigation({ waitUntil: "networkidle2" })
            ]);
            await page.waitForSelector("#tbodyrow > tr > td > div > a", { visible: true });
            await Promise.all([
                page.click("#tbodyrow > tr > td > div > a"),
                page.waitForNavigation({ waitUntil: "networkidle2" })
            ]);
            await page.waitForSelector("input[value='Novo Pagamento']", { visible: true });
            await Promise.all([
                await page.click("input[value='Novo Pagamento']"),
                page.waitForNavigation({ waitUntil: "networkidle2" })
            ]);
        } else {
            await page.goto(process.env.HOSTAUD2, { waitUntil: "networkidle2" });
            await page.waitForSelector("input[value='Novo Pagamento']", { visible: true });
            await Promise.all([
                await page.click("input[value='Novo Pagamento']"),
                page.waitForNavigation({ waitUntil: "networkidle2" })
            ]);
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

        if (opcaoEncontrada != null) {
            await page.waitForSelector("#formEditarPagamentoOBTV\\:DetalhesPagamento_lbl", { visible: true })
            await page.click("#formEditarPagamentoOBTV\\:DetalhesPagamento_lbl")
            await page.waitForSelector("#textoObservacaoPagamento", { visible: true })
            await page.type("#textoObservacaoPagamento", `PGTO ${row[12]}`)

            let isDialogHandled = false;
            await Promise.all([
                await page.on("dialog", async dialog => {
                    if (!isDialogHandled) {
                        isDialogHandled = true;;
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

module.exports = { lancarPagamento, rescisao }