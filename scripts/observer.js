const puppeteer = require("puppeteer");

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {Function} func 
 * @returns {Promise}
 */
const addObserver = async (page, func) => {

    const functionName = "puppeteerLogMutation" + [...Array(10)].map(i => (~~(Math.random() * 36)).toString(36)).join("");
    
    await page.exposeFunction(functionName, () => {
        func();
    });
    await page.evaluate((functionName) => {
        const target = document.querySelector("body");
        const observer = new MutationObserver( mutations => {
          for (const mutation of mutations) {
            eval(`${functionName}()`);
            if (mutation.type === "childList") {
                // eval(`${functionName}()`);
            }
          }
        });
        observer.observe(target, { attributes: true, childList: true, subtree: true });
    }, functionName);
    await page.evaluateOnNewDocument((functionName) => {
        addEventListener("hashchange", e => eval(`${functionName}()`));
    }, functionName); 

    page.on("framenavigated", (frame) => {
        func();
    });

};

module.exports = {
    addObserver
};