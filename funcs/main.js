const puppeteer = require("puppeteer");
const delay = require("delay");
const writeFile = require("./writeFile")
const { execSync } = require("child_process")
var browser, page

process.on("SIGINT", async () => {
    console.log("\nInterrompido pelo usuário (Ctrl+C).");
    await closeBrowser();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    console.log("\nProcesso terminado.");
    await closeBrowser();
    process.exit(0);
});

const closeBrowser = async () => {
    if (page) await page.close();
    if (browser) await browser.close();
    execSync("npm run stop")
    process.exit(0);
};

const startDebug = async () => {
    var status = false
    try {
        if (!browser) {
            browser = await puppeteer.connect({
                headless: false,
                browserURL: "http://localhost:9202",
                ignoreHTTPSErrors: true,
                args: ["--ignore-certificate-errors", "--use-fake-ui-for-media-stream", "--disable-geolocation"],
                defaultViewport: null
            });
        }
        context = await browser.createIncognitoBrowserContext()
        const pages = await browser.pages()
        page = pages[0]
        await page.setDefaultNavigationTimeout(process.env.TIMEOUT)
        status = true
    } catch (error) {
        writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Não foi possível iniciar o navegador!`);
        console.log("Não foi possível iniciar o navegador: ", error)
        await page.close();
        await browser.close();
        status = false
    }
    return { status, browser, page }
}

const acessarHome = async () => {
    try {
        var status = false
        await page.goto("https://idp.plataformamaisbrasil.gov.br", { waitUntil: "networkidle2", });
        await page.waitForSelector("#form_submit_login", { visible: true })
        await page.click("#form_submit_login")
        await delay(500)
        if (await page.waitForSelector("#login-certificate", { visible: true })) {
            await page.waitForSelector("#login-certificate", { visible: true })
            await page.click("#login-certificate")
            await delay(3000)
            if (await page.waitForSelector("#header #logo", { visible: true })) {
                status = true
            } else {
                status = false
            }
        } else {
            await page.waitForSelector("#accountId", { visible: true })
            await page.type("#accountId", process.env.USER, { delay: 100 })
            await page.keyboard.press("Enter")
            await page.waitForNavigation()
            await page.type("#password", process.env.PASSWORD)
            await page.keyboard.press("Enter")
            await page.waitForNavigation()
            status = false
        }
    } catch (error) {
        writeFile("log", "geral", "txt", `${new Date().toLocaleString()} - Não foi possível efetuar o login!`);
        console.log("Não foi possível efetuar o login: ", error)
        status = false
    }
    return status
}

module.exports = {
    browser,
    page,
    closeBrowser,
    startDebug,
    acessarHome
}