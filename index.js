const actions = require("./actions.js");
const tools = require("./tools.js");
const puppeteer = require("puppeteer");
const { IBError } = require("./error.js");
const { errorMessage } = require("./message.js");
const { SearchResult, User, UserDetails } = require("./class.js");

class Stack {

    constructor() {
        this.list = [];

        // start running Stack
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
     * @property {Stack} stack
     * @property {Boolean} authenticated
     * @property {String} username
     */
    constructor(browser, page, authenticated = false) {
        this.browser = browser;
        this.page = page;
        this.stack = new Stack();
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
        const browser = await actions.launchBrowser({ headless });
        const page = await actions.newPage(browser, "about:blank", "en", cookies);

        // check if page is already authenticated
        const isAuthenticated = await actions.isAuthenticated(page);

        return new InstagramBot(browser, page, isAuthenticated);
    }

    /**
     * @returns {Promise<Object>}
     */
    async getCookies() {
        const cookies = await this.stack.push(() => actions.getCookies(this.page));

        return cookies;
    }

    /**
     * 
     * @param {String} username 
     * @param {String} password 
     * @returns {Promise<any>}
     */
    async login(username, password) {
        await this.stack.push(() => actions.login(this.page, username, password));

        this.username = username;
        this.authenticated = true;
    }

    /**
     * 
     * @returns {Promise<any>}
     */
    async logout() {
        if(!this.authenticated) return;

        await this.stack.push(() => actions.logout(this.page, this.username));

        this.username = null;
        this.authenticated = false;
    }

    /**
     * 
     * @param {String} username 
     * @param {Number} [ minLength = 50 ] 
     * @returns {Promise<User[]>}
     */
    async getFollowing(username, minLength = 50) {
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const following = await this.stack.push(() => actions.getFollowing(this.page, username, minLength));

        return following;
    }

    /**
     * 
     * @param {String} username 
     * @param {Number} [ minLength = 50 ] 
     * @returns {Promise<User[]>}
     */
    async getFollower(username, minLength = 50) {
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const follower = await this.stack.push(() => actions.getFollower(this.page, username, minLength));

        return follower;
    }

    /**
     * 
     * @param {String} username 
     * @returns {Promise<any>}
     */
    async follow(username) {
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        await this.stack.push(() => actions.follow(this.page, username));
    }

    /**
     * 
     * @param {String} username 
     * @returns {Promise<any>}
     */
     async unfollow(username) {
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        await this.stack.push(() => actions.unfollow(this.page, username));
    }

    /**
     * 
     * @param {String} searchTerm 
     * @returns {Promise<SearchResult[]>}
     */
    async search(searchTerm) {
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const searchResults = await this.stack.push(() => actions.search(this.page, searchTerm));
        return searchResults;
    }

    /**
     * 
     * @param {String | SearchResult | User | Post} identifier can either be a link, username, SearchResult, User or Post
     * @returns {Promise<any>}
     */
    async goto(identifier) {
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        await this.stack.push(() => actions.goto(this.page, identifier));
    }

    /**
     * 
     * @param {String} username 
     * @returns {Promise<UserDetails>}
     */
    async getUserDetails(username) {
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const userDetails = await this.stack.push(() => actions.getUserDetails(this.page, username));
        return userDetails;
    }

    /**
     * 
     * @param {String} username
     * @param {Number} [ minLength = 50 ]
     * @returns {Promise<Post[]>}
     */
    async getPosts(username, minLength = 50) {
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const posts = await this.stack.push(() => actions.getPosts(this.page, username, minLength));
        return posts;
    }

    /**
     * 
     * @param {String | Post} identifier this can either be the link of a post or an instance of the Post Class
     * @returns {PostDetails}
     */
    async getPostDetails(identifier) {
        if(!this.authenticated) throw new IBError(errorMessage.notAuthenticated.code, errorMessage.notAuthenticated.message);

        const postDetails = await this.stack.push(() => actions.getPostDetails(this.page, identifier));
        return postDetails;
    }
    
}

module.exports = InstagramBot;