const puppeteer = require("puppeteer");
const tools = require("./../tools.js");
const { errorMessage } = require("./../message.js");
const { IBError } = require("./../error.js");
const { SearchResult, User, UserDetails, Post, PostDetails, Comment } = require("./../class.js");
const { goto } = require("./navigation.js");
const { StringToNumber } = require("./../format.js");

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
    const followersSectionIsClickable = await tools.clickOnElement(page, `[href='/${username}/followers/']`, {});
    await tools.wait(1000 * 5);

    // if 'Followers' section is not clickable, then the account is private
    if(!followersSectionIsClickable) throw new IBError(errorMessage.accountPrivate.code, errorMessage.accountPrivate.message);

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
            .filter(el => el.innerText != "Follow" && el.innerText != username && el.innerText != "Verified")
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

    const followingSectionIsClickable = await tools.clickOnElement(page, `[href='/${username}/following/']`, {});
    await tools.wait(1000 * 5);

    // if 'Following' section is not clickable, then the account is private
    if(!followingSectionIsClickable) throw new IBError(errorMessage.accountPrivate.code, errorMessage.accountPrivate.message);

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
            .filter(el => el.innerText != "Follow" && el.innerText != username && el.innerText != "Verified" && el.innerText != "Following")
            .map(el => el.innerText)[0];

        return { username, description };
    });
    const compareFunction = (prev, user) => prev.find((pUser) => user.username == pUser.username) ? true : false;

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
 * @param {String | User | SearchResult} userIdentifier can either be a username, link, an instance of the User class or a SearchResult which links to a User
 * @returns {Promise<Boolean>} whether you are following the specified user or not
 */
const isFollowing = async (page, userIdentifier) => {

    // goto page of user
    await goto(page, userIdentifier);

    // wait
    await tools.wait(1000 * 2);

    // check if symbol for unfollowing a user exists
    const followingSymbolExists = await tools.elementExists(page, "[aria-label='Following']");
    return followingSymbolExists;

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
 * @param {puppeteer.Page} page 
 * @returns {Promise<Boolean>}
 */
const isAuthenticated = async (page) => {

    // goto main page
    await goto(page, "https://www.instagram.com");
    await tools.wait(1000 * 2);

    // check if 'Login' button is present
    const loginElementExists = await tools.elementExists(page, "div", { innerHTML: "Log In" });
    const loginButtonExists = await tools.elementExists(page, "button", { innerHTML: "Log In" });

    return loginElementExists || loginButtonExists ? false : true;

};

module.exports = {
    getFollower,
    getFollowing,
    getUserDetails,
    isFollowing,
    getPosts,
    getPostDetails,
    getPostComments,
    isAuthenticated,
    getCookies
};