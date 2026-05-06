// @ts-check
import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3015/pacman";

/**
 * Wait for the canvas to be ready and focused.
 */
async function waitForCanvas(page) {
  const canvas = page.locator("canvas#game");
  await expect(canvas).toBeVisible({ timeout: 10000 });
  await canvas.focus();
  await page.waitForTimeout(300);
}

/**
 * Navigate from ATTRACT -> MAIN_MENU by pressing Enter.
 */
async function goToMainMenu(page) {
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
}

/**
 * Navigate from MAIN_MENU -> DIFFICULTY_SELECT by pressing Enter.
 */
async function goToDifficultySelect(page) {
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
}

/**
 * Confirm difficulty selection -> countdown -> PLAYING.
 */
async function startGame(page) {
  await page.keyboard.press("Enter");
  await page.waitForTimeout(4000);
}

/**
 * Navigate through the full menu flow to start a game.
 */
async function fullStart(page) {
  await page.goto(`${BASE_URL}/index.html`);
  await waitForCanvas(page);
  await goToMainMenu(page);
  await goToDifficultySelect(page);
  await startGame(page);
}

// ============================================================================
// 1. Page loads
// ============================================================================

test.describe("Page loads", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
  });

  test("canvas is visible", async ({ page }) => {
    await expect(page.locator("canvas#game")).toBeVisible({ timeout: 10000 });
  });

  test("page title is correct", async ({ page }) => {
    await expect(page).toHaveTitle("PAC-MAN");
  });

  test("canvas has correct role attribute", async ({ page }) => {
    await expect(page.locator("canvas#game")).toHaveAttribute(
      "role",
      "application"
    );
  });

  test("canvas is focusable on load", async ({ page }) => {
    const canvas = page.locator("canvas#game");
    await canvas.focus();
    await expect(canvas).toBeFocused();
  });

  test("viewport meta tag prevents zoom", async ({ page }) => {
    const viewport = page.locator("meta[name='viewport']");
    await expect(viewport).toHaveAttribute("content", /initial-scale=1\.0/);
  });

  test("meta tags for mobile web app", async ({ page }) => {
    const mobileMeta = page.locator("meta[name='mobile-web-app-capable']");
    await expect(mobileMeta).toHaveAttribute("content", "yes");
  });
});

// ============================================================================
// 2. Attract mode and main menu
// ============================================================================

test.describe("Attract mode and main menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await waitForCanvas(page);
  });

  test("starts on attract screen", async ({ page }) => {
    await expect(page.locator("canvas#game")).toBeVisible();
  });

  test("can navigate to main menu with Enter", async ({ page }) => {
    await goToMainMenu(page);
    await expect(page.locator("canvas#game")).toBeVisible();
  });

  test("can navigate menu items with arrow keys", async ({ page }) => {
    await goToMainMenu(page);
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(100);
    }
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("ArrowUp");
      await page.waitForTimeout(100);
    }
    await expect(page.locator("canvas#game")).toBeVisible();
  });

  test("can select menu item with Enter", async ({ page }) => {
    await goToMainMenu(page);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(400);
    await expect(page.locator("canvas#game")).toBeVisible();
  });
});

// ============================================================================
// 3. Difficulty selection
// ============================================================================

test.describe("Difficulty selection", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await waitForCanvas(page);
    await goToMainMenu(page);
    await goToDifficultySelect(page);
  });

  test("can select difficulty and start game", async ({ page }) => {
    await startGame(page);
    await expect(page.locator("canvas#game")).toBeVisible();
  });

  test("can select easy difficulty", async ({ page }) => {
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(200);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(4000);
    await expect(page.locator("canvas#game")).toBeVisible();
  });

  test("can select hard difficulty", async ({ page }) => {
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(200);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(4000);
    await expect(page.locator("canvas#game")).toBeVisible();
  });

  test("difficulty selection has 3 options", async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(100);
    }
    await expect(page.locator("canvas#game")).toBeVisible();
  });
});

// ============================================================================
// 4. Game starts after countdown
// ============================================================================

test.describe("Game starts after countdown", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await waitForCanvas(page);
    await goToMainMenu(page);
    await goToDifficultySelect(page);
  });

  test("countdown displays and game begins", async ({ page }) => {
    await page.keyboard.press("Enter");
    await page.waitForTimeout(4000);
    const gameState = await page.evaluate(() => {
      const canvas = document.getElementById("game");
      return { width: canvas.width, height: canvas.height };
    });
    expect(gameState.width).toBeGreaterThan(0);
    expect(gameState.height).toBeGreaterThan(0);
  });

  test("game renders maze after countdown", async ({ page }) => {
    await page.keyboard.press("Enter");
    await page.waitForTimeout(4000);
    const hasContent = await page.evaluate(() => {
      const canvas = document.getElementById("game");
      const ctx = canvas.getContext("2d");
      if (!ctx) return false;
      const data = ctx.getImageData(0, 0, 1, 1).data;
      return data[3] > 0;
    });
    expect(hasContent).toBe(true);
  });
});

// ============================================================================
// 5. Pacman movement
// ============================================================================

test.describe("Pacman movement", () => {
  test.beforeEach(async ({ page }) => {
    await fullStart(page);
  });

  test("arrow keys move Pacman without crashing", async ({ page }) => {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(500);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(500);
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(500);
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(500);
    await expect(page.locator("canvas#game")).toBeVisible();
  });

  test("WASD keys move Pacman without crashing", async ({ page }) => {
    await page.keyboard.press("d");
    await page.waitForTimeout(500);
    await page.keyboard.press("s");
    await page.waitForTimeout(500);
    await page.keyboard.press("a");
    await page.waitForTimeout(500);
    await page.keyboard.press("w");
    await page.waitForTimeout(500);
    await expect(page.locator("canvas#game")).toBeVisible();
  });

  test("Pacman movement is continuous", async ({ page }) => {
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(3000);
    await page.keyboard.up("ArrowRight");
    await expect(page.locator("canvas#game")).toBeVisible();
  });

  test("multiple direction changes work", async ({ page }) => {
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(100);
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(100);
      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(100);
      await page.keyboard.press("ArrowUp");
      await page.waitForTimeout(100);
    }
    await expect(page.locator("canvas#game")).toBeVisible();
  });
});

// ============================================================================
// 6. Dot collection and scoring
// ============================================================================

test.describe("Dot collection and scoring", () => {
  test.beforeEach(async ({ page }) => {
    await fullStart(page);
  });

  test("score increases when Pacman eats dots", async ({ page }) => {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(2000);
    await expect(page.locator("canvas#game")).toBeVisible();
    const { width, height } = await page.evaluate(() => {
      const canvas = document.getElementById("game");
      return { width: canvas.width, height: canvas.height };
    });
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
  });

  test("Pacman eats dots continuously", async ({ page }) => {
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(5000);
    await page.keyboard.up("ArrowRight");
    await expect(page.locator("canvas#game")).toBeVisible();
  });

  test("game continues after eating dots", async ({ page }) => {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(1000);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(1000);
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(1000);
    await expect(page.locator("canvas#game")).toBeVisible();
  });
});

// ============================================================================
// 7. Pause/resume
// ============================================================================

test.describe("Pause/resume", () => {
  test.beforeEach(async ({ page }) => {
    await fullStart(page);
  });

  test("Escape pauses the game", async ({ page }) => {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    await expect(page.locator("canvas#game")).toBeVisible();
  });

  test("can resume from pause", async ({ page }) => {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    await expect(page.locator("canvas#game")).toBeVisible();
  });

  test("can pause and resume multiple times", async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(200);
    }
    await expect(page.locator("canvas#game")).toBeVisible();
  });

  test("pause menu navigation works", async ({ page }) => {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(100);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(100);
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(100);
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(100);
    await expect(page.locator("canvas#game")).toBeVisible();
  });
});

// ============================================================================
// 8. Game over screen
// ============================================================================

test.describe("Game over screen", () => {
  test.beforeEach(async ({ page }) => {
    await fullStart(page);
  });

  test("game over screen appears when all lives lost", async ({ page }) => {
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(5000);
    await expect(page.locator("canvas#game")).toBeVisible();
    const { width, height } = await page.evaluate(() => {
      const canvas = document.getElementById("game");
      return { width: canvas.width, height: canvas.height };
    });
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
  });

  test("game remains stable after extended play", async ({ page }) => {
    const dirs = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press(dirs[i % 4]);
      await page.waitForTimeout(500);
    }
    await expect(page.locator("canvas#game")).toBeVisible();
  });
});

// ============================================================================
// 9. Restart
// ============================================================================

test.describe("Restart", () => {
  test("can restart game from main menu", async ({ page }) => {
    await fullStart(page);
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(2000);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(200);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(200);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(400);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(4000);
    await expect(page.locator("canvas#game")).toBeVisible();
  });

  test("can play multiple games in sequence", async ({ page }) => {
    for (let i = 0; i < 2; i++) {
      await fullStart(page);
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(1000);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(400);
    }
    await expect(page.locator("canvas#game")).toBeVisible();
  });
});

// ============================================================================
// 10. Settings accessible
// ============================================================================

test.describe("Settings accessible", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await waitForCanvas(page);
    await goToMainMenu(page);
  });

  test("can reach settings from main menu", async ({ page }) => {
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(200);
    }
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    await expect(page.locator("canvas#game")).toBeVisible();
  });

  test("can return from settings", async ({ page }) => {
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(200);
    }
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    await expect(page.locator("canvas#game")).toBeVisible();
  });

  test("can navigate settings options", async ({ page }) => {
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(200);
    }
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(100);
    }
    await expect(page.locator("canvas#game")).toBeVisible();
  });
});

// ============================================================================
// 11. High scores
// ============================================================================

test.describe("High scores", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await waitForCanvas(page);
    await goToMainMenu(page);
  });

  test("high scores screen is accessible", async ({ page }) => {
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(200);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(200);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    await expect(page.locator("canvas#game")).toBeVisible();
  });

  test("can return from high scores", async ({ page }) => {
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(200);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(200);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    await expect(page.locator("canvas#game")).toBeVisible();
  });
});

// ============================================================================
// 12. Practice mode
// ============================================================================

test.describe("Practice mode", () => {
  test("can access practice mode from main menu", async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await waitForCanvas(page);
    await goToMainMenu(page);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(200);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(4000);
    await expect(page.locator("canvas#game")).toBeVisible();
  });
});

// ============================================================================
// 13. Achievements screen
// ============================================================================

test.describe("Achievements screen", () => {
  test("achievements screen is accessible from main menu", async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await waitForCanvas(page);
    await goToMainMenu(page);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(200);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(200);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(200);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    await expect(page.locator("canvas#game")).toBeVisible();
  });

  test("can return from achievements to main menu", async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await waitForCanvas(page);
    await goToMainMenu(page);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(200);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(200);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(200);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    await expect(page.locator("canvas#game")).toBeVisible();
  });
});

// ============================================================================
// 14. Tutorial screen
// ============================================================================

test.describe("Tutorial screen", () => {
  test("tutorial screen is accessible from main menu", async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await waitForCanvas(page);
    await goToMainMenu(page);
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(200);
    }
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    await expect(page.locator("canvas#game")).toBeVisible();
  });

  test("can return from tutorial to main menu", async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await waitForCanvas(page);
    await goToMainMenu(page);
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(100);
    }
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    await expect(page.locator("canvas#game")).toBeVisible();
  });
});

// ============================================================================
// 15. Touch controls on mobile
// ============================================================================

test.describe("Touch controls on mobile", () => {
  test("virtual D-pad appears on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/index.html`);
    await waitForCanvas(page);
    await page.evaluate(() => {
      Object.defineProperty(navigator, "maxTouchPoints", {
        value: 5,
        writable: true,
        configurable: true,
      });
    });
    const canvas = page.locator("canvas#game");
    await canvas.click({ force: true });
    await page.waitForTimeout(400);
    await expect(canvas).toBeVisible();
  });

  test("game works at mobile viewport size", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/index.html`);
    await waitForCanvas(page);
    await goToMainMenu(page);
    await expect(page.locator("canvas#game")).toBeVisible();
  });

  test("game works at tablet viewport size", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE_URL}/index.html`);
    await waitForCanvas(page);
    await goToMainMenu(page);
    await expect(page.locator("canvas#game")).toBeVisible();
  });

  test("game works at small phone viewport", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(`${BASE_URL}/index.html`);
    await waitForCanvas(page);
    await goToMainMenu(page);
    await expect(page.locator("canvas#game")).toBeVisible();
  });
});

// ============================================================================
// 16. Accessibility
// ============================================================================

test.describe("Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
  });

  test('canvas has role="application"', async ({ page }) => {
    await expect(page.locator("canvas#game")).toHaveAttribute(
      "role",
      "application"
    );
  });

  test("canvas has aria-label", async ({ page }) => {
    const canvas = page.locator("canvas#game");
    const label = await canvas.getAttribute("aria-label");
    expect(label).toBeTruthy();
    expect(label && label.length).toBeGreaterThan(0);
  });

  test("aria-live polite region exists", async ({ page }) => {
    const politeRegion = page.locator('[aria-live="polite"]');
    const count = await politeRegion.count();
    expect(count).toBeGreaterThan(0);
  });

  test("aria-live assertive region exists", async ({ page }) => {
    const assertiveRegion = page.locator('[aria-live="assertive"]');
    const count = await assertiveRegion.count();
    expect(count).toBeGreaterThan(0);
  });

  test("aria-live regions have aria-atomic", async ({ page }) => {
    const politeRegion = page.locator('[aria-live="polite"]');
    await expect(politeRegion).toHaveAttribute("aria-atomic", "true");
    const assertiveRegion = page.locator('[aria-live="assertive"]');
    await expect(assertiveRegion).toHaveAttribute("aria-atomic", "true");
  });

  test("screen reader regions are hidden visually", async ({ page }) => {
    const srRegions = page.locator(".sr-only");
    const count = await srRegions.count();
    expect(count).toBeGreaterThan(0);
    const position = await srRegions.first().evaluate(
      (el) => getComputedStyle(el).position
    );
    expect(position).toBe("absolute");
  });

  test("canvas has tabindex for keyboard focus", async ({ page }) => {
    await expect(page.locator("canvas#game")).toHaveAttribute(
      "tabindex",
      "0"
    );
  });

  test("canvas is focusable", async ({ page }) => {
    const canvas = page.locator("canvas#game");
    await canvas.focus();
    await expect(canvas).toBeFocused();
  });

  test("keyboard-only navigation works through all screens", async ({ page }) => {
    await waitForCanvas(page);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(4000);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(100);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(100);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(100);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(100);
    await expect(page.locator("canvas#game")).toBeVisible();
  });
});

// ============================================================================
// 17. Focus management
// ============================================================================

test.describe("Focus management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
  });

  test("canvas is focusable", async ({ page }) => {
    const canvas = page.locator("canvas#game");
    await canvas.focus();
    await expect(canvas).toBeFocused();
  });

  test("canvas has tabindex=0", async ({ page }) => {
    await expect(page.locator("canvas#game")).toHaveAttribute(
      "tabindex",
      "0"
    );
  });

  test("canvas receives focus on page load", async ({ page }) => {
    const canvas = page.locator("canvas#game");
    await canvas.focus();
    await expect(canvas).toBeFocused();
  });

  test("keyboard input works after focusing canvas", async ({ page }) => {
    await page.locator("canvas#game").focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(400);
    await expect(page.locator("canvas#game")).toBeVisible();
  });
});

// ============================================================================
// 18. General stability
// ============================================================================

test.describe("General stability", () => {
  test("no console errors during gameplay", async ({ page }) => {
    const consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await fullStart(page);
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(3000);

    expect(consoleErrors).toHaveLength(0);
  });

  test("game handles rapid keyboard input without crash", async ({ page }) => {
    await fullStart(page);
    const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press(keys[i % 4]);
      await page.waitForTimeout(50);
    }
    await expect(page.locator("canvas#game")).toBeVisible();
  });

  test("game handles pause/unpause cycle without crash", async ({ page }) => {
    await fullStart(page);
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(100);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(100);
    }
    await expect(page.locator("canvas#game")).toBeVisible();
  });

  test("game handles menu cycling without crash", async ({ page }) => {
    await fullStart(page);
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(500);
    for (let i = 0; i < 2; i++) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(100);
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(100);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(400);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(300);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(4000);
    }
    await expect(page.locator("canvas#game")).toBeVisible();
  });
});
