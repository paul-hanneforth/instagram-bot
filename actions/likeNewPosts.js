const tools = require('../tools.js');
const util = require('../util.js');

module.exports.likeNewPosts = async (page, maxLength = 10) => {
  await util.wait(1000 * 1.5);
  const mainPage = 'https://www.instagram.com';

  if (!page.url() !== mainPage) {
    await page.goto(mainPage);
  }

  try {
    const pressedLikes = await page.evaluate(
      async ({ maxLength }) => {
        const sleep = (time) =>
          new Promise((resolve) => setTimeout(resolve, time));

        await sleep(1000 * 3);

        let continueLikes = true;
        let pressedLikes = 0;

        while (continueLikes) {
          document.scrollingElement.scrollBy(0, 2400);
          const likeButtons = [
            ...document.querySelectorAll('.fr66n>button'),
          ].filter((button) => button.querySelector('svg[fill="#262626"]'));

          if (!likeButtons.length || pressedLikes >= maxLength) {
            continueLikes = false;
          }

          for (let index = 0; index < likeButtons.length; index++) {
            await sleep(1000 * 3);
            likeButtons[index]?.click();
            pressedLikes++;
          }
        }

        return pressedLikes;
      },
      { maxLength },
    );
    return { error: false, pressedLikes };
  } catch (err) {
    console.log('likeNewPosts error ', err);
    return { error: true };
  }
};
