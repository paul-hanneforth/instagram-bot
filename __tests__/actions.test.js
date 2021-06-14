// load environment variables
require("dotenv").config();

const InstagramBot = require("../index.js");

describe("testing actions", () => {
    jest.setTimeout(1000 * 60 * 2);

    const username = process.env.name;
    const password = process.env.passwd;

    const testingUsername = "therock";
    const testingPost = "https://www.instagram.com/p/CPnmAQcF341/";

    var bot;

    test("it should start the bot", async () => {
        bot = await InstagramBot.launch(false);
    });
    
    test("it should authenticate the bot", async () => {
        await bot.login(username, password);
    });

    test(`it should follow @${testingUsername}`, async () => {
        await bot.follow(testingUsername);
    });

    test(`it should unfollow @${testingUsername}`, async () => {
        await bot.unfollow(testingUsername);
    });

    test("it should like a post", async () => {
        await bot.likePost(testingPost);
    });

    test("it should unlike a post", async () => {
        await bot.unlikePost(testingPost);
    });

    test("it should comment on a post", async () => {
        await bot.commentPost(testingPost, "This is a comment!");
    });

    test("it should logout", async () => {
        await bot.logout();
    });

    test("it should close the browser", async () => {
        await bot.close();
    });

});