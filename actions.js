const puppeteer = require("puppeteer");
const tools = require("./tools.js");
const popup = require("./popup.js");
const { errorMessage } = require("./message.js");
const { IBError, IBLoginError, IBGotoError } = require("./error.js");
const { SearchResult, User, UserDetails, Post, PostDetails, Comment } = require("./class.js");
const { StringToNumber } = require("./format.js");

/**
 * 
 * @param {Object} args 
 * @returns {Promise<puppeteer.Browser>}
 */
const launchBrowser = async (args) => await puppeteer.launch(args);

/**
 * 
 * @param {puppeteer.Browser} browser 
 * @param {String} url 
 * @param {String} language 
 * @param {Object} [cookies = []]
 * @returns {Promise<puppeteer.Page>}
 */
const newPage = async (browser, url, language, cookies = []) => {

    // create page
    const page = await browser.newPage();

    // change language
    await page.setExtraHTTPHeaders({
        "Accept-Language": language ? language : "en"
    });

    // set cookies
    await page.setCookie(...cookies);

    // goto url
    await page.goto(url);

    return page;

};

/**
 * 
 * @param {puppeteer.Page} page 
 * @returns {Promise<Object>}
 */
const getCookies = async (page) => {
    const cookies = await page.cookies();
    return cookies;
};

/**
 * 
 * @param {String | SearchResult | User | Post} identifier can either be a link, username, SearchResult, User or Post
 * @returns {Promise<any>}
 */
 const goto = async (page, identifier) => {
    try {

        const link = identifier instanceof SearchResult ? identifier.link :
                     identifier instanceof User ? identifier.link :
                     identifier instanceof Post ? identifier.link :
                    identifier.startsWith("https://www.instagram.com/") ? identifier : `https://www.instagram.com/${identifier}/`;

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
 * @returns {Promise<Boolean>}
 */
const isAuthenticated = async (page) => {

    // check if 'Login' button is present
    const loginElementExists = await tools.elementExists(page, "div", { innerHTML: "Log In" });
    const loginButtonExists = await tools.elementExists(page, "button", { innerHTML: "Log In" });

    return loginElementExists || loginButtonExists ? false : true;

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

/**
 * 
 * @param {puppeteer.Page} page 
 * @param {String | User | SearchResult} identifier can either be a username, link, an instance of the User class or a SearchResult which links to a User
 * @param {Number} [minLength = 50]
 * @returns {Promise<User[]>}
 */
const getFollower = async (page, identifier, minLength = 50) => {

    // goto page of user
    await goto(page, identifier);

    await tools.wait(1000 * 2);

    // click on 'Followers' section
    const username = 
        identifier instanceof User ? identifier.username :
        identifier instanceof SearchResult ? identifier.title :
        identifier.startsWith("https://www.instagram.com") ? identifier.split("/")[3] : identifier;

    await tools.clickOnElement(page, `[href='/${username}/followers/']`, {});
    await tools.wait(1000 * 5);

    // load follower
    const getLoadedFollower = () => [...document.querySelector(".PZuss").children].map(element => {

        const getDeepestNodes = (node) => {
            var result = [];
            const traverse = (element) => {
                [...element.children].forEach(child => {
                    if([...child.children].length > 0) {
                        traverse(child);
                    } else {
                        result.push(child);
                    }
                });
            };
            traverse(node);
            return result;
        };

        const username = [...element.querySelectorAll("a")].filter(el => el.innerText)[0].innerText;
        const description = getDeepestNodes(element)
            .filter(el => el.innerText)
            .filter(el => el.innerText != "Follow" && el.innerText != username)
            .map(el => el.innerText)[0];

        return { username, description };
    });
    const compareFunction = (prev, user) => prev.includes(user);

    const loadedElements = await tools.loadElementsFromList(page, ".isgrP", getLoadedFollower, compareFunction, minLength);
    const follower = loadedElements.map(element => new User(`https://www.instagram.com/${element.username}/`, element.username, element.description));

    return follower;

};
/**
 * 
 * @param {puppeteer.Page} page 
 * @param {String | User | SearchResult} identifier can either be a username, link, an instance of the User class or a SearchResult which links to a User
 * @param {Number} [minLength = 50]
 * @returns {Promise<User[]>}
 */
const getFollowing = async (page, identifier, minLength = 50) => {

    // goto page of user
    await goto(page, identifier);

    await tools.wait(1000 * 2);

    // click on 'Following' section
    const username = 
        identifier instanceof User ? identifier.username :
        identifier instanceof SearchResult ? identifier.title :
        identifier.startsWith("https://www.instagram.com") ? identifier.split("/")[3] : identifier;

    await tools.clickOnElement(page, `[href='/${username}/following/']`, {});
    await tools.wait(1000 * 5);

    // load following
    const getLoadedFollowingList = () => [...document.querySelector(".PZuss").children].map(element => {

        const getDeepestNodes = (node) => {
            var result = [];
            const traverse = (element) => {
                [...element.children].forEach(child => {
                    if([...child.children].length > 0) {
                        traverse(child);
                    } else {
                        result.push(child);
                    }
                });
            };
            traverse(node);
            return result;
        };

        const username = [...element.querySelectorAll("a")].filter(el => el.innerText)[0].innerText;
        const description = getDeepestNodes(element)
            .filter(el => el.innerText)
            .filter(el => el.innerText != "Follow" && el.innerText != username)
            .map(el => el.innerText)[0];

        return { username, description };
    });
    const compareFunction = (prev, user) => prev.includes(user);

    const loadedElements = await tools.loadElementsFromList(page, ".isgrP", getLoadedFollowingList, compareFunction, minLength);
    const following = loadedElements.map(element => new User(`https://www.instagram.com/${element.username}/`, element.username, element.description));

    return following;

};
/**
 * 
 * @param {puppeteer.Page} page 
 * @param {String | User | SearchResult} identifier can either be a username, link, an instance of the User class or a SearchResult which links to a User
 * @returns {Promise<UserDetails>}
 */
const getUserDetails = async (page, identifier) => {
    
    // goto page of user
    await goto(page, identifier);

    await tools.wait(1000 * 3);

    /**
     * 
     * @param {String} rawText
     * @returns {Number}
     */
     const parseNumber = (rawText) => {
        const text = rawText.split(" ")[0].split(",").join("");
        if(!text.endsWith("m") && !text.endsWith("k")) return parseInt(text);
        const number = parseInt(text.substring(0, text.length - 1));
        const unit = text.substring(text.length - 1);
        if(unit == "m") {
            return number * 1000000;
        } else if(unit == "k") {
            return number * 1000;
        } else {
            throw new IBError(errorMessage.failedToConvertNumber.code, errorMessage.failedToConvertNumber.message);
        }
    };

    const followersText = await page.evaluate(() => {
        try {
            return [...document.querySelectorAll("a")].filter(el => el.href.endsWith("/followers/"))[0].innerText;
        } catch (e) {
            // fallback method for private accounts
            return document.querySelectorAll(".g47SY")[1].innerText;
        }
    });
    const followers = parseNumber(followersText);

    const followingText = await page.evaluate(() => {
        try {
            return [...document.querySelectorAll("a")].filter(el => el.href.endsWith("/following/"))[0].innerText;
        } catch (e) {
            // fallback method for private accounts
            return document.querySelectorAll(".g47SY")[2].innerText;
        }
    });
    const following = parseNumber(followingText);

    const postsText = await page.evaluate(() => {
        const element = document.querySelectorAll(".g47SY")[0];
        return element.innerText.split(".").join("").split(",").join("");
    });
    const posts = parseNumber(postsText);

    const description = await page.evaluate(() => document.querySelector(".rhpdm") ? document.querySelector(".rhpdm").innerText : null);

    const username = 
        identifier instanceof User ? identifier.username :
        identifier instanceof SearchResult ? identifier.title :
        identifier.startsWith("https://www.instagram.com") ? identifier.split("/")[3] : identifier;

    return new UserDetails(`https://www.instagram.com/${username}/`, username, description, posts, followers, following);

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
 * @param {String | User | SearchResult} identifier can either be a username, link, an instance of the User class or a SearchResult which links to a User
 * @param {Number} [ minLength = 50 ]
 * @returns {Promise<Post[]>}
 */
const getPosts = async (page, identifier, minLength = 50) => {

    // goto page of user
    await goto(page, identifier);

    await tools.wait(1000 * 3);

    const postsNumber = await page.evaluate(() => parseInt(document.querySelectorAll(".g47SY")[0].innerText.split(",").join("").split(".").join("")));
    const possibleMinLength = postsNumber > minLength ? minLength : postsCount;

    // load posts
    const loadPosts = () => [...document.querySelectorAll("a")].filter(element => element.href.startsWith("https://www.instagram.com/p/")).map(post => post.href);
    const compareFunction = (prev, post) => (prev.find(el => el == post) ? true : false);
    const elements = await tools.loadElementsFromList(page, null, loadPosts, compareFunction, (possibleMinLength - 1));

    const posts = elements.map(element => new Post(element));
    
    return posts;

};
/**
 * 
 * @param {puppeteer.Page} page 
 * @param {String | Post} identifier this can either be the link of a post or an instance of the Post Class
 * @returns {PostDetails}
 */
const getPostDetails = async (page, identifier) => {

    const link = identifier instanceof Post ? identifier.link : identifier;

    // goto link
    await goto(page, link);

    await tools.wait(1000 * 2);

    const postId = link.split("/")[4];

    const username = await page.evaluate(() => [...document.querySelectorAll(".sqdOP.yWX7d._8A5w5.ZIAjV")][0].innerText);
    const user = new User(`https://www.instagram.com/${username}/`, username, null);

    const likesStr = await page.evaluate((postId) => {
        try {
            return [...document.querySelectorAll("a")].reverse().find(a => a.href == `https://www.instagram.com/p/${postId}/liked_by/`).children[0].innerText;
        } catch(e) {
            return null;
        }
    }, postId);
    const likes = likesStr ? StringToNumber(likesStr) : null;

    return new PostDetails(link, user, likes);

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
/**
 * 
 * @param {puppeteer.Page} page 
 * @param {String | Post} postIdentifier can either be the link to a post or an instance of the Post class
 * @param {Number} [ minComments = 5 ] 
 * @returns {Promise<Comment[]>}
 */
const getPostComments = async (page, postIdentifier, minComments = 5) => {

    // goto post
    await goto(page, postIdentifier);

    // wait
    await tools.wait(1000 * 2);

    /**
     * 
     * @returns {Promise<Object[]>}
     */
    const getLoadedComments = () => page.evaluate(() => {
        const box = document.querySelector(".XQXOT");
        const elements = [...box.children].filter((e, i) => i != 0);
        const loadedComments = elements.map(element => { 
            const textEl = [...element.querySelectorAll("span")]
                .filter((span) => span.children.length == 0)
                .filter((span) => !span.innerText.startsWith("View replies"))
                .filter((span) => span.innerText != "Verified")[0];
            const usernameEl = [...element.querySelectorAll("a")].filter((a) => a.children.length == 0)[0];
            return { text: textEl ? textEl.innerText : null, username: usernameEl ? usernameEl.innerText : null };
        });
        return loadedComments;
    });
    const loadMoreComments = async () => {
        // scroll to bottom
        await tools.scroll(page, ".XQXOT");

        // click on 'Load more comments' button
        await page.evaluate(() => {
            const loadCommentsButton = document.querySelector("[aria-label='Load more comments']");
            if (loadCommentsButton) loadCommentsButton.click();
        });

        // wait
        await tools.wait(1000 * 2);  
    };
    const getComments = async (minComments, commentList = []) => {
        const loadedComments = await getLoadedComments(minComments);
        const newLoadedCommentsList = loadedComments
            .concat(commentList)
            .filter(loadedComment => loadedComment.username && loadedComment.text)
            .filter((loadedComment, index, self) => self.findIndex(el => el.text == loadedComment.text && el.username == loadedComment.username) === index);

        // check if enough comments has been loaded
        if(newLoadedCommentsList.length >= minComments) return newLoadedCommentsList;

        // load more comments
        await loadMoreComments();

        // recursively rerun function until enough comments have been fetched
        const comments = await getComments(minComments, newLoadedCommentsList);
        return comments;
    };

    const loadedComments = await getComments(minComments);

    const post = postIdentifier instanceof Post ? postIdentifier : new Post(postIdentifier);
    const comments = loadedComments
        .filter(loadedComment => loadedComment.username && loadedComment.text)
        .map(loadedComment => new Comment(loadedComment.text, new User(`https://www.instagram.com/${loadedComment.username}/`, loadedComment.username), post));

    return comments;

};

module.exports = {
    launchBrowser,
    newPage,
    login,
    logout,
    search,
    getFollower,
    getFollowing,
    getUserDetails,
    getPosts,
    getPostDetails,
    goto,
    getCookies,
    isAuthenticated,
    follow,
    unfollow,
    likePost,
    unlikePost,
    commentPost,
    getPostComments
};