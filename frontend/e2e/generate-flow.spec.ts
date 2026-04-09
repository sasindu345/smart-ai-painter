import { expect, test } from "@playwright/test";

const MOCK_GENERATION_RESPONSE = {
  // 1x1 transparent PNG, base64 encoded
  image_base64:
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgAAIAAAUAAen63NgAAAAASUVORK5CYII=",
  generation_id: "e2e-test-id",
  mode: "mock",
  provider: "mock",
};

test.describe("End-to-end generate flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/generate*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_GENERATION_RESPONSE),
      });
    });

    await page.addInitScript(() => {
      window.localStorage.setItem(
        "smart-ai-painter:onboarding-dismissed",
        "1",
      );
    });
  });

  test("home page links to canvas workspace", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /draw with the full canvas/i }),
    ).toBeVisible();
    await page.getByRole("link", { name: /open canvas workspace/i }).click();
    await expect(page).toHaveURL(/\/canvas/);
  });

  test("user can sketch, open AI preview, and generate artwork", async ({
    page,
  }) => {
    await page.goto("/canvas");

    // Wait for the canvas element to mount
    const canvasEl = page.locator("canvas").first();
    await expect(canvasEl).toBeVisible();

    // Draw a simple stroke on the canvas
    const box = await canvasEl.boundingBox();
    if (!box) throw new Error("Canvas bounding box not found");
    await page.mouse.move(box.x + 60, box.y + 60);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 160, { steps: 12 });
    await page.mouse.up();

    // Open the AI preview drawer (desktop button)
    const togglePreview = page.getByRole("button", {
      name: /show ai preview/i,
    });
    if (await togglePreview.isVisible().catch(() => false)) {
      await togglePreview.click();
    }

    // Type a prompt
    const promptInput = page.getByLabel("Prompt");
    await promptInput.fill("a cozy autumn cabin in the woods");

    // Click generate
    await page.getByRole("button", { name: /generate/i }).click();

    // The result image should appear (data URL based on mock base64)
    const resultImg = page.getByAltText("Generated artwork");
    await expect(resultImg).toBeVisible({ timeout: 10_000 });
    await expect(resultImg).toHaveAttribute("src", /^data:image\/png;base64,/);
  });

  test("prompt history persists across reloads", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "smart-ai-painter:prompt-history",
        JSON.stringify(["sunset over mountains", "cyberpunk city skyline"]),
      );
    });

    await page.goto("/canvas");

    const togglePreview = page.getByRole("button", {
      name: /show ai preview/i,
    });
    if (await togglePreview.isVisible().catch(() => false)) {
      await togglePreview.click();
    }

    await page.getByRole("button", { name: /history \(2\)/i }).click();
    await expect(page.getByText("sunset over mountains")).toBeVisible();
    await expect(page.getByText("cyberpunk city skyline")).toBeVisible();
  });

  test("onboarding hint shows on first visit and respects dismissal", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/canvas");

    const onboarding = page.getByRole("dialog", {
      name: /make something with smart ai painter/i,
    });
    await expect(onboarding).toBeVisible();
    await page.getByRole("button", { name: /got it/i }).click();
    await expect(onboarding).toBeHidden();

    await page.reload();
    await expect(onboarding).toBeHidden();

    await context.close();
  });
});
