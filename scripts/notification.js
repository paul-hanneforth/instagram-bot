const puppeteer = require("puppeteer");
const { IBError, IBPuppeteerError } = require("../error.js");
const { errorMessage } = require("../message.js");
const tools = require("../tools.js");
const { SearchResult } = require("../types.js");
const { goto } = require("./navigation.js");

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {User | SearchResult | String} userIdentifier can either be a username, link, an instance of the User class or a SearchResult which links to a User
 * @param {String} message 
 * @returns {Promise<void>}
 */
const directMessageUser = async (page, userIdentifier, message) => {

    // goto page of user
    await goto(page, userIdentifier);

    await tools.wait(1000 * 3);

    // open message channel
    try {
        const clickedOnElement = await tools.clickOnElements(page, "div", { innerText: "Message" });
        if(!clickedOnElement) throw new IBPuppeteerError(errorMessage.failedToClickOnMessageElement.code, errorMessage.failedToClickOnMessageElement.message);
        await tools.wait(1000 * 5);
    } catch(e) {
        throw new IBError(errorMessage.failedToOpenMessageChannel.code, errorMessage.failedToOpenMessageChannel.message, e);
    }

    // type message
    try {
        await page.type("[placeholder='Message...']", message);
        await tools.wait(1000 * 1);
    } catch(e) {
        throw new IBPuppeteerError(errorMessage.failedToTypeMessage.code, errorMessage.failedToTypeMessage.message, e);
    }

    // send message
    try {
        const sentMessage = await tools.clickOnElement(page, "button", { innerText: "Send" });
        if(!sentMessage) throw new IBPuppeteerError(errorMessage.failedToClickOnSendButton.code, errorMessage.failedToClickOnSendButton.message);
        await tools.wait(1000 * 2);
    } catch(e) {
        throw new IBError(errorMessage.failedToSendMessage.code, errorMessage.failedToSendMessage.message, e);
    }

};

module.exports = {
    directMessageUser
};