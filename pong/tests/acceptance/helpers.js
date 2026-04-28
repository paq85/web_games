// Helper functions shared across pong acceptance tests

/**
 * Dispatch a keydown event with a specific code value.
 * The game's input system checks e.code, not e.key.
 * @param {import('@playwright/test').Page} page
 * @param {string} code - e.g. 'KeyW', 'KeyS', 'ArrowUp', 'ArrowDown'
 */
async function dispatchKeyDown(page, code) {
  await page.evaluate((c) => {
    const event = new KeyboardEvent('keydown', { code: c, key: c, bubbles: true, cancelable: true });
    window.dispatchEvent(event);
  }, code);
}

/**
 * Dispatch a keyup event with a specific code value.
 * @param {import('@playwright/test').Page} page
 * @param {string} code
 */
async function dispatchKeyUp(page, code) {
  await page.evaluate((c) => {
    const event = new KeyboardEvent('keyup', { code: c, key: c, bubbles: true, cancelable: true });
    window.dispatchEvent(event);
  }, code);
}

/**
 * Wait for the Game module to be initialized on window.
 * @param {import('@playwright/test').Page} page
 */
async function waitForGameReady(page, timeout = 5000) {
  await page.waitForFunction(
    () => window.Game && typeof window.Game.getScreen === 'function',
    {},
    { timeout }
  );
}

/**
 * Wait until the game reaches a specific screen state.
 * @param {import('@playwright/test').Page} page
 * @param {string} expectedScreen - screen key from C.SCREENS
 * @param {number} timeout
 */
async function waitForScreen(page, expectedScreen, timeout = 5000) {
  await waitForGameReady(page, timeout);
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
 * Get current settings from the browser.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<object>}
 */
async function getSettings(page) {
  return page.evaluate(() => {
    const s = window.Game && window.Game.getSettings();
    return s ? JSON.parse(JSON.stringify(s)) : null;
  });
}

/**
 * Wait for N game frames to pass.
 * @param {import('@playwright/test').Page} page
 * @param {number} frames
 */
async function waitFrames(page, frames = 10) {
  await page.waitForTimeout(frames * 20);
}

/**
 * Navigate up in the current menu.
 * @param {import('@playwright/test').Page} page
 */
async function menuUp(page) {
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(50);
}

/**
 * Navigate down in the current menu.
 * @param {import('@playwright/test').Page} page
 */
async function menuDown(page) {
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(50);
}

/**
 * Confirm the current menu selection.
 * @param {import('@playwright/test').Page} page
 */
async function menuConfirm(page) {
  await page.keyboard.press('Enter');
  await page.waitForTimeout(50);
}

/**
 * Go from page load (attract screen) to main menu.
 * @param {import('@playwright/test').Page} page
 */
async function goToMainMenu(page) {
  await page.keyboard.press('Enter');
  await waitForScreen(page, 'main_menu');
}

/**
 * Start a 2-player match from the main menu.
 * @param {import('@playwright/test').Page} page
 */
async function start2PMatch(page) {
  await menuConfirm(page);
  await waitForScreen(page, 'mode_select');
  await menuConfirm(page);
  await waitForScreen(page, 'countdown');
}

/**
 * Navigate to VS AI mode and select a difficulty, then start.
 * @param {import('@playwright/test').Page} page
 * @param {number} difficultyIndex - 0=easy, 1=medium, 2=hard, 3=impossible
 */
async function startAIMatch(page, difficultyIndex = 1) {
  await menuConfirm(page);
  await waitForScreen(page, 'mode_select');
  await menuDown(page);
  await menuConfirm(page);
  await waitForScreen(page, 'difficulty_select');
  for (let i = 0; i < difficultyIndex; i++) {
    await menuDown(page);
  }
  await menuConfirm(page);
  await waitForScreen(page, 'countdown');
}

/**
 * Move player 1 paddle up for a number of frames.
 * @param {import('@playwright/test').Page} page
 * @param {number} frames
 */
async function p1UpFor(page, frames = 5) {
  await dispatchKeyDown(page, 'KeyW');
  await waitFrames(page, frames);
  await dispatchKeyUp(page, 'KeyW');
}

/**
 * Move player 1 paddle down for a number of frames.
 * @param {import('@playwright/test').Page} page
 * @param {number} frames
 */
async function p1DownFor(page, frames = 5) {
  await dispatchKeyDown(page, 'KeyS');
  await waitFrames(page, frames);
  await dispatchKeyUp(page, 'KeyS');
}

/**
 * Move player 2 paddle up for a number of frames.
 * @param {import('@playwright/test').Page} page
 * @param {number} frames
 */
async function p2UpFor(page, frames = 5) {
  await dispatchKeyDown(page, 'ArrowUp');
  await waitFrames(page, frames);
  await dispatchKeyUp(page, 'ArrowUp');
}

/**
 * Move player 2 paddle down for a number of frames.
 * @param {import('@playwright/test').Page} page
 * @param {number} frames
 */
async function p2DownFor(page, frames = 5) {
  await dispatchKeyDown(page, 'ArrowDown');
  await waitFrames(page, frames);
  await dispatchKeyUp(page, 'ArrowDown');
}

module.exports = {
  dispatchKeyDown,
  dispatchKeyUp,
  waitForGameReady,
  waitForScreen,
  getGameState,
  getScreen,
  getSettings,
  waitFrames,
  menuUp,
  menuDown,
  menuConfirm,
  goToMainMenu,
  start2PMatch,
  startAIMatch,
  p1UpFor,
  p1DownFor,
  p2UpFor,
  p2DownFor,
};
