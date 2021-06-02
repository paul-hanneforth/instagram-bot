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

    // set cookies
    await page.setCookie(...cookies);

    return page;

};

module.exports = {
    launchBrowser,
    newPage,
};