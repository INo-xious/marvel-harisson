import { expect, test } from "@playwright/test";

test("navigates from the spatial home into projects and toggles theme", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Marvel" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Language" })).toBeVisible();
  await expect(page.getByText("interactive project map")).toHaveCount(0);
  const artifactPlane = testInfo.project.name === "mobile" ? page.locator(".mobile-artifact-plane") : page.locator(".artifact-plane");
  await expect(artifactPlane.locator(":scope > a")).toHaveCount(5);
  await expect(artifactPlane.locator('a[href^="/projects/"]')).toHaveCount(0);
  await artifactPlane.locator('a[href="/projects"]').click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  const initialTheme = await page.locator("html").getAttribute("data-theme");
  if (testInfo.project.name === "mobile") {
    await page.getByLabel("More navigation options").click();
    await page.getByRole("button", { name: /switch theme/i }).click();
  } else {
    await page.getByLabel(/toggle light or dark theme/i).click();
  }
  await expect(page.locator("html")).toHaveAttribute("data-theme", initialTheme === "dark" ? "light" : "dark");
});

test("switches visible portfolio copy between English and Japanese", async ({ page }, testInfo) => {
  await page.goto("/");
  const languageToggle = page.locator(".language-toggle");
  await languageToggle.getByRole("button", { name: "日本語" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(languageToggle).not.toHaveAttribute("aria-busy", "true");
  const roleText = testInfo.project.name === "mobile" ? page.locator(".mobile-intro .home-role") : page.locator(".home-copy .home-role");
  await expect(roleText).toHaveText("ソフトウェア工学を学ぶ学生");

  await page.goto("/projects");
  await expect(page.getByRole("heading", { name: "制作" })).toBeVisible();
  await expect(page.getByText("実践的なシステム、実験、学習の記録。")).toBeVisible();

  await languageToggle.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(languageToggle).not.toHaveAttribute("aria-busy", "true");
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
});

test("moves artifacts and the marker grid as one spatial plane", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop-only interaction");
  await page.goto("/");
  await expect(page.locator(".map-time")).not.toHaveText("--:--:--");
  const projectArtifact = page.locator(".node-projects");
  const wordmark = page.locator(".wordmark-wrap");
  await page.mouse.move(720, 450);
  await page.waitForTimeout(150);
  const artifactBefore = await projectArtifact.boundingBox();
  const wordmarkBefore = await wordmark.boundingBox();
  await page.mouse.move(1300, 760);
  await page.waitForTimeout(120);
  const artifactAfter = await projectArtifact.boundingBox();
  const wordmarkAfter = await wordmark.boundingBox();
  expect(artifactAfter?.x).not.toBe(artifactBefore?.x);
  expect(artifactAfter?.y).not.toBe(artifactBefore?.y);
  expect((artifactAfter?.x ?? 0) - (artifactBefore?.x ?? 0)).toBeCloseTo((wordmarkAfter?.x ?? 0) - (wordmarkBefore?.x ?? 0), 1);
  expect((artifactAfter?.y ?? 0) - (artifactBefore?.y ?? 0)).toBeCloseTo((wordmarkAfter?.y ?? 0) - (wordmarkBefore?.y ?? 0), 1);
  await expect(page.locator(".map-world")).toHaveAttribute("style", /translate3d/);
  await expect(page.locator(".cursor-tile.tile-live").first()).toBeAttached();

  const surface = projectArtifact.locator(".map-node-surface");
  await expect(surface).toHaveCSS("filter", /grayscale\(1\)/);
  await projectArtifact.hover();
  await expect(page.locator(".map-world")).not.toHaveAttribute(
    "style",
    /translate3d\(0px, 0px, 0px\)/,
  );
  await expect(surface).toHaveCSS("filter", /grayscale\(0\)/);
  const hoverLabel = page.locator(".map-hover-label[data-visible]");
  await expect(hoverLabel).toBeVisible();
  await expect(hoverLabel.locator("span")).toHaveText("/projects");
  await expect(hoverLabel.locator("i")).toHaveCSS("height", "66px");
});

test("does not overflow at browser-zoom-equivalent viewports", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop viewport matrix");
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1152, height: 720 },
    { width: 960, height: 600 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
    await expect(page.locator(".desktop-nav")).toBeInViewport();
  }
});

test("drags route cards without navigating and snaps them to the spatial grid", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop-only interaction");
  await page.goto("/");
  const card = page.locator(".node-projects");
  const box = await card.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move((box?.x ?? 0) + 40, (box?.y ?? 0) + 40);
  await page.mouse.down();
  await page.mouse.move(1435, (box?.y ?? 0) + 91, { steps: 10 });
  await page.mouse.up();
  await expect(page).toHaveURL(/\/$/);
  const snapped = await card.evaluate((node) => {
    const element = node as HTMLElement;
    const x = Number.parseFloat(element.style.getPropertyValue("--drag-x"));
    const y = Number.parseFloat(element.style.getPropertyValue("--drag-y"));
    const absoluteX = element.offsetLeft + x;
    const stageWidth = element.parentElement?.parentElement?.clientWidth ?? 1440;
    return {
      x: absoluteX,
      y: element.offsetTop + y,
      previousBarrier: stageWidth - element.offsetWidth,
    };
  });
  expect(Math.abs(snapped.x % 32)).toBe(0);
  expect(Math.abs(snapped.y % 32)).toBe(0);
  expect(snapped.x).toBeGreaterThan(snapped.previousBarrier);
});

test("lazy-loads the official Sleep Radio controls from the dock", async ({ page }, testInfo) => {
  await page.goto("/");
  if (testInfo.project.name === "mobile") {
    await page.getByLabel("More navigation options").click();
    await page.getByRole("button", { name: "Sleep Radio controls" }).click();
  } else {
    const lofiLink = page.getByLabel("Open Sleep Radio preset on Lofi Cafe in a new tab");
    await expect(lofiLink).toHaveAttribute("href", "https://loficafe.net/use/sleep-radio");
    await expect(lofiLink.locator(".lucide-volume-2")).toBeVisible();
    await lofiLink.hover();
  }
  await expect(page.locator(".lofi-panel[data-open]")).toBeVisible();
  await expect(page.getByTitle("Lofi Cafe Sleeping station player")).toHaveAttribute(
    "src",
    "https://loficafe.net/embed/sleeping",
  );
  await page.locator("html").evaluate((root) => root.setAttribute("data-theme", "light"));
  await expect(page.getByTitle("Lofi Cafe Sleeping station player")).toHaveCSS(
    "filter",
    "invert(1) hue-rotate(180deg)",
  );
});

test("links the real Lab item to Ri-one", async ({ page }) => {
  await page.goto("/lab");
  const item = page.getByRole("link", { name: /open ri-one @home league/i });
  await expect(item).toHaveAttribute("href", "https://rione.org/home-league/");
  await expect(page.locator(".lab-grid > .lab-tile")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Ritsumeikan Labs" })).toBeVisible();
  await expect(page.locator(".rits-lab-card")).toHaveCount(5);
  await expect(page.locator(".rits-labs-grid")).toHaveCSS("display", "grid");
  await expect(page.locator(".rits-lab-media").first()).toHaveCSS("position", "relative");
  await expect(page.getByRole("link", { name: /visit visual information engineering/i })).toHaveAttribute(
    "href",
    "https://vinelab.jp/",
  );
});

test("publishes Marvel's email as a direct mailto link", async ({ page }) => {
  await page.goto("/contact");
  const email = page.locator('#email[href="mailto:im.marvel.harisson@gmail.com"]');
  await expect(email).toBeVisible();
  await expect(email).toContainText("im.marvel.harisson@gmail.com");
  await expect(page.locator('.desktop-nav a[href="mailto:im.marvel.harisson@gmail.com"]')).toHaveAttribute(
    "aria-label",
    "Email Marvel Harisson",
  );
});

test("keeps the project gallery honest while robotics is in progress", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.locator(".project-card")).toHaveCount(6);
  await expect(page.getByText("Python File Automation Exercises")).toHaveCount(0);
  await expect(page.getByText("Project screenshot")).toHaveCount(0);
  await expect(page.getByText("Original photograph")).toHaveCount(0);
  await expect(page.getByText("Concept visualization")).toHaveCount(0);

  await page.goto("/projects/robotics-soda-task");
  await expect(page.getByRole("heading", { name: "Robotics Soda Task Concept" })).toBeVisible();
  await expect(page.getByRole("link", { name: /view repository/i })).toHaveAttribute(
    "href",
    "https://github.com/Gil-gil-glitch/ros2_crane_plus_ws/tree/main",
  );
  await expect(page.getByRole("heading", { name: "What I Built" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "What I Learned" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Technical Details" })).toBeVisible();
  await expect(page.getByText("Original photograph")).toHaveCount(0);

  await page.goto("/projects/pacman-processing-game");
  await expect(page.getByRole("heading", { name: "Pac-Man Processing Game" })).toBeVisible();
  await expect(page.getByRole("link", { name: /view repository/i })).toHaveAttribute(
    "href",
    "https://github.com/INo-xious/packman-game-ai-agent",
  );

  const removedProject = await page.goto("/projects/python-file-automation");
  expect(removedProject?.status()).toBe(404);
});

test("reveals project copy on hover or first mobile tap", async ({ page }, testInfo) => {
  await page.goto("/projects");
  const card = page.locator(".project-card").first();
  const link = card.locator(".project-card-link");
  const overlay = card.locator(".project-card-overlay");
  await expect(overlay).toHaveCSS("opacity", "0");

  if (testInfo.project.name === "mobile") {
    await link.tap();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(link).toHaveAttribute("data-revealed", "true");
    await expect(overlay).toHaveCSS("opacity", "1");
    await link.tap();
    await expect(page).toHaveURL(/\/projects\/marveious-style-engine$/);
    return;
  }

  await card.hover();
  await expect(overlay).toHaveCSS("opacity", "1");
  await expect(overlay.getByRole("heading", { name: "MarveIous Style Engine" })).toBeVisible();
});

test("mobile home uses the same five route artifacts", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile-only assertion");
  await page.goto("/");
  await expect(page.locator(".project-map")).toBeHidden();
  await expect(page.locator(".mobile-artifact-plane > a")).toHaveCount(5);
  await expect(page.locator('.mobile-artifact-plane a[href="/lab"]')).toBeVisible();
  await expect(page.locator('.mobile-artifact-plane a[href^="/projects/"]')).toHaveCount(0);
  await expect(page.locator(".mobile-route > span")).toHaveCount(5);
  await expect(page.locator(".mobile-map-grid pattern")).toHaveAttribute("width", "24");
  await expect(page.getByLabel("More navigation options")).toBeVisible();
});
