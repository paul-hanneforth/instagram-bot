// load environment variables
require("dotenv").config();

const InstagramBot = require("../index.js");

describe("testing channels (direct messages)", () => {
    jest.setTimeout(1000 * 60 * 2);

    const headless = true;

    const username = process.env.name;
    const password = process.env.passwd;

    const testingUsername = "mmd";
    const testingMessage = "What's up?";

    test("it should start the bot", async () => {
        bot = await InstagramBot.launch(headless);
    });
    
    test("it should authenticate the bot", async () => {
        await bot.login(username, password);
    });

    test(`it should direct message ${testingUsername} '${testingMessage}'`, async () => {
        await bot.directMessageUser(testingUsername, testingMessage);
    });

    test(`it should get all direct messages from ${testingUsername}`, async () => {
        await bot.getChannelMessages(testingUsername);
    });

    test("it should logout", async () => {
        await bot.logout();
    });

    test("it should close the browser", async () => {
        await bot.close();
    });

});