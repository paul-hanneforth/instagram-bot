class SearchResult {

    /**
     * 
     * @param {String} link 
     * @param {String} title 
     * @param {String} description 
     * @param {Boolean} isHashtag 
     * @property {String} link
     * @property {String} title
     * @property {String} description
     * @property {Boolean} isHashtag
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
     * @param {String} [ description ] 
     * @property {String} link
     * @property {String} username
     * @property {String} [ description ]
     */
    constructor(link, username, description) {
        this.link = link;
        this.username = username;
        this.description = description;
    }

}
class UserDetails extends User {

    /**
     * @augments User
     * @param {String} link 
     * @param {String} username 
     * @param {String} description 
     * @param {Number} posts 
     * @param {Number} followers 
     * @param {Number} following 
     * @property {String} link
     * @property {String} username
     * @property {String} description
     * @property {Number} posts
     * @property {Number} followers
     * @property {Number} following
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
     * @property {String} link
     */
    constructor(link) {
        this.link = link;
    }

}
class PostDetails extends Post {

    /**
     * @augments Post 
     * @param {String} link 
     * @param {User} author 
     * @param {Number} [ likes ]
     * @property {String} link
     * @property {User} author
     * @property {Number} [ likes ]
     */
    constructor(link, author, likes) {
        super(link);

        this.author = author;
        this.likes = likes;
    }

}

class Comment {

    /**
     * 
     * @param {String} text 
     * @param {User} author 
     * @param {Post} post
     * @property {String} text
     * @property {User} author
     * @property {Post} post 
     */
    constructor(text, author, post) {
        this.text = text;
        this.author = author;
        this.post = post;
    }

}

class DirectMessage {

    /**
     * 
     * @param {String} text 
     * @param {Boolean} sentByUser 
     * @property {String} text
     * @property {Boolean} sentByUser
     */
    constructor(text, sentByUser) {
        this.text = text;
        this.sentByUser = sentByUser;
    }

}

module.exports = {
    SearchResult,
    User,
    UserDetails,
    Post,
    PostDetails,
    Comment,
    DirectMessage
};