const writeFile = require("../funcs/writeFile")
const delay = require("delay");
const path = require("path");
const fs = require("fs");

const cadastrar = async (row, countLines, page) => {
    try {
        console.log(`Executando (${countLines}) - CPF: ${row[1]}`)
        if (countLines == 0) {
            await Promise.all([
                await page.goto(process.env.HOSTRH1),
                await page.waitForSelector("#consultarNumeroConvenio", { visible: true }),
                await page.type("#consultarNumeroConvenio", row[0]),
                await page.waitForSelector("#form_submit", { visible: true }),
                await page.click("#form_submit")
            ])
            await page.waitForSelector("#tbodyrow > tr > td > div > a", { visible: true });
            await page.click("#tbodyrow > tr > td > div > a");
        } else {
            await Promise.all([
                await page.goto(process.env.HOSTRH1)
            ])
        }
        if (row[1].length == 11) {
            try {
                await page.waitForSelector("[value='Novo Credor / Domícilio Bancário']", { visible: true })
                await page.click("[value='Novo Credor / Domícilio Bancário']")

                if (row[2] == "104" && row[4].startsWith("000") && row[4].length > 9) {
                    var contaTemp = row[4].slice(3)
                    var [conta, digito] = contaTemp.includes("-") ? contaTemp.split("-") : [contaTemp.slice(0, -1), contaTemp[contaTemp.length - 1]]
                } else {
                    var [conta, digito] = row[4].includes("-") ? row[4].split("-") : [row[4].slice(0, -1), row[4][row[4].length - 1]]
                }

                await page.waitForSelector("[name='formConsultaConvenio:_idJsp19']", { visible: true })
                await page.select("[name='formConsultaConvenio:_idJsp19']", "CPF")

                await page.waitForSelector("[name='formConsultaConvenio:_idJsp26']", { visible: true })
                await page.type("[name='formConsultaConvenio:_idJsp26']", row[1])

                await page.waitForSelector("input[value='Pesquisar']", { visible: true })
                await Promise.all([page.click("input[value='Pesquisar']"), page.waitForNavigation({ waitUntil: "networkidle0" })]);
                // Codigo Banco
                await page.waitForSelector("[name='formEditarCredor:_idJsp107']", { visible: true })
                await page.type("[name='formEditarCredor:_idJsp107']", row[2])
                // Agencia
                await page.waitForSelector("[name='formEditarCredor:_idJsp111']", { visible: true })
                await page.type("[name='formEditarCredor:_idJsp111']", row[3])
                // Conta
                await page.waitForSelector("[name='formEditarCredor:_idJsp116']", { visible: true })
                await page.type("[name='formEditarCredor:_idJsp116']", conta)
                // Digito
                await page.waitForSelector("[name='formEditarCredor:_idJsp118']", { visible: true })
                await page.type("[name='formEditarCredor:_idJsp118']", digito)

                // Adiciona a conta
                await page.waitForSelector("input[value='Adicionar']", { visible: true })
                await Promise.all([page.click("input[value='Adicionar']"), page.waitForNavigation({ waitUntil: "networkidle0" })]);

                let isDialogHandled = false;

                await Promise.all([
                    await page.on("dialog", async dialog => {
                        if (!isDialogHandled) {
                            isDialogHandled = true;
                            await dialog.accept();
                        }
                    })
                ])

                // await new Promise(resolve => setTimeout(resolve, 1000000));

                await page.waitForSelector("input[value='Salvar Definitivo']", { visible: true })
                await Promise.all([page.click("input[value='Salvar Definitivo']"), page.waitForNavigation({ waitUntil: "networkidle0" })]);

                const hasError = await page.evaluate(() => {
                    return document.querySelector("#popUpLayer2") !== null;
                });

                if (hasError) {
                    writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${row[1]}: erro no envio do item`);
                    console.log(`${new Date().toLocaleString()} - ${row[1]}: erro no envio do item`);
                    row = []
                    return false;
                } else {
                    writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Dados bancarios adicionados para o CPF: ${row[1]}!`)
                    console.log(`${new Date().toLocaleString()} - Dados bancarios adicionados para o CPF: ${row[1]}!`)
                    row = []
                    return true
                }
            } catch (error) {
                if (error.name === "TimeoutError") {
                    console.log(`Timeout atingido para a linha: ${row[1]}, Err: ${error}`);
                    writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${row[1]}: Timeout na leitura: ${error}`)
                    row = []
                    return false
                } else {
                    writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${row[1]}: Erro na leitura: ${error}`)
                    console.log(`${new Date().toLocaleString()} - ${row[1]}: Erro na leitura: ${error}`)
                    row = []
                    return false
                }
            }
        } else {
            console.log(`Não foi possível adicionar os dados para o CPF ${row[1]}`)
            writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Não foi possível adicionar os dados para o CPF ${row[1]}`)
            row = []
            return false
        }
    } catch (error) {
        writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${row[1]}: ${error}`);
        console.log(`${row[1]}: ${error}`);
        row = []
        return false;
    }
};

module.exports = { cadastrar }