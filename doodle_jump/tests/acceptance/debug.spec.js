const { test, expect } = require('@playwright/test');

test('debug game loop running', async ({ page }) => {
  await page.addInitScript(() => {
    window._frames = 0;
    const orig = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = function(cb) {
      return orig(function(...args) {
        window._frames++;
        cb(...args);
      });
    };
  });
  
  await page.goto('/');
  await page.locator('#btn-play').click();
  await page.waitForSelector('#hud', { timeout: 5000 });
  
  const frames1 = await page.evaluate(() => window._frames);
  await page.waitForTimeout(500);
  const frames2 = await page.evaluate(() => window._frames);
  
  console.log(`Frames: ${frames1} -> ${frames2} (delta: ${frames2 - frames1})`);
  
  // Set player below screen
  await page.evaluate(() => { window.player.y = 1000; });
  await page.waitForTimeout(1000);
  
  const gameOver = await page.evaluate(() => {
    return !document.getElementById('game-over').classList.contains('hidden');
  });
  console.log('Game over visible:', gameOver);
});
