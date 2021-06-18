const puppeteer = require("puppeteer");

/**
 * 
 * @param {Number} time 
 * @returns {Promise<any>}
 */
const wait = (time) => new Promise((resolve) => setTimeout(resolve, time));

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {Function} js 
 * @param {*} args 
 * @returns {Promise<any>}
 */
const evaluate = async (page, js, args) => {
    const result = await page.evaluate(js, args);
    return result;
};

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {String} querySelector 
 * @param {Object} properties 
 * @returns {Promise<Boolean>} whether an element has been clicked or not
 */
const clickOnElements = async (page, querySelector, properties) => {
    const clickedOnElement = await page.evaluate(({ querySelector, properties }) => {
        const elements = [...document.querySelectorAll(querySelector)];
        const keys = Object.keys(properties ? properties : {});
        const matchedElements = elements.filter(element => {
            const matchesAllProperties = keys.reduce((acc, cur) => {
                if(!acc) return false;
                if(properties[cur] == element[cur]) return true;
                return false;
            }, true);
            return matchesAllProperties;
        });
        matchedElements.forEach(element => element.click());
        if(matchedElements.length > 0) return true;
        return false;
    }, { querySelector, properties });
    return clickedOnElement;
};

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {String} querySelector 
 * @param {Object} property 
 * @returns {Promise<Boolean>} whether an element has been clicked or not
 */
const clickOnElement = async (page, querySelector, property) => {
    const clickedElement = await evaluate(page, (args) => {
        const elements = [...document.querySelectorAll(args.querySelector)];
        const keysProp = Object.keys((args.property ? args.property : {}));
        const clickedElement = elements.reduce((alreadyClicked, element) => {
            if(alreadyClicked) return true;
            const matchesProperties = keysProp.reduce((acc, cur) => {
                if (args.property[cur] == element[cur]) return true;
                return false;
            }, true);
            if (matchesProperties) {
                element.click();
                return true;
            }
            return alreadyClicked;
        }, false);
        return clickedElement;
    }, { querySelector, property });
    return clickedElement;
};

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {String} querySelector 
 * @param {Object} property 
 * @returns {Promise<Boolean>} whether the element exists or not
 */
const elementExists = async (page, querySelector, property) => {
    const elementExists = await evaluate(page, (args) => {
        const elements = [...document.querySelectorAll(args.querySelector)];
        const keysProp = Object.keys((args.property ? args.property : {}));
        const elementExists = elements.find(element => (keysProp.find(prop => args.property[prop] != element[prop]) ? false : true)) ? true : false;
        return elementExists;
    }, { querySelector, property });
    return elementExists;
};

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {String} buttonText
 */
const clickOnButton = async (page, buttonText) => {
    await clickOnElement(page, "button", { innerText: buttonText });
};

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {String} text 
 */
const clickOnDiv = async (page, text) => {
    await evaluate(page, (innerText) => {
        const matchingDivs = [...document.querySelectorAll("div")];
        matchingDivs.forEach((div) => {
            if (div.innerText === innerText) div.click();
        });
    }, text);
};

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {Number} scroll how much you want to scroll
 * @param {String} boxSelector
 */
const scrollBy = async (page, scroll, boxSelector) => {
    await evaluate(page, async ({ boxSelector, scroll }) => {
        const box = boxSelector ? document.querySelector(boxSelector) : document.scrollingElement;
        box.scrollBy({
            top: scroll,
            left: 0,
            behavior: "smooth"
        });
    }, { boxSelector, scroll });
};

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {String} boxSelector 
 * scrolls to the end of the box
 */
const scroll = async (page, boxSelector) => {
    await evaluate(page, async (boxSelector) => {
        const box = boxSelector ? document.querySelector(boxSelector) : document.scrollingElement;
        const scroll = async (box, scrollTop) => {
            box.scrollBy(0, 1000);
            // wait for 1 second
            await new Promise((resolve) => setTimeout(resolve, 1 * 1000));
            if (scrollTop != box.scrollTop) await scroll(box, box.scrollTop);
        };
        await scroll(box, box.scrollTop);
    }, boxSelector);
};

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {String} boxSelector 
 * @param {Function} fetchFunction 
 * @param {Function} compareFunction 
 * @param {Number} minElements 
 * @returns {Promise<any>} elements
 */
const loadElementsFromList = async (page, boxSelector, fetchFunction, compareFunction, minElements) => {

    const load = async (minElements, oldElementList = [], oldScrollTop) => {

        // wait
        await wait(1000 * 2);

        // scroll down
        await scrollBy(page, 500, boxSelector);

        // get loaded elements
        const loadedElements = await page.evaluate(fetchFunction);

        // concat oldElementList with new elementList
        const elementList = oldElementList.concat(loadedElements);

        // filter out duplicate elements
        const filteredElementList = elementList.reduce((prev, element) => {
            if(compareFunction(prev, element)) return prev;
            return prev.concat([element]);
        }, []);

        // check if end of follower list has been reached
        const scrollTop = await page.evaluate((boxSelector) => (boxSelector ? document.querySelector(boxSelector) : document.scrollingElement).scrollTop, boxSelector);
        if(scrollTop == oldScrollTop) return filteredElementList;

        // check if enough elements have been loaded
        if(minElements <= filteredElementList.length) return filteredElementList;

        // recursively rerun function until enough elements have been loaded
        const result = await load(minElements, filteredElementList, scrollTop);
        return result;

    };
    const result = await load(minElements);

    return result;

};

module.exports = {
    wait,
    evaluate,
    clickOnElement,
    clickOnElements,
    clickOnButton,
    clickOnDiv,
    scroll,
    scrollBy,
    loadElementsFromList,
    elementExists
};