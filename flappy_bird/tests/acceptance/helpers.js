// Helper functions shared across acceptance tests

/**
 * Wait until the game reaches a specific screen state.
 * @param {import('@playwright/test').Page} page
 * @param {string} expectedScreen - 'start', 'playing', 'game_over'
 * @param {number} timeout
 */
async function waitForScreen(page, expectedScreen, timeout = 5000) {
  await page.waitForFunction(
    (screen) => window.Game && window.Game.getScreen() === screen,
    expectedScreen,
    { timeout }
  );
}

/**
 * Get the current game state from the browser.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<object>}
 */
async function getGameState(page) {
  return page.evaluate(() => {
    const state = window.Game && window.Game.getGameState();
    return state ? JSON.parse(JSON.stringify(state)) : null;
  });
}

/**
 * Get the current screen.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string>}
 */
async function getScreen(page) {
  return page.evaluate(() => window.Game && window.Game.getScreen() || 'unknown');
}

/**
 * Simulate a flap via keyboard.
 * @param {import('@playwright/test').Page} page
 */
async function flapKeyboard(page) {
  await page.keyboard.press('Space');
}

/**
 * Simulate a flap via canvas click.
 * @param {import('@playwright/test').Page} page
 */
async function flapClick(page) {
  const canvas = page.locator('#game-canvas');
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
}

/**
 * Wait for N game frames to pass.
 * @param {import('@playwright/test').Page} page
 * @param {number} frames
 */
async function waitFrames(page, frames = 10) {
  // Each frame is ~16ms at 60fps, add some buffer
  await page.waitForTimeout(frames * 20);
}

/**
 * Run the game for a duration and optionally flap periodically.
 * @param {import('@playwright/test').Page} page
 * @param {object} options
 */
async function playFor(page, options = {}) {
  const { duration = 2000, flapInterval = 500 } = options;
  const start = Date.now();
  while (Date.now() - start < duration) {
    const screen = await getScreen(page);
    if (screen === 'game_over') break;
    if (flapInterval && Math.random() < 0.3) {
      await flapKeyboard(page);
    }
    await waitFrames(page, 5);
  }
}

module.exports = {
  waitForScreen,
  getGameState,
  getScreen,
  flapKeyboard,
  flapClick,
  waitFrames,
  playFor,
};
