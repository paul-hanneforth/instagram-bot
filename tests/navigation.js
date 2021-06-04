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

    // goto
    log("Trying to go to user ...");
    try {
        await bot.goto("therock");
    } catch(e) {
        log("Failed to go to user!", log.type.error);
        throw(e);
    }
    log("Successfully went to user!", log.type.success);

    // search
    log("Trying to search ...");
    try {
        await bot.search("therock");
    } catch(e) {
        log("Failed to search!", log.type.error);
        throw(e);
    }
    log("Sucessfully searched!", log.type.success);

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