const { SearchResult, User, UserDetails, Post, PostDetails } = require("./types.js");

class FollowingList {

    /**
     * @constructor
     * @param {User} user 
     * @param {User[]} following 
     * @property {User} user
     * @property {User[]} following
     */
    constructor(user, following) {
        this.user = user;
        this.following = following;
    }

}
class FollowerList {

    /**
     * @constructor
     * @param {User} user 
     * @param {User[]} follower 
     * @property {User} user
     * @property {User[]} follower
     */
    constructor(user, follower) {
        this.user = user;
        this.follower = follower;
    }

}

class Cache {

    /**
     * @constructor
     * @param {FollowingList[]} followingLists 
     * @param {FollowerList[]} followerLists 
     * @property {FollowingList[]} [ followingLists = [] ]
     * @property {FollowerList[]} [ followerLists = [] ]
     */
    constructor(followingLists, followerLists) {
        this.followingLists = followingLists ? followingLists : [];
        this.followerLists = followerLists ? followerLists : [];
    }

    /**
     * 
     * @returns {Cache} empty cache
     */
    static empty() {
        return new Cache([], []);
    }

    /**
     * 
     * @param {User} user 
     * @param {User[]} following 
     * @returns {Cache}
     */
    addFollowingList(user, following) {
        const newFollowingLists = this.followingLists.concat(new FollowingList(user, following));
        const newCache = new Cache(newFollowingLists, this.followerLists);
        return newCache;
    }

    /**
     * 
     * @param {User} user 
     * @param {User[]} followers 
     * @returns {Cache}
     */
    addFollowerList(user, followers) {
        const newFollowerLists = this.followerLists.concat(new FollowerList(user, followers));
        return new Cache(this.followingLists, newFollowerLists);
    }

    /**
     * 
     * @param {User} user 
     * @returns {User[]} list of people who the specified user follows
     */
    findFollowingList(user) {
        const selectedFollowingList = this.followingLists.find(followingList => followingList.user.username === user.username);
        return selectedFollowingList ? selectedFollowingList.following : [];
    }

    /**
     * 
     * @param {User} user 
     * @returns {User[]} list of people who the specified user follows
     */
    findFollowerList(user) {
        const selectedFollowerList = this.followerLists.find(followerList => followerList.user.username === user.username);
        return selectedFollowerList ? selectedFollowerList.follower : [];
    }

}

module.exports = { Cache };