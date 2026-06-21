import { expect, test } from "@playwright/test";

test("navigates from the spatial home into projects and toggles theme", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Marvel" })).toBeVisible();
  await page.getByLabel("Projects").first().click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  await page.getByLabel(/toggle light or dark theme/i).first().click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("opens and closes a Lab item", async ({ page }) => {
  await page.goto("/lab");
  await page.getByRole("button", { name: /open robotics sketch/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("mobile home uses the simplified project list", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile-only assertion");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Explore projects" })).toBeVisible();
  await expect(page.locator(".project-map")).toBeHidden();
  await expect(page.getByLabel("More navigation options")).toBeVisible();
});
