const InstagramBot = require("@paul-hanneforth/instagram-bot");

(async () => {

    // launch bot
    const bot = await InstagramBot.launch(false);

    // login
    await bot.login("your-username", "your-password");

    // search for searchTerm
    const searchResults = await bot.search("therock");

    // get details of user
    const userDetails = await bot.getUserDetails(searchResults[0]);

    // follow first result
    await bot.follow(searchResults[0]);

    // unfollow
    await bot.unfollow(searchResults[0]);

    // get followers
    const followers = await bot.getFollower(searchResults[0]);

    // get following
    const following = await bot.getFollowing(searchResults[0]);

    // get posts
    const posts = await bot.getPosts(searchResults[0]);

    // like first post
    await bot.likePost(posts[0]);

    // unlike first post
    await bot.unlikePost(posts[0]);

    // comment on post
    await bot.commentPost(posts[0], "paul hanneforth's instagram-bot is awesome!");

    // get post comments
    const comments = await bot.getPostComments(posts[0]);

    // get post details
    const postDetails = await bot.getPostDetails(posts[0]);

    console.log(userDetails, followers, following, comments, postDetails);

})();