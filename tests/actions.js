const InstagramBot = require("./../index.js");
const log = require("@paul-hanneforth/log");

const runTest = async (username, password) => {

    // initialize bot
    log("Trying to launch bot ...");
    var bot;
    try {
        bot = await InstagramBot.launch(false);
    } catch(e) {
        log("Failed to launch bot!", log.type.error);
        throw(e);
    }
    log("Successfully launched bot!", log.type.success);

    // login
    log("Trying to login ...");
    try {
        await bot.login(username, password);
    } catch(e) {
        log("Failed to login!", log.type.error);
        throw(e);
    }
    log("Successfully authenticated bot!", log.type.success);

    // follow
    log("Trying to follow user ...");
    try {
        await bot.follow("therock");
    } catch(e) {
        log("Failed to follow user!", log.type.error);
        throw(e);
    }
    log("Successfully followed user!", log.type.success);

    // unfollow
    log("Trying to unfollow user ...");
    try {
        await bot.unfollow("therock");
    } catch(e) {
        log("Failed to unfollow user!", log.type.error);
        throw(e);
    }
    log("Successfully unfollowed user!", log.type.success);

    // like post
    log("Trying to like post ...");
    try {
        await bot.likePost("https://www.instagram.com/p/CPnmAQcF341/");
    } catch(e) {
        log("Failed to like post!", log.type.error);
        throw(e);
    }
    log("Successfully liked post!", log.type.success);

    // unlike post
    log("Trying to unlike post ...");
    try {
        await bot.unlikePost("https://www.instagram.com/p/CPnmAQcF341/");
    } catch(e) {
        log("Failed to unlike post!", log.type.error);
        throw(e);
    }
    log("Successfully unliked post!", log.type.success);

    // comment post
    log("Trying to comment on post ...");
    try {
        await bot.commentPost("https://www.instagram.com/p/CPnmAQcF341/", "This is a comment!");
    } catch(e) {
        log("Failed to comment on post!", log.type.error);
        throw(e);
    }
    log("Successfully commented post!", log.type.success);

    // logout
    log("Trying to logout ...");
    try {
        await bot.logout();
    } catch(e) {
        log("Failed to logout!", log.type.error);
        throw(e);
    }
    log("Successfully logged out!", log.type.success);

    // close
    log("Trying to close browser ...");
    try {
        await bot.close();
    } catch(e) {
        log("Failed to close browser!", log.type.error);
        throw(e);
    }
    log("Successfully closed browser!", log.type.success);

};

module.exports = { runTest };