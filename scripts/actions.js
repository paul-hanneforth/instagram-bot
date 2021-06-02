const puppeteer = require("puppeteer");
const tools = require("./../tools.js");
const popup = require("./../popup.js");
const { errorMessage } = require("./../message.js");
const { IBError, IBLoginError } = require("./../error.js");
const { SearchResult, User, Post } = require("./../class.js");
const { goto } = require("./navigation.js");

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {String} username 
 * @param {String} password 
 */
const login = async (page, username, password) => {

    // goto login page
    await goto(page, "https://www.instagram.com/");
    await tools.wait(5 * 1000);

    // dismiss popups
    await popup.dismissCookiePopup(page);

    // enter username
    try {
        await page.waitForSelector("[name='username']");
    } catch(e) {
        throw new IBError(errorMessage.inputFieldNotFound.code, errorMessage.inputFieldNotFound.message, e);
    }
    await page.type("[name='username']", username);

    // enter password
    await page.waitForSelector("[name='password']");
    await page.type("[name='password']", password);

    // click login button
    await tools.clickOnButton(page, "Log In");
    await tools.wait(1000 * 5);

    // check if error happened
    const wrongPassword = await page.evaluate(() => [...document.querySelectorAll("p")].reduce((prev, element) => {
        if (element.innerHTML == "Sorry, your password was incorrect. Please double-check your password.") return true;
        return prev;
    }, false));
    const waitUntilLoggingIn = await page.evaluate(() => [...document.querySelectorAll("p")].reduce((prev, element) => {
        if (element.innerHTML == "Please wait a few minutes before you try again.") return true;
        return prev;
    }, false));
    const accountDoesntExist = await page.evaluate(() => [...document.querySelectorAll("p")].find(p => p.innerHTML == "The username you entered doesn't belong to an account. Please check your username and try again.") ? true : false);

    if(wrongPassword) throw new IBLoginError(errorMessage.incorrectPassword.code, errorMessage.incorrectPassword.message, username);
    if(waitUntilLoggingIn) throw new IBLoginError(errorMessage.waitBeforeLogin.code, errorMessage.waitBeforeLogin.message, username);
    if(accountDoesntExist ? true : false) throw new IBLoginError(errorMessage.accountNotFound.code, errorMessage.accountNotFound.message, username);

};

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {String} username
 */
const logout = async (page, username) => {

    // goto instagram page
    await goto(page, "https://www.instagram.com/");
    await tools.wait(1000 * 5);

    // find profile image and click it
    await tools.clickOnElement(page, "[alt]", { alt: username + "'s profile picture" });

    // click on 'Log Out' Button
    await tools.clickOnDiv(page, "Log Out");

};

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {String | User | SearchResult} identifier can either be a username, link, an instance of the User class or a SearchResult which links to a User
 * @returns {Promise<any>}
 */
const follow = async (page, identifier) => {

    // goto page of the user
    await goto(page, identifier);

    // wait
    await tools.wait(1000 * 2);

    // click on 'Follow' button
    await tools.clickOnButton(page, "Follow");

    // click on 'Follow Back' button
    await tools.clickOnButton(page, "Follow Back");

    // wait
    await tools.wait(1000 * 2);

};

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {String | User | SearchResult} identifier can either be a username, link, an instance of the User class or a SearchResult which links to a User
 * @returns {Promise<any>}
 */
const unfollow = async (page, identifier) => {

    // goto page of the user
    await goto(page, identifier);

    // wait
    await tools.wait(1000 * 2);

    // click on 'Requested' button if the person hasn't accepted yet
    await tools.clickOnButton(page, "Requested");

    // click on 'Unfollow' button
    await tools.clickOnElement(page, "[aria-label='Following']");
    await tools.wait(1000 * 2);

    // click on 'Unfollow' when Popup appears
    await tools.clickOnButton(page, "Unfollow");

    // wait
    await tools.wait(1000 * 2);

};

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {String | Post} postIdentifier this can either be the link of a post or an instance of the Post Class
 * @param {String} comment the text you want to comment on the post
 * @returns {Promise<any>}
 */
const commentPost = async (page, postIdentifier, comment) => {

    // goto post
    await goto(page, postIdentifier);

    // wait
    await tools.wait(1000 * 2);

    // check if comment text area exists
    try {
        await page.waitForSelector("[aria-label='Add a comment…']");
    } catch(e) {
        throw new IBError(errorMessage.cantCommentPost.code, errorMessage.cantCommentPost.message, e);
    }

    // enter comment into the text area
    await page.type("[aria-label='Add a comment…']", comment);

    // click on Post button
    await tools.clickOnElement(page, "button", { innerHTML: "Post" });

    // wait
    await tools.wait(1000 * 1);

};

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {String | Post} identifier can either be a link or a Post
 * @returns {Promise<any>}
 */
const likePost = async (page, identifier) => {

    // goto post
    await goto(page, identifier);

    // wait
    await tools.wait(1000 * 2);

    // click on like symbol
    await page.evaluate(() => {
        const elements = document.querySelectorAll("[aria-label='Like']");
        elements.forEach((el) => el.parentElement.click());
    });

};

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {String | Post} identifier can either be the link to a post or an instance of the Post class
 * @returns {Promise<any>}
 */
const unlikePost = async (page, identifier) => {

    // goto post
    await goto(page, identifier);

    // wait
    await tools.wait(1000 * 2);

    // click on unlike symbol
    await page.evaluate(() => [...document.querySelectorAll("[aria-label='Unlike']")].forEach((el) => el.parentElement.click()));

};

module.exports = {
    login,
    logout,
    follow,
    unfollow,
    commentPost,
    likePost,
    unlikePost,

};