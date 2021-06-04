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