const puppeteer = require("puppeteer");
const tools = require("./../tools.js");
const { errorMessage } = require("./../message.js");
const { IBError, IBGotoError } = require("./../error.js");
const { SearchResult, User, Post } = require("../types.js");

/**
 * 
 * @param {String | SearchResult | User | Post} identifier can either be a link, username, SearchResult, User or Post
 * @returns {Promise<void>}
 */
const goto = async (page, identifier) => {
    try {

        const link = identifier instanceof SearchResult ? identifier.link :
                     identifier instanceof User ? identifier.link :
                     identifier instanceof Post ? identifier.link :
                    identifier.startsWith("https://www.instagram.com") ? identifier : `https://www.instagram.com/${identifier}/`;

        // check if browser is already on the page
        if(page.url() != link) {

            // check if link is present on page
            const linkPresent = await tools.clickOnElement(page, "a", { href: link });

            if(!linkPresent) {
                if(identifier == link || identifier instanceof SearchResult || identifier instanceof Post) {

                    // if a link or SearchResult was given as an identifier, goto link manually
                    await page.goto(link);

                    // check if link is valid
                    const pageAvailable = await page.evaluate(() => [...document.querySelectorAll("h2")].find((el) => el.innerHTML == "Sorry, this page isn't available.") ? false : true);
                    if(!pageAvailable) throw new IBGotoError(errorMessage.pageNotAvailable.code, errorMessage.pageNotAvailable.message, link);

                } else {

                    // search for username / identifier (most of the time it will be a username)
                    const username = identifier instanceof User ? identifier.username : identifier;
                    if(!page.url().startsWith("https://www.instagram.com")) await page.goto("https://www.instagram.com"); 
                    const searchResults = await search(page, username);
                    const searchResult = searchResults.find(searchResult => searchResult.title == username);
                    if(searchResult) {
                        await goto(page, searchResult);
                    } else {

                        // goto link manually
                        await page.goto(link);

                        // check if link is valid
                        const pageAvailable = await page.evaluate(() => [...document.querySelectorAll("h2")].find((el) => el.innerHTML == "Sorry, this page isn't available.") ? false : true);
                        if(!pageAvailable) throw new IBGotoError(errorMessage.pageNotAvailable.code, errorMessage.pageNotAvailable.message, link);
                    
                    }

                }
            }

        }

    } catch(e) {
        throw new IBGotoError(errorMessage.failedToGotoIdentifier.code, errorMessage.failedToGotoIdentifier.message, identifier, e);
    }
};

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {String} searchTerm 
 * @returns {Promise<SearchResult[]>}
 */
const search = async (page, searchTerm) => {

    // goto instagram-page
    await goto(page, "https://www.instagram.com/");

    // wait for search term field to appear
    try {
        await page.waitForSelector("[placeholder='Search']");
    } catch(e) {
        throw new IBError(errorMessage.searchFieldNotFound.code, errorMessage.searchFieldNotFound.message, e);
    }

    // clear search term field
    await page.evaluate(() => {
        const element = document.querySelector("[placeholder='Search']");
        element.value = "";
    });

    // enter search term
    await page.type("[placeholder='Search']", searchTerm);

    await tools.wait(1000 * 4);

    // load results into array
    const tiles = await page.evaluate(() => {
        const elements = [...document.querySelectorAll(".-qQT3")];

        const tile = elements.map((element) => {
            const link = element.href;
            const title = element.querySelector(".uL8Hv").innerHTML;
            const isHashtag = title.startsWith("#");
            const rawDescription = element.querySelector("._0PwGv") ? element.querySelector("._0PwGv").innerHTML : null;
            const description = isHashtag ? rawDescription.split(">")[2].split("<")[0] : rawDescription;
            return { link, title, description, isHashtag };
        });
        return tile;
    });
    const searchResults = tiles.map(tile => new SearchResult(tile.link, tile.title, tile.description, tile.isHashtag));

    return searchResults;

};

module.exports = {
    goto, 
    search,
};