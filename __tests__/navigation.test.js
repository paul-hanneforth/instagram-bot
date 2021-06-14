// load environment variables
require("dotenv").config();

const InstagramBot = require("../index.js");

describe("testing navigation functions", () => {
    jest.setTimeout(1000 * 60 * 2);

    const headless = true;

    const username = process.env.name;
    const password = process.env.passwd;

    const testingUsername = "therock";
    const testingSearchTerm = "therock";

    var bot;

    test("it should start the bot", async () => {
        bot = await InstagramBot.launch(headless);
    });

    test("it should authenticate the bot", async () => {
        await bot.login(username, password);
    });

    test(`it should goto @${testingUsername}`, async () => {
        await bot.goto(testingUsername);
    });

    test(`it should search for ${testingSearchTerm}`, async () => {
        await bot.search(testingSearchTerm);
    });

    test("it should logout", async () => {
        await bot.logout();
    });

    test("it should close the browser", async () => {
        await bot.close();
    });

});