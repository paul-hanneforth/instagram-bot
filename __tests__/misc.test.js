// load environment variables
require("dotenv").config();

const InstagramBot = require("../index.js");

describe("testing misc functions", () => {
    jest.setTimeout(1000 * 60 * 2);

    const headless = true;

    var bot;

    test("it should start the bot", async () => {
        bot = await InstagramBot.launch(headless);
    });

    test("it should close the browser", async () => {
        await bot.close();
    });

});