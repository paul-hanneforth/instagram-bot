const util = require('../util.js');

module.exports.watchNewHistories = async (page, maxWatches = 10) => {
  await util.wait(1000 * 1.5);
  const mainPage = 'https://www.instagram.com';

  if (!page.url() !== mainPage) {
    await page.goto(mainPage);
  }

  try {
    const watchedHistories = await page.evaluate(
      async ({ maxWatches }) => {
        const sleep = (time) =>
          new Promise((resolve) => setTimeout(resolve, time));

        await sleep(1000 * 3);

        let histotyButton = document.querySelector('.RR-M-.QN629');
        if (!histotyButton) {
          throw Error('No histotyButton detected');
        }
        histotyButton.click();
        await sleep(1000 * 3);

        let historyOpened = true;
        let watchedHistories = 1;

        const nextButton =
          document.querySelector('.coreSpriteRightChevron') ||
          document.querySelector('.NnZaL.vWls4');

        if (nextButton) {
          while (historyOpened) {
            watchedHistories++;
            nextButton.click();
            await sleep(1000 * 1.5);

            const historyContainer = document.querySelector('.z6Odz');

            if (!historyContainer || watchedHistories >= maxWatches) {
              historyOpened = false;
            }
          }

          const closeButton = document.querySelector('.K_10X>.wpO6b')
          closeButton?.click()
        }
        return watchedHistories;
      },
      { maxWatches },
    );
    return { error: false, watchedHistories };
  } catch (err) {
    console.log('Watch history error ', err);
    return { error: true };
  }
};
