const puppeteer = require("puppeteer");
const { IBError, IBPuppeteerError } = require("../error.js");
const { errorMessage } = require("../message.js");
const tools = require("../tools.js");
const { SearchResult, DirectMessage } = require("../types.js");
const { goto } = require("./navigation.js");

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {User | SearchResult | String} userIdentifier can either be a username, link, an instance of the User class or a SearchResult which links to a User
 * @returns {Promise<void>}
 */
const gotoMessageChannel = async (page, userIdentifier) => {

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

    await tools.wait(1000 * 3);

};

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {User | SearchResult | String} userIdentifier can either be a username, link, an instance of the User class or a SearchResult which links to a User
 * @param {String} message 
 * @returns {Promise<void>}
 */
const directMessageUser = async (page, userIdentifier, message) => {

    // goto message channel
    await gotoMessageChannel(page, userIdentifier);

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

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {User | SearchResult | String} userIdentifier can either be a username, link, an instance of the User class or a SearchResult which links to a User
 * @param {String} message 
 * @returns {Promise<DirectMessage[]>}
 */
const getChannelMessages = async (page, userIdentifier) => {

    // goto message channel
    await gotoMessageChannel(page, userIdentifier);

    // get messages
    const getLoadedMessages = async () => {
        const rawMessages = await page.evaluate(() => {
            const box = document.querySelector(".Igw0E.IwRSH.hLiUi.vwCYk");
            const messageElements = [...box.querySelectorAll("span")];
            const rawMessages = messageElements.map(messageElement => {
                const parentElement = messageElement.parentElement.parentElement.parentElement.parentElement;
                const color = window.getComputedStyle(parentElement, null).getPropertyValue("background-color");
                if(color == "rgba(0, 0, 0, 0)") {
                    return { received: true, text: messageElement.innerText };
                } else {
                    return { received: false, text: messageElement.innerText };
                }
            });
            return rawMessages;
        });
        const messages = rawMessages.map(rawMessage => new DirectMessage(rawMessage.text, !rawMessage.received));
        return messages;
    };
    
    const loadedMessages = await getLoadedMessages();

    return loadedMessages;

};

module.exports = {
    directMessageUser,
    getChannelMessages
};