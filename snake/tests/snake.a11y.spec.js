// @ts-check
import { test, expect } from "@playwright/test";

const LOCAL_SERVER = process.env.LOCAL_SERVER || "http://localhost:8080";

test.describe("Snake - Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${LOCAL_SERVER}/snake/index.html`);
  });

  test("canvas has role=application", async ({ page }) => {
    await expect(page.locator("#game-canvas")).toHaveAttribute("role", "application");
  });

  test("canvas has aria-label", async ({ page }) => {
    const canvas = page.locator("#game-canvas");
    const label = await canvas.getAttribute("aria-label");
    expect(label).toBeTruthy();
    expect(label && label.length).toBeGreaterThan(0);
  });

  test("canvas has tabindex=0", async ({ page }) => {
    await expect(page.locator("#game-canvas")).toHaveAttribute("tabindex", "0");
  });

  test("aria-live polite region exists", async ({ page }) => {
    const politeRegion = page.locator('[aria-live="polite"]');
    await expect(politeRegion).toBeTruthy();
    const count = await politeRegion.count();
    expect(count).toBeGreaterThan(0);
  });

  test("aria-live assertive region exists", async ({ page }) => {
    const assertiveRegion = page.locator('[aria-live="assertive"]');
    await expect(assertiveRegion).toBeTruthy();
    const count = await assertiveRegion.count();
    expect(count).toBeGreaterThan(0);
  });

  test("idle overlay has role=dialog", async ({ page }) => {
    await expect(page.locator("#idle-overlay")).toHaveAttribute("role", "dialog");
  });

  test("paused overlay has role=dialog", async ({ page }) => {
    await page.evaluate(() => document.body.focus());
    await page.keyboard.press("Space");
    await page.waitForTimeout(200);
    await page.keyboard.press("p");
    await expect(page.locator("#paused-overlay")).toBeVisible();
    await expect(page.locator("#paused-overlay")).toHaveAttribute("role", "dialog");
  });

  test("gameover overlay has role=dialog", async ({ page }) => {
    await page.evaluate(() => document.body.focus());
    await page.keyboard.press("Space");
    await page.waitForTimeout(200);
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#gameover-overlay")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("#gameover-overlay")).toHaveAttribute("role", "dialog");
  });

  test("mute button has aria-label", async ({ page }) => {
    const muteBtn = page.locator("#mute-btn");
    const label = await muteBtn.getAttribute("aria-label");
    expect(label).toBeTruthy();
    expect(label && label.length).toBeGreaterThan(0);
  });

  test("dpad buttons have aria-label attributes", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${LOCAL_SERVER}/snake/index.html`);

    const dpadButtons = [
      { id: "#dpad-up", expected: "Move up" },
      { id: "#dpad-down", expected: "Move down" },
      { id: "#dpad-left", expected: "Move left" },
      { id: "#dpad-right", expected: "Move right" },
    ];

    for (const { id, expected } of dpadButtons) {
      const btn = page.locator(id);
      await expect(btn).toBeVisible();
      const label = await btn.getAttribute("aria-label");
      expect(label).toBe(expected);
    }
  });

  test("canvas is focusable", async ({ page }) => {
    const canvas = page.locator("#game-canvas");
    await canvas.focus();
    await expect(canvas).toBeFocused();
  });

  test("mute button is focusable", async ({ page }) => {
    const muteBtn = page.locator("#mute-btn");
    await muteBtn.focus();
    await expect(muteBtn).toBeFocused();
  });

  test("pause button has aria-label on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${LOCAL_SERVER}/snake/index.html`);
    const pauseBtn = page.locator("#pause-btn");
    await expect(pauseBtn).toBeVisible();
    const label = await pauseBtn.getAttribute("aria-label");
    expect(label).toBeTruthy();
    expect(label && label.length).toBeGreaterThan(0);
  });
});
