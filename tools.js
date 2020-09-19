const util = require("./util.js");

const newPage = async (browser, url) => {
    // create page
    const page = await browser.newPage();
    // change language
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en'
    });
    // set url
    await page.goto(url);
    return page;
}
const evaluate = async (page, js, args) => {
    const result = await page.evaluate(js, args);
    return result;
}
const clickOn = async (page, querySelector, property) => {
    await evaluate(page, (args) => {
        const elements = [...document.querySelectorAll(args.querySelector)];
        const keysProp = Object.keys((args.property ? args.property : {}));
        elements.forEach((element) => {
            const matchesProperties = keysProp.reduce((acc, cur) => {
                if (args.property[cur] == element[cur]) return true;
                return false;
            }, true)
            if (matchesProperties) element.click();
        })
    }, { querySelector, property })
}
const clickOnOne = async (page, querySelector, property) => {
    const clickedElement = await evaluate(page, (args) => {
        const elements = [...document.querySelectorAll(args.querySelector)];
        const keysProp = Object.keys((args.property ? args.property : {}));
        const clickedElement = elements.reduce((alreadyClicked, element) => {
            if(alreadyClicked) return true;
            const matchesProperties = keysProp.reduce((acc, cur) => {
                if (args.property[cur] == element[cur]) return true;
                return false;
            }, true)
            if (matchesProperties) {
                element.click();
                return true;
            }
            return alreadyClicked;
        }, false)
        return clickedElement;
    }, { querySelector, property })
    return clickedElement;
}
const clickOnButton = async (page, buttonText) => {
    await clickOn(page, "button", { innerText: buttonText });
}
const clickOnDiv = async (page, text) => {
    await evaluate(page, (innerText) => {
        const matchingDivs = [...document.querySelectorAll("div")];
        matchingDivs.forEach((div) => {
            if (div.innerText === innerText) div.click();
        })
    }, text);
}
const scrollBy = async (page, scroll, boxSelector) => {
    await evaluate(page, async ({ boxSelector, scroll }) => {
        const box = boxSelector ? document.querySelector(boxSelector) : document.scrollingElement;
        box.scrollBy({
            top: scroll,
            left: 0,
            behavior: "smooth"
        })
    }, { boxSelector, scroll })
}
const scroll = async (page, boxSelector) => {
    await evaluate(page, async (boxSelector) => {
        const box = boxSelector ? document.querySelector(boxSelector) : document.scrollingElement;
        const scroll = async (box, scrollTop) => {
            box.scrollBy(0, 1000);
            // wait for 1 second
            await new Promise((resolve) => setTimeout(resolve, 1 * 1000));
            if (scrollTop != box.scrollTop) await scroll(box, box.scrollTop);
        }
        await scroll(box, box.scrollTop);
    }, boxSelector)
}
const loadElementsFromList = async (page, boxSelector, fetchFunction, compareFunction, minElements) => {

    const load = async (minElements, oldElementList = [], oldScrollTop) => {

        // wait
        await util.wait(1000 * 2);

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

    }
    const result = await load(minElements);

    return result;

}

module.exports = {
    newPage,
    evaluate,
    clickOn,
    clickOnOne,
    clickOnButton,
    clickOnDiv,
    scroll,
    scrollBy,
    loadElementsFromList
}