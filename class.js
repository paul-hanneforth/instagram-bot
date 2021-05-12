class SearchResult {

    /**
     * 
     * @param {String} link 
     * @param {String} title 
     * @param {String} description 
     * @param {Boolean} isHashtag 
     */
    constructor(link, title, description, isHashtag) {
        this.link = link;
        this.title = title;
        this.description = description;
        this.isHashtag = isHashtag;
    }

}
class User {

    /**
     * 
     * @param {String} link 
     * @param {String} username 
     * @param {String} description 
     */
    constructor(link, username, description) {
        this.link = link;
        this.username = username;
        this.description = description;
    }

}
class UserDetails extends User {

    /**
     * 
     * @param {String} link 
     * @param {String} username 
     * @param {String} description 
     * @param {Number} posts 
     * @param {Number} followers 
     * @param {Number} following 
     */
    constructor(link, username, description, posts, followers, following) {
        super(link, username, description);

        this.posts = posts;
        this.followers = followers;
        this.following = following;
    }

}
class Post {

    /**
     * 
     * @param {String} link
     */
    constructor(link) {
        this.link = link;
    }

}
class PostDetails extends Post {

    /**
     * 
     * @param {String} link 
     * @param {User} author 
     */
    constructor(link, author) {
        super(link);

        this.author = author;
    }

}

module.exports = {
    SearchResult,
    User,
    UserDetails,
    Post,
    PostDetails
};