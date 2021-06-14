// load environment variables
require("dotenv").config();

const InstagramBot = require("../index.js");

describe("testing data fetching", () => {
    jest.setTimeout(1000 * 60 * 2);

    const headless = true;

    const username = process.env.name;
    const password = process.env.passwd;

    const testingUsername = "therock";
    const testingPost = "https://www.instagram.com/p/CPnmAQcF341/";

    var bot;

    test("it should start the bot", async () => {
        bot = await InstagramBot.launch(headless);
    });

    test("it should authenticate the bot", async () => {
        await bot.login(username, password);
    });

    test("it should get cookies", async () => {
        await bot.getCookies();
    });

    test(`it should get following of @${testingUsername}`, async () => {
        await bot.getFollowing(testingUsername);
    });

    test(`it should get follower of @${testingUsername}`, async () => {
        await bot.getFollower(testingUsername);
    });

    test(`it should check if you're following @${testingUsername}`, async () => {
        await bot.isFollowing(testingUsername);
    });

    test(`it should get user details of @${testingUsername}`, async () => {
        await bot.getUserDetails(testingUsername);
    });

    test(`it should get posts of @${testingUsername}`, async () => {
        await bot.getPosts(testingUsername);
    });

    test("it should get details of post", async () => {
        await bot.getPostDetails(testingPost);
    });

    test("it should get comments of post", async () => {
        await bot.getPostComments(testingPost);
    });

    test("it should logout", async () => {
        await bot.logout();
    });

    test("it should close the browser", async () => {
        await bot.close();
    });

});