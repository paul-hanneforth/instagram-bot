# Instagram Bot
## Notices
If you catch any errors feel free to write a mail `paul.hanneforth.o@gmail.com` or create an issue on GitHub.

## Installation
Install `@paul-hanneforth/instagram-bot` via NPM
```sh
npm install @paul-hanneforth/instagram-bot
```

## Examples
This example lists out all the current features of the bot.
```js
const instagramBot = require("@paul-hanneforth/instagram-bot");

// async wrapper
(async () => {

const bot = await instagramBot.launchBot({ headless: false });

// login
await bot.login("[your-username]", "[your-password]");

// search
const searchResult = await bot.search("therock");
const hashtag = await bot.exploreHashtag("#therock");

// profile
const profile = await bot.getProfile("hanne.3210");
const following = await profile.getFollowing();
const follower = await profile.getFollower();
const posts = await profile.getPosts();
await profile.follow();
await profile.unfollow();

// post
const post = await bot.getPost("https://www.instagram.com/p/CEnF7CGlfxv/");
const comments = await post.getComments();
await post.like();
await post.unlike();
await post.comment("paul-hanneforth's instagram-bot is awesome!");

})();
```

## Troubleshooting
If you have problems running `instagram-bot` or more specifically puppeteer, you can use docker to run your bot in a verified environment.
To do that simply create a new directory, save your code in a file named `test.js`, copy over the `Dockerfile` file from the repo, install all the dependencies via `npm` and then run
```sh
docker build -t instagram-bot .
```
The first time you run this command can take a while ...
When it's finished you can run
```sh
docker run instagram-bot
```
to start the bot.