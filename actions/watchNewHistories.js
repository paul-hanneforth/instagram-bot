const util = require('../util.js');

module.exports.watchNewHistories = async (page) => {
  await util.wait(1000 * 1.5);
  const mainPage = 'https://www.instagram.com';

  if (!page.url() !== mainPage) {
    await page.goto(mainPage);
  }

  try {
    await page.evaluate(async () => {
      const sleep = (time) =>
        new Promise((resolve) => setTimeout(resolve, time));

      await sleep(1000 * 3)

      let histotyButton = document.querySelector('.RR-M-.QN629');
      if (!histotyButton) {
        throw Error('No histotyButton detected');
      }
      histotyButton.click();
      await sleep(1000 * 3);

      let historyOpened = true;

      const nextButton =
        document.querySelector('.coreSpriteRightChevron') ||
        document.querySelector('.NnZaL.vWls4');

      if (nextButton) {
        while (historyOpened) {
          nextButton.click();
          await sleep(1000 * 1.5);

          const historyContainer = document.querySelector('.z6Odz');

          if (!historyContainer) {
            historyOpened = false;
          }
        }
      }
    });
    return { error: false };
  } catch (err) {
    console.log('Watch history error ', err);
    return { error: true };
  }
};
