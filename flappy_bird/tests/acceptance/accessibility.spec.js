const { test, expect } = require('@playwright/test');

test.describe('Accessibility', () => {
  test('canvas has role="application" attribute', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');

    const role = await page.getAttribute('#game-canvas', 'role');
    expect(role).toBe('application');
  });

  test('canvas has aria-label attribute', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');

    const ariaLabel = await page.getAttribute('#game-canvas', 'aria-label');
    expect(ariaLabel).toBeDefined();
    expect(ariaLabel.length).toBeGreaterThan(0);
  });

  test('canvas has tabindex="0" attribute', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');

    const tabIndex = await page.getAttribute('#game-canvas', 'tabindex');
    expect(tabIndex).toBe('0');
  });

  test('aria-live polite region exists', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');

    const politeRegion = page.locator('[aria-live="polite"]');
    await expect(politeRegion).toHaveCount(1);
  });

  test('aria-live assertive region exists', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');

    const assertiveRegion = page.locator('[aria-live="assertive"]');
    await expect(assertiveRegion).toHaveCount(1);
  });

  test('canvas is focusable via Tab', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');

    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? { id: el.id, tagName: el.tagName } : null;
    });

    expect(focusedElement.id).toBe('game-canvas');
    expect(focusedElement.tagName.toLowerCase()).toBe('canvas');
  });

  test('back link meets 44px minimum touch target', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');

    const dimensions = await page.locator('#back-link a').boundingBox();
    expect(dimensions.width).toBeGreaterThanOrEqual(44);
    expect(dimensions.height).toBeGreaterThanOrEqual(44);
  });

  test('back link has visible focus styles', async ({ page }) => {
    await page.goto('/flappy_bird/index.html');

    const backLink = page.locator('#back-link a');

    await backLink.focus();

    const outlineStyle = await backLink.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        outlineStyle: styles.outlineStyle,
        outlineColor: styles.outlineColor,
        outlineWidth: styles.outlineWidth,
      };
    });

    expect(outlineStyle.outlineStyle).not.toBe('none');
    expect(outlineStyle.outlineWidth).not.toBe('0px');
  });
});
