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

    // try to get cookies
    log("Trying to get cookies ...");
    try {
        await bot.getCookies();
    } catch(e) {
        log("Failed to get cookies!", log.type.error);
        throw(e);
    }
    log("Successfully got cookies!", log.type.success);

    // get following
    log("Trying to get following ...");
    try {
        await bot.getFollowing("therock");
    } catch(e) {
        log("Failed to get following!", log.type.error);
        throw(e);
    }
    log("Successfully got following!", log.type.success);

    // get follower
    log("Trying to get follower ...");
    try {
        await bot.getFollower("therock");
    } catch(e) {
        log("Failed to get follower!", log.type.error);
        throw(e);
    }
    log("Successfully got follower!", log.type.success);

    // isFollowing
    log("Check if you're following a user ...");
    try {
        await bot.isFollowing("therock");
    } catch(e) {
        log("Failed to check if you're following a user!", log.type.error);
        throw(e);
    }
    log("Successfully checked if you're following a user!", log.type.success);

    // get user details
    log("Trying to get user details ...");
    try {
        await bot.getUserDetails("therock");
    } catch(e) {
        log("Failed to get user details!", log.type.error);
        throw(e);
    }
    log("Successfully got user details!", log.type.success);

    // get user posts
    log("Trying to get user posts ...");
    try {
        await bot.getPosts("therock");
    } catch(e) {
        log("Failed to get user posts!", log.type.error);
        throw(e);
    }
    log("Successfully got user posts!", log.type.success);

    // get post details
    log("Trying to get post details ...");
    try {
        await bot.getPostDetails("https://www.instagram.com/p/CPnmAQcF341/");
    } catch(e) {
        log("Failed to get post details!", log.type.error);
        throw(e);
    }
    log("Successfully got post details!", log.type.success);

    // get post comments
    log("Trying to get post comments ...");
    try {
        await bot.getPostComments("https://www.instagram.com/p/CPnmAQcF341/");
    } catch(e) {
        log("Failed to get post comments!", log.type.error);
        throw(e);
    }
    log("Successfully got post comments!", log.type.success);

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