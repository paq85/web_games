// @ts-check
import { test, expect } from "@playwright/test";

const LOCAL_SERVER = process.env.LOCAL_SERVER || "http://localhost:8080";

test.describe("Snake - Mobile Viewport", () => {
  test("dpad is visible on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${LOCAL_SERVER}/snake/index.html`);
    await expect(page.locator("#dpad")).toBeVisible();
    await expect(page.locator("#dpad-up")).toBeVisible();
    await expect(page.locator("#dpad-down")).toBeVisible();
    await expect(page.locator("#dpad-left")).toBeVisible();
    await expect(page.locator("#dpad-right")).toBeVisible();
  });

  test("pause button is visible on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${LOCAL_SERVER}/snake/index.html`);
    await expect(page.locator("#pause-btn")).toBeVisible();
  });

  test("dpad is hidden on desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`${LOCAL_SERVER}/snake/index.html`);
    await expect(page.locator("#dpad")).not.toBeVisible();
    await expect(page.locator("#pause-btn")).not.toBeVisible();
  });

  test("canvas is responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${LOCAL_SERVER}/snake/index.html`);
    const canvas = page.locator("#game-canvas");
    const boundingBox = await canvas.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox?.width).toBeGreaterThan(0);
    expect(boundingBox?.height).toBeGreaterThan(0);
    if (boundingBox) {
      const ratio = boundingBox.width / boundingBox.height;
      expect(ratio).toBeGreaterThan(0.8);
      expect(ratio).toBeLessThan(1.2);
    }
  });

  test("click on idle overlay starts game on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${LOCAL_SERVER}/snake/index.html`);
    await page.locator("#idle-overlay").click({ force: true });
    await expect(page.locator("#idle-overlay")).toBeHidden();
  });

  test("mouse swipe changes direction on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${LOCAL_SERVER}/snake/index.html`);
    await page.locator("#idle-overlay").click({ force: true });
    await page.waitForTimeout(300);

    const canvas = page.locator("#game-canvas");
    const box = await canvas.boundingBox();
    if (box) {
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.mouse.move(cx, cy - 50);
      await page.mouse.up();
    }

    await page.waitForTimeout(500);
    await expect(page.locator("#gameover-overlay")).toBeHidden();
  });

  test("dpad buttons steer the snake", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${LOCAL_SERVER}/snake/index.html`);

    await page.locator("#idle-overlay").click({ force: true });
    await page.waitForTimeout(300);

    await page.locator("#dpad-up").click();
    await page.waitForTimeout(400);
    await page.locator("#dpad-left").click();
    await page.waitForTimeout(400);
    await page.locator("#dpad-down").click();
    await page.waitForTimeout(400);

    await expect(page.locator("#gameover-overlay")).toBeHidden();
  });

  test("pause button toggles pause on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${LOCAL_SERVER}/snake/index.html`);
    await page.locator("#idle-overlay").click({ force: true });
    await page.waitForTimeout(200);

    await page.locator("#pause-btn").click();
    await expect(page.locator("#paused-overlay")).toBeVisible();

    await page.locator("#pause-btn").click();
    await expect(page.locator("#paused-overlay")).toBeHidden();
  });
});

test.describe("Snake - Various Viewports", () => {
  const viewports = [
    { width: 320, height: 568, label: "small phone" },
    { width: 414, height: 896, label: "large phone" },
    { width: 768, height: 1024, label: "tablet" },
    { width: 1024, height: 768, label: "small laptop" },
    { width: 1920, height: 1080, label: "desktop" },
  ];

  for (const { width, height, label } of viewports) {
    test(`renders correctly on ${label} (${width}x${height})`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto(`${LOCAL_SERVER}/snake/index.html`);

      const canvas = page.locator("#game-canvas");
      await expect(canvas).toBeVisible();

      const box = await canvas.boundingBox();
      expect(box).not.toBeNull();
      expect(box?.width).toBeGreaterThan(50);
      expect(box?.height).toBeGreaterThan(50);
    });
  }
});
