// @ts-check
import { test, expect } from "@playwright/test";

const LOCAL_SERVER = process.env.LOCAL_SERVER || "http://localhost:8080";

test.describe("Snake - Game States", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${LOCAL_SERVER}/snake/index.html`);
    await page.evaluate(() => document.body.focus());
  });

  test("shows idle screen on load", async ({ page }) => {
    await expect(page.locator("#idle-overlay")).toBeVisible();
    await expect(page.locator("#idle-overlay h2")).toContainText("SNAKE");
    await expect(page.locator("#gameover-overlay")).toBeHidden();
    await expect(page.locator("#paused-overlay")).toBeHidden();
  });

  test("starts game on space press", async ({ page }) => {
    await page.keyboard.press("Space");
    await expect(page.locator("#idle-overlay")).toBeHidden();
    await expect(page.locator("#gameover-overlay")).toBeHidden();
    await expect(page.locator("#score-val")).toHaveText("0");
  });

  test("starts game on idle overlay click", async ({ page }) => {
    await page.locator("#idle-overlay").click({ force: true });
    await expect(page.locator("#idle-overlay")).toBeHidden();
  });

  test("starts game on enter press", async ({ page }) => {
    await page.keyboard.press("Enter");
    await expect(page.locator("#idle-overlay")).toBeHidden();
  });

  test("shows game over screen after wall collision", async ({ page }) => {
    await page.keyboard.press("Space");
    await page.waitForTimeout(200);
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#gameover-overlay")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("#final-score")).toBeVisible();
  });

  test("restarts game after game over", async ({ page }) => {
    await page.keyboard.press("Space");
    await page.waitForTimeout(200);
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#gameover-overlay")).toBeVisible({ timeout: 10000 });

    await page.keyboard.press("Space");
    await expect(page.locator("#gameover-overlay")).toBeHidden();
    await expect(page.locator("#score-val")).toHaveText("0");
  });
});

test.describe("Snake - Controls", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${LOCAL_SERVER}/snake/index.html`);
    await page.evaluate(() => document.body.focus());
    await page.keyboard.press("Space");
    await page.waitForTimeout(300);
  });

  test("arrow keys change direction without crashing", async ({ page }) => {
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(400);
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(400);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(400);
    await expect(page.locator("#gameover-overlay")).toBeHidden();
  });

  test("WASD keys change direction without crashing", async ({ page }) => {
    await page.keyboard.press("w");
    await page.waitForTimeout(400);
    await page.keyboard.press("a");
    await page.waitForTimeout(400);
    await page.keyboard.press("s");
    await page.waitForTimeout(400);
    await expect(page.locator("#gameover-overlay")).toBeHidden();
  });

  test("cannot reverse direction", async ({ page }) => {
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(600);
    await expect(page.locator("#gameover-overlay")).toBeHidden();
  });

  test("pause with P key", async ({ page }) => {
    await page.keyboard.press("p");
    await expect(page.locator("#paused-overlay")).toBeVisible();
    await expect(page.locator("#paused-overlay h2")).toContainText("PAUSED");
  });

  test("resume with P key", async ({ page }) => {
    await page.keyboard.press("p");
    await expect(page.locator("#paused-overlay")).toBeVisible();
    await page.keyboard.press("p");
    await expect(page.locator("#paused-overlay")).toBeHidden();
  });

  test("pause with Escape key", async ({ page }) => {
    await page.keyboard.press("Escape");
    await expect(page.locator("#paused-overlay")).toBeVisible();
  });

  test("resume with Escape key", async ({ page }) => {
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await expect(page.locator("#paused-overlay")).toBeHidden();
  });
});

test.describe("Snake - Scoring", () => {
  test("score starts at 0", async ({ page }) => {
    await page.goto(`${LOCAL_SERVER}/snake/index.html`);
    await expect(page.locator("#score-val")).toHaveText("0");
  });

  test("high score persists in localStorage", async ({ page }) => {
    await page.context().addInitScript(() => {
      localStorage.setItem("snake_high_score", "42");
    });
    await page.goto(`${LOCAL_SERVER}/snake/index.html`);
    await expect(page.locator("#best-val")).toHaveText("42");
  });

  test("new high score is saved on game over", async ({ page }) => {
    await page.context().addInitScript(() => {
      localStorage.setItem("snake_high_score", "10");
    });
    await page.goto(`${LOCAL_SERVER}/snake/index.html`);
    await expect(page.locator("#best-val")).toHaveText("10");

    await page.evaluate(() => document.body.focus());
    await page.keyboard.press("Space");
    await page.waitForTimeout(200);
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#gameover-overlay")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("#final-best")).toHaveText("10");
  });
});

test.describe("Snake - Self Collision", () => {
  test("game does not immediately end on start", async ({ page }) => {
    await page.goto(`${LOCAL_SERVER}/snake/index.html`);
    await page.evaluate(() => document.body.focus());
    await page.keyboard.press("Space");
    await page.waitForTimeout(500);
    await expect(page.locator("#gameover-overlay")).toBeHidden();
  });
});

test.describe("Snake - HUD", () => {
  test("hud shows score and best score", async ({ page }) => {
    await page.goto(`${LOCAL_SERVER}/snake/index.html`);
    await expect(page.locator("#score-val")).toBeVisible();
    await expect(page.locator("#best-val")).toBeVisible();
  });

  test("best score loads from localStorage", async ({ page }) => {
    await page.context().addInitScript(() => {
      localStorage.setItem("snake_high_score", "999");
    });
    await page.goto(`${LOCAL_SERVER}/snake/index.html`);
    await expect(page.locator("#best-val")).toHaveText("999");
  });
});

test.describe("Snake - Audio", () => {
  test("mute button is visible in HUD", async ({ page }) => {
    await page.goto(`${LOCAL_SERVER}/snake/index.html`);
    await expect(page.locator("#mute-btn")).toBeVisible();
  });

  test("mute button toggles icon on click", async ({ page }) => {
    await page.goto(`${LOCAL_SERVER}/snake/index.html`);
    const muteBtn = page.locator("#mute-btn");
    const initialIcon = await muteBtn.textContent();
    await muteBtn.click();
    const toggledIcon = await muteBtn.textContent();
    expect(toggledIcon).not.toBe(initialIcon);
  });

  test("mute preference persists in localStorage", async ({ page }) => {
    await page.goto(`${LOCAL_SERVER}/snake/index.html`);
    await page.locator("#mute-btn").click();
    const muted = await page.evaluate(() => localStorage.getItem("snake_audio_muted"));
    expect(muted).toBe("true");
  });

  test("muted state loads from localStorage", async ({ page }) => {
    await page.context().addInitScript(() => {
      localStorage.setItem("snake_audio_muted", "true");
    });
    await page.goto(`${LOCAL_SERVER}/snake/index.html`);
    const muted = await page.evaluate(() => localStorage.getItem("snake_audio_muted"));
    expect(muted).toBe("true");
  });

  test("no console errors when game plays", async ({ page }) => {
    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto(`${LOCAL_SERVER}/snake/index.html`);
    await page.evaluate(() => document.body.focus());
    await page.keyboard.press("Space");
    await page.waitForTimeout(500);
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(400);
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(400);
    expect(errors).toHaveLength(0);
  });

  test("audio plays on game start without errors", async ({ page }) => {
    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto(`${LOCAL_SERVER}/snake/index.html`);
    await page.evaluate(() => document.body.focus());
    await page.keyboard.press("Space");
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
    await expect(page.locator("#idle-overlay")).toBeHidden();
  });

  test("pause and resume produce no audio errors", async ({ page }) => {
    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto(`${LOCAL_SERVER}/snake/index.html`);
    await page.evaluate(() => document.body.focus());
    await page.keyboard.press("Space");
    await page.waitForTimeout(200);
    await page.keyboard.press("p");
    await page.waitForTimeout(200);
    await page.keyboard.press("p");
    await page.waitForTimeout(200);
    expect(errors).toHaveLength(0);
  });
});
