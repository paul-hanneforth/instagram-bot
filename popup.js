const puppeteer = require("puppeteer");
const tools = require("./tools.js");

/**
 * 
 * @param {puppeteer.Page} page 
 */
const dismissCookiePopup = async (page) => {

    await tools.clickOnButton(page, "Accept All");

};
const dismissNotificationPopup = async (page) => {

    await tools.clickOnButton(page, "Not Now");

};

module.exports = {
    dismissCookiePopup,
    dismissNotificationPopup,
};