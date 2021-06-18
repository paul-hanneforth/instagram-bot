const puppeteer = require("puppeteer");

/**
 * 
 * @param {Object} args 
 * @returns {Promise<puppeteer.Browser>}
 */
const launchBrowser = async (args) => await puppeteer.launch(args);

/**
 * 
 * @param {puppeteer.Browser} browser 
 * @param {String} language 
 * @param {Object} [cookies = []]
 * @returns {Promise<puppeteer.Page>}
 */
const newPage = async (browser, language, cookies = []) => {

    // create page
    const page = await browser.newPage();

    // change language
    await page.setExtraHTTPHeaders({
        "Accept-Language": language ? language : "en"
    });

    // set user agent
    const simulateHeadlessUserAgent = false; // turning this to true, will probably break the software
    const userAgent = simulateHeadlessUserAgent ? "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/91.0.4469.0 Safari/537.36" : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4469.0 Safari/537.36";
    await page.setUserAgent(userAgent);

    // set cookies
    await page.setCookie(...cookies);

    return page;

};

module.exports = {
    launchBrowser,
    newPage,
};