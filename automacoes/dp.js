const writeFile = require("../funcs/writeFile")
const delay = require("delay");
const path = require("path");
const fs = require("fs");
const bancosDigitas = ["260", "748", "280", "077", "290", "323", "335", "336", "348", "380", "536", "623", "756"]

const resetValues = async (fields) => {
    try {
        for (const field of fields) {
            await field.evaluate(el => el.value = "")
        }
    } catch (error) {
        console.log(`Erro ao resetar valor dos campos: ${error}`)
    }
}

const fileExist = async (folderPath, fileName) => {
    const filePath = path.join(folderPath, `${fileName}.pdf`);
    if (fs.existsSync(filePath)) {
        return true
    } else {
        return false
    }
}

const prepararConta = (agencia, banco, conta, digitoC, hasDigit) => {
    var contaTemp = conta.replaceAll(".", "")
    if (agencia == "104" && conta.startsWith("000") && conta.length > 9) {
        contaTemp = contaTemp.slice(3)
        return contaTemp.includes("-") ? contaTemp.split("-") : [contaTemp.slice(0, -1), contaTemp[contaTemp.length - 1]]
    } else if (hasDigit == "NULL") {
        return conta.includes("-") ? conta.split("-") : [conta.slice(0, -1), conta[conta.length - 1]]
    } else if (hasDigit != "NULL") {
        return [conta, digitoC]
    }
}

const dadosDocLiquidacao = async (row, page, origemValor, op) => {
    const salvarNumero = await page.$("#salvarNumero");
    const salvarCpfCredor = await page.$("#salvarCpfCredor");
    const salvarDataDeEmissao = await page.$("#salvarDataDeEmissao");
    const salvarDataDeSaidaEntrada = await page.$("#salvarDataDeSaidaEntrada");
    const salvarValor = await page.$("#salvarValor");
    const salvarTipoPagamantoOBTV = await page.$("#salvarTipoPagamantoOBTV");
    const salvarBanco = await page.$("#salvarBanco");
    const salvarAgencia = await page.$("#salvarAgencia");
    const salvarConta = await page.$("#salvarConta");
    const salvarDigitoConta = await page.$("#salvarDigitoConta");

    await page.waitForSelector("#salvarNumero", { visible: true })
    await page.type("#salvarNumero", row[2])

    await page.waitForSelector("#salvarCpfCredor", { visible: true })
    await page.type("#salvarCpfCredor", row[3])

    await page.waitForSelector("#salvarDataDeEmissao", { visible: true })
    await page.type("#salvarDataDeEmissao", row[4])

    await page.waitForSelector("#salvarDataDeSaidaEntrada", { visible: true })
    await page.type("#salvarDataDeSaidaEntrada", row[5])

    await page.waitForSelector("#salvarValor", { visible: true })
    await page.click("#salvarValor")
    await page.type("#salvarValor", origemValor ? origemValor : row[27])

    await page.waitForSelector("#salvarTipoPagamantoOBTV", { visible: true })
    await page.select("#salvarTipoPagamantoOBTV", "1")

    await page.evaluate(() => { carregaCamposPagamento("1") })

    var hasDigit = op ? row[10] : row[11]

    var [conta, digito] = prepararConta(op ? row[8] : row[9], op ? row[7] : row[8], op ? row[9] : row[10], op ? row[10] : row[11], hasDigit)

    await page.waitForSelector("#salvarInTipoConta", { visible: true })
    await page.select("#salvarInTipoConta", bancosDigitas.includes(op ? row[7] : row[8]) ? "4" : "1")
    console.log(`BANCO CHAPA: ${row[11]}: ` + bancosDigitas.includes(op ? row[7] : row[8]) ? "DIGITAL" : "POUPANCA")

    await page.waitForSelector("#salvarBanco", { visible: true })
    await page.type("#salvarBanco", op ? row[7] : row[8])

    await page.waitForSelector("#salvarAgencia", { visible: true })
    await page.type("#salvarAgencia", op ? row[8] : row[9])

    await page.waitForSelector("#salvarConta", { visible: true })
    // await page.type("#salvarConta", op ? row[9] : row[10])
    await page.type("#salvarConta", conta)

    await page.waitForSelector("#salvarDigitoConta", { visible: true })
    // await page.type("#salvarDigitoConta", op ? row[10] : row[11])
    await page.type("#salvarDigitoConta", digito)
}

const reAnexar = async (row, page, anexoPath, anexo, ref) => {
    //INCLUIR HOLERITE
    if (anexo) {
        await page.waitForSelector("#tr-salvarNaoDigitalizar input[value='0']", { visible: true });
        await page.click("#tr-salvarNaoDigitalizar input[value='0']", { clickCount: 1 })
        await page.waitForSelector("input[type='file']", { visible: true });
        const inputUploadHandle = await page.$("input[type='file']");
        await inputUploadHandle.uploadFile(`${anexoPath}\\${ref}.PDF`)
        await page.waitForSelector(`#form_submit`, { visible: true })
        await page.click("#form_submit");
    } else {
        await page.waitForSelector("#tr-salvarNaoDigitalizar input[value='1']", { visible: true })
        await page.click("#tr-salvarNaoDigitalizar input[value='1']", { clickCount: 1 })
        await page.waitForSelector("#salvarJustificativa", { visible: true })
        const salvarJustificativa = await page.$("#salvarJustificativa");
        await resetValues([salvarJustificativa])
        await page.type("#salvarJustificativa", "Não foi digitalizado o contra-cheque devido à instabilidade e lentidão do portal que não permitiu a inclusão do arquivo. Para que não tenha maior atraso no pagamento os lançamentos serão realizados sem o devido anexo, sendo, posteriormente, anexados.")
    }
}

const resetFieldValue = async (page, field) => {
    console.log(`Resetando ${field}`)
    await page.waitForSelector(`${field}`, { visible: true });
    await page.click(`${field}`);
    await page.evaluate(() => document.querySelector(`${field}`).value = "")
}

const lancarPagamento = async (row, countLines, page, anexo, anexoPath) => {
    try {
        console.log(`Executando (${countLines}) - CHAPA: ${row[11]}`)
        if (countLines == 0) {
            await Promise.all([
                await page.goto(process.env.HOSTDP1),
                await page.waitForSelector("#consultarNumeroConvenio", { visible: true }),
                await page.type("#consultarNumeroConvenio", row[0]),
                await page.waitForSelector("#form_submit", { visible: true }),
                await page.click("#form_submit")
            ])
            await page.waitForSelector("#tbodyrow > tr > td > div > a", { visible: true });
            await page.click("#tbodyrow > tr > td > div > a");
        } else {
            await Promise.all([
                await page.goto(process.env.HOSTDP5),
                await page.waitForSelector("#consultarNumeroConvenio", { visible: true }),
                await page.type("#consultarNumeroConvenio", row[0]),
                await page.waitForSelector("#form_submit", { visible: true }),
                await page.click("#form_submit")
            ])
            await page.waitForSelector("#tbodyrow > tr > td > div > a", { visible: true });
            await page.click("#tbodyrow > tr > td > div > a");
            await Promise.all([
                await page.goto(process.env.HOSTDP3),
                await page.waitForSelector("input[value='Incluir Documento de Liquidação']", { visible: true }),
                await page.click("input[value='Incluir Documento de Liquidação']")
            ])
        }
        if (anexo && await fileExist(anexoPath, row[11]) || !anexo && row[3].length == 11) {
            try {
                await page.waitForSelector("#incluirDadosDocumentoTipoDocumentoContabil", { visible: true })
                await page.select("#incluirDadosDocumentoTipoDocumentoContabil", "22")
                await page.waitForSelector(`[id=incluirDadosDocumentoDespesaAdministrativa][value="${row[1] == 2 ? 1 : 0}"]`, { visible: true })
                await page.click(`[id=incluirDadosDocumentoDespesaAdministrativa][value="${row[1] == 2 ? 1 : 0}"]`)
                await page.waitForSelector("#form_submit", { visible: true })
                await page.click("#form_submit")
                await page.waitForNavigation()

                await dadosDocLiquidacao(row, page, false, true)

                await reAnexar(row, page, anexoPath, anexo, row[11])

                await page.waitForSelector("input[name='manterNotasFiscaisInserirDadosDaNotaFiscalPreencherDadosItensForm']", { visible: true })
                await page.click("input[name='manterNotasFiscaisInserirDadosDaNotaFiscalPreencherDadosItensForm']")

                const [metaServico, metaTributo] = row[15].split("_")
                const ITEMMETA = row[16]
                var valor1 = row[14].replace(",", ".")
                var valor2 = row[31].replace(",", ".")
                var valorItemServico = valor1 > valor2 ? valor1 - valor2 : valor2 - valor1
                valorItemServico = valorItemServico.toFixed(2).toString().replace(".", ",")

                //ITEM SERVIÇO
                if (parseFloat(row[14].replace(",", ".")) > 0) {
                    await page.waitForSelector("#incluirItemNomeItem", { visible: true })
                    await page.type("#incluirItemNomeItem", row[12])
                    await page.waitForSelector("#incluirItemDescricaoItem", { visible: true })
                    await page.type("#incluirItemDescricaoItem", row[13])
                    await page.waitForSelector("#incluirItemCodUnidadeFornecimento", { visible: true })
                    await page.type("#incluirItemCodUnidadeFornecimento", "MÊS")
                    await page.waitForSelector("#incluirItemValorTotalItem", { visible: true })
                    await page.click("#incluirItemValorTotalItem")
                    await page.type("#incluirItemValorTotalItem", valorItemServico)
                    await page.waitForSelector("#incluirItemQuantidadeItem", { visible: true })
                    await page.type("#incluirItemQuantidadeItem", "1,00")
                    await page.waitForSelector(`input[value="${ITEMMETA}"]`, { visible: true })
                    await page.click(`input[value="${ITEMMETA}"]`)
                    await page.waitForSelector(`#incluirItemRecursosRepasse${ITEMMETA}`, { visible: true })
                    await page.type(`#incluirItemRecursosRepasse${ITEMMETA}`, valorItemServico)
                    await page.waitForSelector(`input[value="${metaServico}"]`, { visible: true })
                    await page.click(`input[value="${metaServico}"]`)
                    await page.waitForSelector(`#form_submit`, { visible: true })
                    await page.click("#form_submit");
                }
                //ITEM TRIBUTO
                if (parseFloat(row[31].replace(",", ".")) > 0) {
                    await page.waitForSelector("#incluirItemNomeItem", { visible: true })
                    await page.type("#incluirItemNomeItem", row[12])
                    await page.waitForSelector("#incluirItemDescricaoItem", { visible: true })
                    await page.type("#incluirItemDescricaoItem", row[13])
                    await page.waitForSelector("#incluirItemCodUnidadeFornecimento", { visible: true })
                    await page.type("#incluirItemCodUnidadeFornecimento", "MÊS")
                    await page.waitForSelector("#incluirItemValorTotalItem", { visible: true })
                    await page.click("#incluirItemValorTotalItem")
                    await page.type("#incluirItemValorTotalItem", row[31])
                    await page.waitForSelector("#incluirItemQuantidadeItem", { visible: true })
                    await page.type("#incluirItemQuantidadeItem", "1,00")
                    await page.waitForSelector(`input[value="${ITEMMETA}"]`, { visible: true })
                    await page.click(`input[value="${ITEMMETA}"]`)
                    await page.waitForSelector(`#incluirItemRecursosRepasse${ITEMMETA}`, { visible: true })
                    await page.click(`#incluirItemRecursosRepasse${ITEMMETA}`)
                    await page.type(`#incluirItemRecursosRepasse${ITEMMETA}`, row[31])
                    await page.waitForSelector(`input[value="${metaTributo}"]`, { visible: true })
                    await page.click(`input[value="${metaTributo}"]`)
                    await page.waitForSelector(`#form_submit`, { visible: true })
                    await page.click("#form_submit");
                }

                await page.waitForSelector("input[value='Voltar']", { visible: true })
                await page.click("input[value='Voltar']");

                await page.waitForSelector("input[value='Informar Tributos / Contribuições']", { visible: true })
                await page.click("input[value='Informar Tributos / Contribuições']");

                if (parseFloat(row[19].replace(",", ".")) > 0) {
                    await page.waitForSelector("#incluirTributoEsfera", { visible: true })
                    await page.select("#incluirTributoEsfera", "FEDERAL")
                    await page.waitForSelector("#incluirTributoTipoFederal", { visible: true })
                    await page.select("#incluirTributoTipoFederal", "INSS")
                    await page.waitForSelector("#incluirTributoAliquota", { visible: true })
                    await page.type("#incluirTributoAliquota", row[19])
                    await page.waitForSelector("#incluirTributoValor", { visible: true })
                    await page.type("#incluirTributoValor", row[20])
                    await page.waitForSelector("#incluirTributoData", { visible: true })
                    await page.type("#incluirTributoData", row[21])
                    await page.waitForSelector("#incluirTributoDocumento", { visible: true })
                    await page.type("#incluirTributoDocumento", row[22])
                    await page.waitForSelector("input[value='Incluir Tributo']", { visible: true })
                    await page.click("input[value='Incluir Tributo']");
                }
                if (parseFloat(row[23].replace(",", ".")) > 0) {
                    await page.waitForSelector("#incluirTributoEsfera", { visible: true })
                    await page.select("#incluirTributoEsfera", "FEDERAL")
                    await page.waitForSelector("#incluirTributoTipoFederal", { visible: true })
                    await page.select("#incluirTributoTipoFederal", "IR")
                    await page.waitForSelector("#incluirTributoAliquota", { visible: true })
                    await page.type("#incluirTributoAliquota", row[23])
                    await page.waitForSelector("#incluirTributoValor", { visible: true })
                    await page.type("#incluirTributoValor", row[24])
                    await page.waitForSelector("#incluirTributoData", { visible: true })
                    await page.type("#incluirTributoData", row[21])
                    await page.waitForSelector("#incluirTributoDocumento", { visible: true })
                    await page.type("#incluirTributoDocumento", row[22])
                    await page.waitForSelector("input[value='Incluir Tributo']", { visible: true })
                    await page.click("input[value='Incluir Tributo']")
                }
                if (parseFloat(row[25].replace(",", ".")) > 0) {
                    await page.waitForSelector("input[value='Contribuicao']", { visible: true })
                    await page.click("input[value='Contribuicao']")
                    await page.waitForSelector("#incluirContribuicaoDenominacao", { visible: true })
                    await page.select("#incluirContribuicaoDenominacao", "Outras Contribuições obrigatórias")
                    await page.waitForSelector("#incluirContribuicaoValorCont", { visible: true })
                    await page.type("#incluirContribuicaoValorCont", row[25])
                    await page.waitForSelector("input[value='Incluir Contribuição']", { visible: true })
                    await page.click("input[value='Incluir Contribuição']")
                }
                if (parseFloat(row[26].replace(",", ".")) > 0) {
                    await page.waitForSelector("input[value='Contribuicao']", { visible: true })
                    await page.click("input[value='Contribuicao']")
                    await page.waitForSelector("#incluirContribuicaoDenominacao", { visible: true })
                    await page.select("#incluirContribuicaoDenominacao", "Outras Contribuições obrigatórias")
                    await page.waitForSelector("#incluirContribuicaoValorCont", { visible: true })
                    await page.type("#incluirContribuicaoValorCont", row[26])
                    await page.waitForSelector("input[value='Incluir Contribuição']", { visible: true })
                    await page.click("input[value='Incluir Contribuição']")
                }
                if (parseFloat(row[27].replace(",", ".")) > 0) {
                    await page.waitForSelector("input[value='Contribuicao']", { visible: true })
                    await page.click("input[value='Contribuicao']")
                    await page.waitForSelector("#incluirContribuicaoDenominacao", { visible: true })
                    await page.select("#incluirContribuicaoDenominacao", "Pensão Alimentícia")
                    await page.waitForSelector("#incluirContribuicaoValorCont", { visible: true })
                    await page.type("#incluirContribuicaoValorCont", row[27])
                    await page.waitForSelector("input[value='Incluir Contribuição']", { visible: true })
                    await page.click("input[value='Incluir Contribuição']")
                }
                if (parseFloat(row[28].replace(",", ".")) > 0) {
                    await page.waitForSelector("input[value='Contribuicao']", { visible: true })
                    await page.click("input[value='Contribuicao']")
                    await page.waitForSelector("#incluirContribuicaoDenominacao", { visible: true })
                    await page.select("#incluirContribuicaoDenominacao", "Outras Contribuições obrigatórias")
                    await page.waitForSelector("#incluirContribuicaoValorCont", { visible: true })
                    await page.type("#incluirContribuicaoValorCont", row[28])
                    await page.waitForSelector("input[value='Incluir Contribuição']", { visible: true })
                    await page.click("input[value='Incluir Contribuição']")
                }
                if (parseFloat(row[29].replace(",", ".")) > 0) {
                    await page.waitForSelector("input[value='Contribuicao']", { visible: true })
                    await page.click("input[value='Contribuicao']")
                    await page.waitForSelector("#incluirContribuicaoDenominacao", { visible: true })
                    await page.select("#incluirContribuicaoDenominacao", "Outras Contribuições obrigatórias")
                    await page.waitForSelector("#incluirContribuicaoValorCont", { visible: true })
                    await page.type("#incluirContribuicaoValorCont", row[29])
                    await page.waitForSelector("input[value='Incluir Contribuição']", { visible: true })
                    await page.click("input[value='Incluir Contribuição']")
                }
                if (parseFloat(row[32].replace(",", ".")) > 0) {
                    await page.waitForSelector("input[value='Contribuicao']", { visible: true })
                    await page.click("input[value='Contribuicao']")
                    await page.waitForSelector("#incluirContribuicaoDenominacao", { visible: true })
                    await page.select("#incluirContribuicaoDenominacao", "Contribuição Sindical")
                    await page.waitForSelector('#incluirContribuicaoValorCont')
                    await page.type('#incluirContribuicaoValorCont', row[32])
                    await page.waitForSelector("input[value='Incluir Contribuição']", { visible: true })
                    await page.click("input[value='Incluir Contribuição']")
                }

                await page.waitForSelector("input[value='Voltar']", { visible: true })
                await page.click("input[value='Voltar']")

                await page.waitForSelector("#salvarCpfCredor", { visible: true })
                await page.type("#salvarCpfCredor", row[3])

                await page.waitForSelector("#salvarValor", { visible: true })
                await page.click("#salvarValor")
                await page.type("#salvarValor", row[14])

                await page.waitForSelector("#salvarTipoPagamantoOBTV", { visible: true })
                await page.select("#salvarTipoPagamantoOBTV", "1")

                // await new Promise(resolve => setTimeout(resolve, 10000000));

                let isDialogHandled = false;

                await Promise.all([
                    await page.on("dialog", async dialog => {
                        if (!isDialogHandled) {
                            isDialogHandled = true;
                            await dialog.accept();
                        }
                    })
                ])

                await page.waitForSelector("input[value='Salvar Definitivo']", { visible: true })
                await Promise.all([page.click("input[value='Salvar Definitivo']"), page.waitForNavigation({ waitUntil: "networkidle0" })]);

                const [hasError, errorMsg] = await page.evaluate(() => {
                    var errorDialog = document.querySelector("#popUpLayer2")
                    var errorMsg = errorDialog?.querySelector(".error").innerHTML.replaceAll("&nbsp", " ")
                    return [errorDialog !== null, errorMsg];
                });

                if (hasError) {
                    writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${row[11]}: ${errorMsg}`);
                    console.log(`${new Date().toLocaleString()} - ${row[11]}: ${errorMsg}`);
                    row = []
                    return false;
                } else {
                    writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${row[11]}: item concluido`)
                    console.log(`${new Date().toLocaleString()} - ${row[11]}: item concluido`)
                    row = []
                    return true
                }
            } catch (error) {
                if (error.name === "TimeoutError") {
                    console.log(`Timeout atingido para a linha: ${row[11]}, Err: ${error}`);
                    writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${row[11]}: Timeout na leitura: ${error}`)
                    row = []
                    return false
                } else {
                    writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${row[11]}: Erro na leitura: ${error}`)
                    console.log(`${new Date().toLocaleString()} - ${row[11]}: Erro na leitura: ${error}`)
                    row = []
                    return false
                }
            }
        } else {
            console.log(`Holerite correspondente a CHAPA: ${row[11]} não foi encontrado!`)
            writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Holerite correspondente a CHAPA: ${row[11]} não foi encontrado!`)
            row = []
            return false
        }
    } catch (error) {
        writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${row[11]}: ${error}`);
        console.log(`${row[11]}: ${error}`);
        row = []
        return false;
    }
};

const anexarDoc = async (row, countLines, page, anexo, anexoPath) => {
    try {
        if (countLines == 0) {
            await page.waitForSelector("#menuPrincipal > div.col1 > div:nth-child(4)", { visible: true })
            await page.click("#menuPrincipal > div.col1 > div:nth-child(4)")
            await page.waitForSelector("#contentMenu > div:nth-child(2) > ul > li:nth-child(9) > a", { visible: true })
            await page.click("#contentMenu > div:nth-child(2) > ul > li:nth-child(9) > a")
            await page.waitForSelector("#consultarNumeroConvenio", { visible: true });
            await page.type("#consultarNumeroConvenio", row[0]);
            await page.waitForSelector("#form_submit", { visible: true });
            await page.click("#form_submit");
            await page.waitForSelector("#tbodyrow > tr > td > div > a", { visible: true });
            await page.click("#tbodyrow > tr > td > div > a")
            await page.waitForSelector("#consultarNumero", { visible: true })
            await page.type("#consultarNumero", row[2])
            await page.waitForSelector("#form_submit", { visible: true })
            await page.click("#form_submit")
            await page.waitForSelector("#tbodyrow > tr > td:nth-child(1) > a", { visible: true })
            await page.click("#tbodyrow > tr > td:nth-child(1) > a")
        } else {
            await page.goto(process.env.HOSTDP3);
            await page.waitForSelector("#consultarNumero", { visible: true })
            await page.type("#consultarNumero", row[2])
            await page.waitForSelector("#form_submit", { visible: true })
            await page.click("#form_submit")
            await page.waitForSelector("#tbodyrow > tr > td:nth-child(1) > a", { visible: true })
            await page.click("#tbodyrow > tr > td:nth-child(1) > a")
        }

        if (anexo && await fileExist(anexoPath, row[11])) {
            await page.waitForSelector("input[value='Incluir Arquivos']", { visible: true })
            await page.click("input[value='Incluir Arquivos']")
            await page.waitForSelector("#incluirArquivoArquivo", { visible: true })
            const elementHandle = await page.$("#incluirArquivoArquivo");
            await elementHandle.uploadFile(`${anexoPath}\\${row[11]}.pdf`)
            await page.waitForSelector("input[value='Incluir Arquivo']", { visible: true })
            await page.click("input[value='Incluir Arquivo']")
            await page.waitForSelector("input[value='Salvar']", { visible: true })
            await page.click("input[value='Salvar']")

            writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${row[11]}: item concluido`)
            console.log(`${new Date().toLocaleString()} - ${row[11]}: item concluido`)
            return true
        } else {
            console.log(`Holerite correspondente a CHAPA: ${row[11]} não foi encontrado!`)
            writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Holerite correspondente a CHAPA: ${row[11]} não foi encontrado!`)
            return false
        }
    } catch (error) {
        if (error.name === "TimeoutError") {
            console.log(`Timeout atingido para a linha: ${row[11]}`);
            writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${row[11]}: Timeout na leitura: ${error}`)
        } else {
            writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${row[11]}: ${error}`);
            console.log(`${row[11]}: ${error}`);
            return false;
        }
    }
}

const lancarRescisao = async (row, countLines, page, anexo, anexoPath) => {
    try {
        console.log(`Executando (${countLines}) - CHAPA: ${row[12]}`)
        if (countLines == 0) {
            await Promise.all([
                await page.goto(process.env.HOSTDP1),
                await page.waitForSelector("#consultarNumeroConvenio", { visible: true }),
                await page.type("#consultarNumeroConvenio", row[0]),
                await page.waitForSelector("#form_submit", { visible: true }),
                await page.click("#form_submit")
            ])
            await page.waitForSelector("#tbodyrow > tr > td > div > a", { visible: true });
            await page.click("#tbodyrow > tr > td > div > a");
        } else {
            await Promise.all([
                await page.goto(process.env.HOSTDP5),
                await page.waitForSelector("#consultarNumeroConvenio", { visible: true }),
                await page.type("#consultarNumeroConvenio", row[0]),
                await page.waitForSelector("#form_submit", { visible: true }),
                await page.click("#form_submit")
            ])
            await page.waitForSelector("#tbodyrow > tr > td > div > a", { visible: true });
            await page.click("#tbodyrow > tr > td > div > a");
            await Promise.all([
                await page.goto(process.env.HOSTDP3),
                await page.waitForSelector("input[value='Incluir Documento de Liquidação']", { visible: true }),
                await page.click("input[value='Incluir Documento de Liquidação']")
            ])
        }

        if (anexo && await fileExist(anexoPath, row[3]) || !anexo && row[3].length == 11) {
            try {
                const etapa = row[16]
                const [metaServico, metaTributo] = row[15].split("_")

                await page.waitForSelector("#incluirDadosDocumentoTipoDocumentoContabil", { visible: true })
                await page.select("#incluirDadosDocumentoTipoDocumentoContabil", "22")
                await page.waitForSelector(`[id=incluirDadosDocumentoDespesaAdministrativa][value="${row[1] == 2 ? 1 : 0}"]`, { visible: true })
                await page.click(`[id=incluirDadosDocumentoDespesaAdministrativa][value="${row[1] == 2 ? 1 : 0}"]`)
                await page.waitForSelector("#form_submit", { visible: true })
                await page.click("#form_submit")
                await page.waitForNavigation()

                await reAnexar(row, page, anexoPath, anexo, row[3])

                await page.waitForSelector("input[name='manterNotasFiscaisInserirDadosDaNotaFiscalPreencherDadosItensForm']", { visible: true })
                await page.click("input[name='manterNotasFiscaisInserirDadosDaNotaFiscalPreencherDadosItensForm']")

                // CASO SEJA ASSISTENCIAL
                // if (row[1] == 1) {
                // VALOR TOTAL ITENS - SERVICO
                if (parseFloat(row[6].replace(",", ".")) > 0) {
                    await page.waitForSelector("#incluirItemNomeItem", { visible: true })
                    await page.type("#incluirItemNomeItem", row[12])
                    await page.waitForSelector("#incluirItemDescricaoItem", { visible: true })
                    await page.type("#incluirItemDescricaoItem", row[13])
                    await page.waitForSelector("#incluirItemCodUnidadeFornecimento", { visible: true })
                    await page.type("#incluirItemCodUnidadeFornecimento", "MÊS")
                    await page.waitForSelector("#incluirItemValorTotalItem", { visible: true })
                    await page.click("#incluirItemValorTotalItem")
                    await page.type("#incluirItemValorTotalItem", row[6])
                    await page.waitForSelector("#incluirItemQuantidadeItem", { visible: true })
                    await page.type("#incluirItemQuantidadeItem", "1,00")
                    await page.waitForSelector(`input[value="${etapa}"]`, { visible: true })
                    await page.click(`input[value="${etapa}"]`)
                    await page.waitForSelector(`#incluirItemRecursosRepasse${etapa}`, { visible: true })
                    await page.type(`#incluirItemRecursosRepasse${etapa}`, row[6])

                    await page.waitForSelector(`input[value="${metaServico}"]`, { visible: true })
                    await page.click(`input[value="${metaServico}"]`)

                    await page.waitForSelector(`#form_submit`, { visible: true })
                    await page.click("#form_submit");
                }

                // VALOR TOTAL ITENS - TRIBUTO
                if (parseFloat(row[7].replace(",", "."))) {
                    await page.waitForSelector("#incluirItemNomeItem", { visible: true })
                    await page.type("#incluirItemNomeItem", row[12])
                    await page.waitForSelector("#incluirItemDescricaoItem", { visible: true })
                    await page.type("#incluirItemDescricaoItem", row[13])
                    await page.waitForSelector("#incluirItemCodUnidadeFornecimento", { visible: true })
                    await page.type("#incluirItemCodUnidadeFornecimento", "MÊS")
                    await page.waitForSelector("#incluirItemValorTotalItem", { visible: true })
                    await page.click("#incluirItemValorTotalItem")
                    await page.type("#incluirItemValorTotalItem", row[7])
                    await page.waitForSelector("#incluirItemQuantidadeItem", { visible: true })
                    await page.type("#incluirItemQuantidadeItem", "1,00")
                    await page.waitForSelector(`input[value="${etapa}"]`, { visible: true })
                    await page.click(`input[value="${etapa}"]`)
                    await page.waitForSelector(`#incluirItemRecursosRepasse${etapa}`, { visible: true })
                    await page.type(`#incluirItemRecursosRepasse${etapa}`, row[7])

                    await page.waitForSelector(`input[value="${metaTributo}"]`, { visible: true })
                    await page.click(`input[value="${metaTributo}"]`)

                    await page.waitForSelector(`#form_submit`, { visible: true })
                    await page.click("#form_submit");
                }
                // } else {
                //     // VALOR TOTAL ITENS - SERVICO
                //     await page.waitForSelector("#incluirItemNomeItem", { visible: true })
                //     await page.type("#incluirItemNomeItem", row[12])
                //     await page.waitForSelector("#incluirItemDescricaoItem", { visible: true })
                //     await page.type("#incluirItemDescricaoItem", row[13])
                //     await page.waitForSelector("#incluirItemCodUnidadeFornecimento", { visible: true })
                //     await page.type("#incluirItemCodUnidadeFornecimento", "MÊS")
                //     await page.waitForSelector("#incluirItemValorTotalItem", { visible: true })
                //     await page.click("#incluirItemValorTotalItem")
                //     await page.type("#incluirItemValorTotalItem", row[27])
                //     await page.waitForSelector("#incluirItemQuantidadeItem", { visible: true })
                //     await page.type("#incluirItemQuantidadeItem", "1,00")
                //     await page.waitForSelector(`input[value="${etapa}"]`, { visible: true })
                //     await page.click(`input[value="${etapa}"]`)
                //     await page.waitForSelector(`#incluirItemRecursosRepasse${etapa}`, { visible: true })
                //     await page.type(`#incluirItemRecursosRepasse${etapa}`, row[27])

                //     await page.waitForSelector(`input[value="${metaServico}"]`, { visible: true })
                //     await page.click(`input[value="${metaServico}"]`)

                //     await page.waitForSelector(`#form_submit`, { visible: true })
                //     await page.click("#form_submit");
                // }

                await page.waitForSelector("input[value='Voltar']", { visible: true })
                await page.click("input[value='Voltar']");
                await page.waitForNavigation()

                await page.waitForSelector("input[value='Informar Tributos / Contribuições']", { visible: true })
                await page.click("input[value='Informar Tributos / Contribuições']");

                // INSS
                // console.log(`INSS: Aliquota: ${row[19]} - Valor: ${row[20]}`)
                if (parseFloat(row[20].replace(",", ".")) > 0) {
                    await page.waitForSelector("#incluirTributoEsfera", { visible: true })
                    await page.select("#incluirTributoEsfera", "FEDERAL")
                    await page.waitForSelector("#incluirTributoTipoFederal", { visible: true })
                    await page.select("#incluirTributoTipoFederal", "INSS")

                    await page.waitForSelector("#incluirTributoAliquota", { visible: true })
                    await page.type("#incluirTributoAliquota", row[19])

                    await page.waitForSelector("#incluirTributoValor", { visible: true })
                    await page.type("#incluirTributoValor", row[20])

                    await page.waitForSelector("#incluirTributoData", { visible: true })
                    await page.type("#incluirTributoData", row[5])

                    await page.waitForSelector("#incluirTributoDocumento", { visible: true })
                    await page.type("#incluirTributoDocumento", row[12])

                    await new Promise(resolve => setTimeout(resolve, 1000));
                    await page.waitForSelector("input[value='Incluir Tributo']", { visible: true })
                    await page.click("input[value='Incluir Tributo']");
                    await page.waitForNavigation()
                }

                // INSS 13
                // console.log(`INSS 13: Aliquota: ${row[25]} - Valor: ${row[26]}`)
                if (parseFloat(row[26].replace(",", ".")) > 0) {
                    await page.waitForSelector("#incluirTributoEsfera", { visible: true })
                    await page.select("#incluirTributoEsfera", "FEDERAL")
                    await page.waitForSelector("#incluirTributoTipoFederal", { visible: true })
                    await page.select("#incluirTributoTipoFederal", "INSS")
                    await page.waitForSelector("#incluirTributoAliquota", { visible: true })
                    await page.type("#incluirTributoAliquota", row[25])
                    await page.waitForSelector("#incluirTributoValor", { visible: true })
                    await page.type("#incluirTributoValor", row[26])
                    await page.waitForSelector("#incluirTributoData", { visible: true })
                    await page.type("#incluirTributoData", row[5])
                    await page.waitForSelector("#incluirTributoDocumento", { visible: true })
                    await page.type("#incluirTributoDocumento", row[12])

                    await new Promise(resolve => setTimeout(resolve, 1000));
                    await page.waitForSelector("input[value='Incluir Tributo']", { visible: true })
                    await page.click("input[value='Incluir Tributo']");
                }

                // IRRF
                // console.log(`IR: Aliquota: ${row[21]} - Valor: ${row[22]}`)
                if (parseFloat(row[22].replace(",", ".")) > 0) {
                    await page.waitForSelector("#incluirTributoEsfera", { visible: true })
                    await page.select("#incluirTributoEsfera", "FEDERAL")
                    await page.waitForSelector("#incluirTributoTipoFederal", { visible: true })
                    await page.select("#incluirTributoTipoFederal", "IR")
                    await page.waitForSelector("#incluirTributoAliquota", { visible: true })
                    await page.type("#incluirTributoAliquota", row[21])
                    await page.waitForSelector("#incluirTributoValor", { visible: true })
                    await page.type("#incluirTributoValor", row[22])
                    await page.waitForSelector("#incluirTributoData", { visible: true })
                    await page.type("#incluirTributoData", row[5])
                    await page.waitForSelector("#incluirTributoDocumento", { visible: true })
                    await page.type("#incluirTributoDocumento", row[12])

                    await new Promise(resolve => setTimeout(resolve, 1000));
                    await page.waitForSelector("input[value='Incluir Tributo']", { visible: true })
                    await page.click("input[value='Incluir Tributo']");
                }

                // console.log(`IRRF 13: Aliquota: ${row[23]} - Valor: ${row[24]}`)
                if (parseFloat(row[24].replace(",", ".")) > 0) {
                    await page.waitForSelector("#incluirTributoEsfera", { visible: true })
                    await page.select("#incluirTributoEsfera", "FEDERAL")
                    await page.waitForSelector("#incluirTributoTipoFederal", { visible: true })
                    await page.select("#incluirTributoTipoFederal", "IR")
                    await page.waitForSelector("#incluirTributoAliquota", { visible: true })
                    await page.type("#incluirTributoAliquota", row[23])
                    await page.waitForSelector("#incluirTributoValor", { visible: true })
                    await page.type("#incluirTributoValor", row[24])
                    await page.waitForSelector("#incluirTributoData", { visible: true })
                    await page.type("#incluirTributoData", row[5])
                    await page.waitForSelector("#incluirTributoDocumento", { visible: true })
                    await page.type("#incluirTributoDocumento", row[12])

                    await new Promise(resolve => setTimeout(resolve, 1000));
                    await page.waitForSelector("input[value='Incluir Tributo']", { visible: true })
                    await page.click("input[value='Incluir Tributo']");
                    await page.waitForNavigation()
                }

                //OUTROS DESCONTOS
                // console.log(`OUTROS DESCONTOS: ${row[17]}`)
                if (parseFloat(row[17].replace(",", ".")) > 0) {
                    await page.waitForSelector("input[value='Contribuicao']", { visible: true })
                    await page.click("input[value='Contribuicao']")
                    await page.waitForSelector("#incluirContribuicaoDenominacao", { visible: true })
                    await page.select("#incluirContribuicaoDenominacao", "Outras Contribuições obrigatórias")
                    await page.waitForSelector("#incluirContribuicaoValorCont", { visible: true })
                    await page.type("#incluirContribuicaoValorCont", row[17])

                    await new Promise(resolve => setTimeout(resolve, 1000));
                    await page.waitForSelector("input[value='Incluir Contribuição']", { visible: true })
                    await page.click("input[value='Incluir Contribuição']")
                }

                await page.waitForSelector("input[value='Voltar']", { visible: true })
                await page.click("input[value='Voltar']")
                await page.waitForNavigation()

                await dadosDocLiquidacao(row, page, false, false)

                await new Promise(resolve => setTimeout(resolve, 100000000));
                let isDialogHandled = false;

                await Promise.all([
                    await page.on("dialog", async dialog => {
                        if (!isDialogHandled) {
                            isDialogHandled = true;
                            await dialog.accept();
                        }
                    })
                ])

                await page.waitForSelector("input[value='Salvar Definitivo']", { visible: true })
                await Promise.all([page.click("input[value='Salvar Definitivo']"), page.waitForNavigation({ waitUntil: "networkidle0" })]);

                const hasError = await page.evaluate(() => {
                    return document.querySelector("#popUpLayer2") !== null;
                });

                if (hasError) {
                    writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${row[11]}: erro no envio do item`);
                    console.log(`${new Date().toLocaleString()} - ${row[11]}: erro no envio do item`);
                    row = []
                    return false;
                } else {
                    writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${row[11]}: item concluido`)
                    console.log(`${new Date().toLocaleString()} - ${row[11]}: item concluido`)
                    row = []
                    return true
                }
            } catch (error) {
                writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${row[12]}: Erro na leitura: ${error}`)
                console.log(`${new Date().toLocaleString()} - ${row[12]}: Erro na leitura: ${error}`)
                return false
            }
        } else {
            console.log(`Holerite correspondente a CHAPA: ${row[12]} não foi encontrado!`)
            writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Holerite correspondente a CHAPA: ${row[12]} não foi encontrado!`)
            row = []
            return false
        }
    } catch (error) {
        writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${row[12]}: ${error}`);
        console.log(`${row[12]}: ${error}`);
        return false;
    }
}

const excluirDoc = async (row, countLines, page) => {
    try {
        if (countLines == 0) {
            await page.goto(process.env.HOSTDP4)
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
            await Promise.all([
                page.waitForNavigation({ waitUntil: ["load", "networkidle2"] }),
                await page.waitForSelector("#consultarNumero", { visible: true }),
                await page.type("#consultarNumero", row[2]),
                await page.waitForSelector("#form_submit", { visible: true }),
                await page.click("#form_submit")
            ]);
        } else {
            await page.goto(process.env.HOSTDP3)
            await Promise.all([
                page.waitForNavigation({ waitUntil: ["load", "networkidle2"] }),
                await page.waitForSelector("#consultarNumero", { visible: true }),
                await page.type("#consultarNumero", row[2]),
                await page.waitForSelector("#form_submit", { visible: true }),
                await page.click("#form_submit")
            ]);
        }

        const registrosDuplicados = await page.evaluate(() => { return document.querySelectorAll("#notasFiscais tr").length; });
        if (registrosDuplicados > 1) {
            await page.waitForSelector("#tbodyrow > tr:nth-child(1) > td:nth-child(1) > a", { visible: true })
            await page.click("#tbodyrow > tr:nth-child(1) > td:nth-child(1) > a");

            let isDialogHandled = false;
            await Promise.all([
                await page.on("dialog", async dialog => {
                    if (!isDialogHandled) {
                        isDialogHandled = true;
                        await dialog.accept();
                    }
                })
            ])

            await page.waitForSelector("input[value='Excluir Doc. de Liquidação']", { visible: true })
            await Promise.all([page.click("input[value='Excluir Doc. de Liquidação']"), page.waitForNavigation({ waitUntil: "networkidle0" })]);

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
            writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Nenhum registro duplicado encontrado! REF: ${row[1]}`);
            console.log(`Nenhum registro duplicado encontrado! REF: ${row[1]}`);
            return false;
        }
    } catch (error) {
        writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - ${row[1]}: ${error}`);
        console.log(`${row[1]}: ${error}`);
        return false;
    }
}

module.exports = { lancarPagamento, anexarDoc, lancarRescisao, excluirDoc }