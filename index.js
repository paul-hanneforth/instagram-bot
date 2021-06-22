const actions = require("./scripts/actions.js");
const data = require("./scripts/data.js");
const misc = require("./scripts/misc.js");
const navigation = require("./scripts/navigation.js");
const popup = require("./scripts/popup.js");
const channel = require("./scripts/channel.js");
const observer = require("./scripts/observer.js");

const puppeteer = require("puppeteer");
const fs = require("fs");

const { IBError, IBLoginError } = require("./error.js");
const { errorMessage } = require("./message.js");
const { SearchResult, User, UserDetails, DirectMessage } = require("./types.js");
const { Cache } = require("./cache.js");

class Action {

    /**
     * @constructor 
     * @param {Function} func 
     */
    constructor(func) {
        this.func = func;
    }
    /**
     * @returns {Promise<any>}
     */
    async run() {
        return (await this.func());
    }
    
}

class Queue {

    /**
     * @constructor
     */
    constructor() {
        this.list = [];
        this.shouldRun = true;

        // start running Queue
        this.run();
    }
    async run() {
        if(!this.shouldRun) return;

        if(this.list.length > 0) {
            await this.list[0]();
            this.list.splice(0, 1);
        }
        this.timeout = setTimeout(() => this.run(), 1000);
    }
    stop() {
        this.shouldRun = false;
    }
    /**
     * 
     * @param {Action} action 
     * @returns {Promise<any>}
     */
    push(action) {
        return new Promise((resolve, reject) => {
            this.list.push(async () => {
                try {
                    const result = await action.run();
                    resolve(result);
                } catch(e) {
                    reject(e);
                }
            });
        });
    }

}
class InstagramBot {

    /**
     * 
     * @param {puppeteer.Browser} browser 
     * @param {puppeteer.Page} page
     * @param {Boolean} [ authenticated = false ]
     * @property {puppeteer.Browser} browser
     * @property {puppeteer.Page} page
     * @property {Queue} queue
     * @property {Boolean} authenticated
     * @property {String} username
     * @property {Cache} cache
     */
    constructor(browser, page, authenticated = false) {
        this.browser = browser;
        this.page = page;
        this.queue = new Queue();
        this.authenticated = authenticated;
        this.username = null;
        this.cache = Cache.empty();
    }

    /**
     * 
     * @param {Boolean} [ headless = false ]  
     * @param {Object} [ session = {} ]
     * @returns {Promise<InstagramBot>}
     */
    static async launch(headless = false, session = {}) {
        const args = ["--no-sandbox", "--disable-setuid-sandbox"];
        const browser = await misc.launchBrowser({ headless, args });
        const cookies = session.cookies ? session.cookies : [];
        const page = await misc.newPage(browser, "en", cookies);

        // check if page is already authenticated
        const isAuthenticated = await data.isAuthenticated(page);

        // create bot
        const bot = await new InstagramBot(browser, page, isAuthenticated);

        // add observer to bot
        await bot.addObserver(async () => {
            // will execute everytime the page changes
            await popup.dismissCookiePopup(page);
            await popup.dismissNotificationPopup(page);
        });

        return bot;
    }

    /**
     * 
     * @param {String} filePath 
     * @returns {Promise<Object>} session, which probably stores your credentials
     */
    static async loadSession(filePath) {
        try {

            const raw = await fs.promises.readFile(filePath);
            const session = JSON.parse(raw);
            return session;

        } catch(e) {
            throw new IBError(errorMessage.failedToLoadSession.code, errorMessage.failedToLoadSession.message, e);
        }
    }

    /**
     * closes the browser
     * @returns {Promise<void>}
     */
    async close() {
        await this.page.close();
        await this.browser.close();
        await this.browser.disconnect();
        await this.queue.stop();
    }

    /**
     * stops the bot (does the same as 'close')
     * @returns {Promise<void>}
     */
    async stop() {
        await this.page.close();
        await this.browser.close();
        await this.browser.disconnect();
        await this.queue.stop();
    }

    /**
     * 
     * @param {Function} func 
     * @returns {Promise}
     */
    async addObserver(func) {
        if(!this.browser.isConnected()) throw new IBError(errorMessage.browserNotRunning.code, errorMessage.browserNotRunning.message);

        await observer.addObserver(this.page, func);
    }

    /**
     * @returns {Promise<Object>}
     */
    async getCookies() {
        if(!this.browser.isConnected()) throw new IBError(errorMessage.browserNotRunning.code, errorMessage.browserNotRunning.message);

        const action = new Action(() => data.getCookies(this.page));
        const cookies = await this.queue.push(action);

        return cookies;
    }

    /**
     * 
     * @returns {Promise<Object>} session, which normally stores credentials
     */
    async getSession() {
        if(!this.browser.isConnected()) throw new IBError(errorMessage.browserNotRunning.code, errorMessage.browserNotRunning.message);

        const cookies = await this.getCookies();
        return { cookies };
    }

    /**
     * 
     * @param {String} filePath 
     * @returns {Promise}
     */
    async saveSession(filePath) {
        if(!this.browser.isConnected()) throw new IBError(errorMessage.browserNotRunning.code, errorMessage.browserNotRunning.message);

        const session = await this.getSession();
        const text = JSON.stringify(session);
        await fs.promises.writeFile(filePath, text);
    }

    /**
     * 
     * @param {String} username 
     * @param {String} password 
     * @returns {Promise<void>}
     */
    async login(username, password) {
        if(!this.browser.isConnected()) throw new IBError(errorMessage.browserNotRunning.code, errorMessage.browserNotRunning.message);
        if(this.authenticated) throw new IBLoginError(errorMessage.botAlreadyAuthenticated.code, errorMessage.botAlreadyAuthenticated.message);

        const action = new Action(() => actions.login(this.page, username, password));
        await this.queue.push(action);

        this.username = username;
        this.authenticated = true;
    }

    /**
     * 
     * @returns {Promise<void>}
     */
    async logout() {
        if(!this.browser.isConnected()) throw new IBError(errorMessage.browserNotRunning.code, errorMessage.browserNotRunning.message);
        if(!this.authenticated) return;

        const action = new Action(() => actions.logout(this.page, this.username));
        await this.queue.push(action);

        this.username = null;
        this.authenticated = false;
    }

    /**
     * 
     * @param {String | User | SearchResult} identifier can either be a username, link, an instance of the User class or a SearchResult which links to a User
     * @param {Number} [ minLength = 50 ] 
     * @returns {Promise<User[]>}
     */
    async getFollowing(identifier, minLength = 50) {
        if(!this.browser.isConnected()) throw new IBError(errorMessage.browserNotRunning.code, errorMessage.browserNotRunning.message);
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const action = new Action(() => data.getFollowing(this.page, identifier, minLength));
        const following = await this.queue.push(action);

        // store data in cache, if types are compatible
        if(identifier instanceof User) {
            this.cache = this.cache.addFollowingList(identifier, following);
        }

        return following;
    }

    /**
     * 
     * @param {String | User | SearchResult} identifier can either be a username, link, an instance of the User class or a SearchResult which links to a User
     * @param {Number} [ minLength = 50 ] 
     * @returns {Promise<User[]>}
     */
    async getFollower(identifier, minLength = 50) {
        if(!this.browser.isConnected()) throw new IBError(errorMessage.browserNotRunning.code, errorMessage.browserNotRunning.message);
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const action = new Action(() => data.getFollower(this.page, identifier, minLength));
        const follower = await this.queue.push(action);

        // store data in cache, if types are compatible
        if(identifier instanceof User) {
            this.cache = this.cache.addFollowerList(identifier, follower);
        }

        return follower;
    }

    /**
     * 
     * @param {String | User | SearchResult} identifier can either be a username, link, an instance of the User class or a SearchResult which links to a User
     * @returns {Promise<void>}
     */
    async follow(identifier) {
        if(!this.browser.isConnected()) throw new IBError(errorMessage.browserNotRunning.code, errorMessage.browserNotRunning.message);
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const action = new Action(() => actions.follow(this.page, identifier));
        await this.queue.push(action);
    }

    /**
     * 
     * @param {String | User | SearchResult} identifier can either be a username, link, an instance of the User class or a SearchResult which links to a User
     * @returns {Promise<void>}
     */
     async unfollow(identifier) {
        if(!this.browser.isConnected()) throw new IBError(errorMessage.browserNotRunning.code, errorMessage.browserNotRunning.message);
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const action = new Action(() => actions.unfollow(this.page, identifier));
        await this.queue.push(action);
    }

    /**
     *
     * @param {String | User | SearchResult} userIdentifier can either be a username, link, an instance of the User class or a SearchResult which links to a User
     * @returns {Promise<Boolean>} whether you are following the specified user or not
     */
    async isFollowing(userIdentifier) {
        if(!this.browser.isConnected()) throw new IBError(errorMessage.browserNotRunning.code, errorMessage.browserNotRunning.message);
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const action = new Action(() => data.isFollowing(this.page, userIdentifier));
        const result = await this.queue.push(action);
        return result;
    }

    /**
     * 
     * @param {String} searchTerm 
     * @returns {Promise<SearchResult[]>}
     */
    async search(searchTerm) {
        if(!this.browser.isConnected()) throw new IBError(errorMessage.browserNotRunning.code, errorMessage.browserNotRunning.message);
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const action = new Action(() => navigation.search(this.page, searchTerm));
        const searchResults = await this.queue.push(action);
        return searchResults;
    }

    /**
     * 
     * @param {String | SearchResult | User | Post} identifier can either be a link, username, SearchResult, User or Post
     * @returns {Promise<void>}
     */
    async goto(identifier) {
        if(!this.browser.isConnected()) throw new IBError(errorMessage.browserNotRunning.code, errorMessage.browserNotRunning.message);
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const action = new Action(() => navigation.goto(this.page, identifier));
        await this.queue.push(action);
    }

    /**
     * 
     * @param {String | User | SearchResult} identifier can either be a username, link, an instance of the User class or a SearchResult which links to a User
     * @returns {Promise<UserDetails>}
     */
    async getUserDetails(identifier) {
        if(!this.browser.isConnected()) throw new IBError(errorMessage.browserNotRunning.code, errorMessage.browserNotRunning.message);
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const action = new Action(() => data.getUserDetails(this.page, identifier));
        const userDetails = await this.queue.push(action);
        return userDetails;
    }

    /**
     * 
     * @param {String | User | SearchResult} identifier can either be a username, link, an instance of the User class or a SearchResult which links to a User
     * @param {Number} [ minLength = 50 ]
     * @returns {Promise<Post[]>}
     */
    async getPosts(identifier, minLength = 50) {
        if(!this.browser.isConnected()) throw new IBError(errorMessage.browserNotRunning.code, errorMessage.browserNotRunning.message);
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const action = new Action(() => data.getPosts(this.page, identifier, minLength));
        const posts = await this.queue.push(action);
        return posts;
    }

    /**
     * 
     * @param {String | Post} identifier this can either be the link of a post or an instance of the Post Class
     * @returns {Promise<PostDetails>}
     */
    async getPostDetails(identifier) {
        if(!this.browser.isConnected()) throw new IBError(errorMessage.browserNotRunning.code, errorMessage.browserNotRunning.message);
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const action = new Action(() => data.getPostDetails(this.page, identifier));
        const postDetails = await this.queue.push(action);
        return postDetails;
    }

    /**
     * 
     * @param {String | Post} identifier this can either be the link of a post or an instance of the Post Class
     * @returns {Promise<void>}
     */
    async likePost(identifier) {
        if(!this.browser.isConnected()) throw new IBError(errorMessage.browserNotRunning.code, errorMessage.browserNotRunning.message);
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const action = new Action(() => actions.likePost(this.page, identifier));
        await this.queue.push(action);
    }

    /**
     * 
     * @param {String | Post} identifier this can either be the link of a post or an instance of the Post Class
     * @returns {Promise<void>}
     */
    async unlikePost(identifier) {
        if(!this.browser.isConnected()) throw new IBError(errorMessage.browserNotRunning.code, errorMessage.browserNotRunning.message);
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const action = new Action(() => actions.unlikePost(this.page, identifier));
        await this.queue.push(action);
    }

    /**
     * 
     * @param {String | Post} postIdentifier this can either be the link of a post or an instance of the Post Class
     * @param {String} comment the text you want to comment on the post
     * @returns {Promise<void>}
     */
    async commentPost(postIdentifier, comment) {
        if(!this.browser.isConnected()) throw new IBError(errorMessage.browserNotRunning.code, errorMessage.browserNotRunning.message);
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const action = new Action(() => actions.commentPost(this.page, postIdentifier, comment));
        await this.queue.push(action);
    }

    /**
     * 
     * @param {String | Post} postIdentifier can either be the link to a post or an instance of the Post class
     * @param {Number} [ minComments = 5 ] 
     * @returns {Promise<Comment[]>}
     */
    async getPostComments(postIdentifier, minComments = 5) {
        if(!this.browser.isConnected()) throw new IBError(errorMessage.browserNotRunning.code, errorMessage.browserNotRunning.message);
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const action = new Action(() => data.getPostComments(this.page, postIdentifier, minComments));
        const comments = await this.queue.push(action);
        return comments;
    }

    /**
     * 
     * @param {String | SearchResult | User} userIdentifier can either be a username, link, an instance of the User class or a SearchResult which links to a User
     * @param {String} message 
     * @returns {Promise<void>}
     */
    async directMessageUser(userIdentifier, message) {
        if(!this.browser.isConnected()) throw new IBError(errorMessage.browserNotRunning.code, errorMessage.browserNotRunning.message);
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const action = new Action(() => channel.directMessageUser(this.page, userIdentifier, message));
        await this.queue.push(action);
    }   

    /**
     * 
     * @param {puppeteer.Page} page 
     * @param {User | SearchResult | String} userIdentifier can either be a username, link, an instance of the User class or a SearchResult which links to a User
     * @returns {Promise<DirectMessage[]>}
     */
    async getChannelMessages(userIdentifier) {
        if(!this.browser.isConnected()) throw new IBError(errorMessage.browserNotRunning.code, errorMessage.browserNotRunning.message);
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const action = new Action(() => channel.getChannelMessages(this.page, userIdentifier));
        const messages = await this.queue.push(action);
        return messages;
    }

}

module.exports = InstagramBot;