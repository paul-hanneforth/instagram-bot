const actions = require("./scripts/actions.js");
const data = require("./scripts/data.js");
const misc = require("./scripts/misc.js");
const navigation = require("./scripts/navigation.js");
const popup = require("./scripts/popup.js");
const observer = require("./scripts/observer.js");

const puppeteer = require("puppeteer");
const { IBError } = require("./error.js");
const { errorMessage } = require("./message.js");
const { SearchResult, User, UserDetails } = require("./class.js");

class Queue {

    constructor() {
        this.list = [];

        // start running Queue
        this.run();
    }
    async run() {
        if(this.list.length > 0) {
            await this.list[0]();
            this.list.splice(0, 1);
        }
        setTimeout(() => this.run(), 1000);
    }
    push(func) {
        return new Promise((resolve, reject) => {
            this.list.push(async () => {
                try {
                    const result = await func();
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
     */
    constructor(browser, page, authenticated = false) {
        this.browser = browser;
        this.page = page;
        this.queue = new Queue();
        this.authenticated = authenticated;
        this.username = null;
    }

    /**
     * 
     * @param {Boolean} [ headless = false ]  
     * @param {Object} [ cookies = [] ]
     * @returns {Promise<InstagramBot>}
     */
    static async launch(headless = false, cookies = []) {
        const browser = await misc.launchBrowser({ headless });
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
     * @param {Function} func 
     * @returns {Promise}
     */
    async addObserver(func) {
        await observer.addObserver(this.page, func);
    }

    /**
     * @returns {Promise<Object>}
     */
    async getCookies() {
        const cookies = await this.queue.push(() => data.getCookies(this.page));

        return cookies;
    }

    /**
     * 
     * @param {String} username 
     * @param {String} password 
     * @returns {Promise<any>}
     */
    async login(username, password) {
        await this.queue.push(() => actions.login(this.page, username, password));

        this.username = username;
        this.authenticated = true;
    }

    /**
     * 
     * @returns {Promise<any>}
     */
    async logout() {
        if(!this.authenticated) return;

        await this.queue.push(() => actions.logout(this.page, this.username));

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
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const following = await this.queue.push(() => data.getFollowing(this.page, identifier, minLength));

        return following;
    }

    /**
     * 
     * @param {String | User | SearchResult} identifier can either be a username, link, an instance of the User class or a SearchResult which links to a User
     * @param {Number} [ minLength = 50 ] 
     * @returns {Promise<User[]>}
     */
    async getFollower(identifier, minLength = 50) {
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const follower = await this.queue.push(() => data.getFollower(this.page, identifier, minLength));

        return follower;
    }

    /**
     * 
     * @param {String | User | SearchResult} identifier can either be a username, link, an instance of the User class or a SearchResult which links to a User
     * @returns {Promise<any>}
     */
    async follow(identifier) {
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        await this.queue.push(() => actions.follow(this.page, identifier));
    }

    /**
     * 
     * @param {String | User | SearchResult} identifier can either be a username, link, an instance of the User class or a SearchResult which links to a User
     * @returns {Promise<any>}
     */
     async unfollow(identifier) {
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        await this.queue.push(() => actions.unfollow(this.page, identifier));
    }

    /**
     *
     * @param {String | User | SearchResult} userIdentifier can either be a username, link, an instance of the User class or a SearchResult which links to a User
     * @returns {Promise<Boolean>} whether you are following the specified user or not
     */
    async isFollowing(userIdentifier) {
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const result = await this.queue.push(() => data.isFollowing(this.page, userIdentifier));
        return result;
    }

    /**
     * 
     * @param {String} searchTerm 
     * @returns {Promise<SearchResult[]>}
     */
    async search(searchTerm) {
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const searchResults = await this.queue.push(() => navigation.search(this.page, searchTerm));
        return searchResults;
    }

    /**
     * 
     * @param {String | SearchResult | User | Post} identifier can either be a link, username, SearchResult, User or Post
     * @returns {Promise<any>}
     */
    async goto(identifier) {
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        await this.queue.push(() => navigation.goto(this.page, identifier));
    }

    /**
     * 
     * @param {String | User | SearchResult} identifier can either be a username, link, an instance of the User class or a SearchResult which links to a User
     * @returns {Promise<UserDetails>}
     */
    async getUserDetails(identifier) {
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const userDetails = await this.queue.push(() => data.getUserDetails(this.page, identifier));
        return userDetails;
    }

    /**
     * 
     * @param {String | User | SearchResult} identifier can either be a username, link, an instance of the User class or a SearchResult which links to a User
     * @param {Number} [ minLength = 50 ]
     * @returns {Promise<Post[]>}
     */
    async getPosts(identifier, minLength = 50) {
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const posts = await this.queue.push(() => data.getPosts(this.page, identifier, minLength));
        return posts;
    }

    /**
     * 
     * @param {String | Post} identifier this can either be the link of a post or an instance of the Post Class
     * @returns {Promise<PostDetails>}
     */
    async getPostDetails(identifier) {
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const postDetails = await this.queue.push(() => data.getPostDetails(this.page, identifier));
        return postDetails;
    }

    /**
     * 
     * @param {String | Post} identifier this can either be the link of a post or an instance of the Post Class
     * @returns {Promise<any>}
     */
    async likePost(identifier) {
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        await this.queue.push(() => actions.likePost(this.page, identifier));
    }

    /**
     * 
     * @param {String | Post} identifier this can either be the link of a post or an instance of the Post Class
     * @returns {Promise<any>}
     */
    async unlikePost(identifier) {
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        await this.queue.push(() => actions.unlikePost(this.page, identifier));
    }

    /**
     * 
     * @param {String | Post} postIdentifier this can either be the link of a post or an instance of the Post Class
     * @param {String} comment the text you want to comment on the post
     * @returns {Promise<any>}
     */
    async commentPost(postIdentifier, comment) {
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        await this.queue.push(() => actions.commentPost(this.page, postIdentifier, comment));
    }

    /**
     * 
     * @param {String | Post} postIdentifier can either be the link to a post or an instance of the Post class
     * @param {Number} [ minComments = 5 ] 
     * @returns {Promise<Comment[]>}
     */
    async getPostComments(postIdentifier, minComments = 5) {
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const comments = await this.queue.push(() => data.getPostComments(this.page, postIdentifier, minComments));
        return comments;
    }

}

module.exports = InstagramBot;