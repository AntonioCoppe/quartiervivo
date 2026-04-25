import { expect, test } from "@playwright/test";

test("renders the WikiBarrio-style shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "MappaQuartieri" })).toBeVisible();
  await expect(page.getByLabel("Metric")).toBeVisible();
  await expect(page.getByRole("button", { name: "Roma" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Milano" })).toBeVisible();
  await expect(page.getByLabel("Map legend")).toBeVisible();
});

test("city jump and poi toggles are interactive", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Milano" }).click();
  await expect(page.getByRole("button", { name: "Milano" })).toHaveClass(/active/);

  const schools = page.getByRole("button", { name: "Schools" });
  await expect(schools).toHaveAttribute("aria-pressed", "true");
  await schools.click();
  await expect(schools).toHaveAttribute("aria-pressed", "false");
});

test("keeps the core shell usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "MappaQuartieri" })).toBeVisible();
  await expect(page.getByPlaceholder("Search address...")).toBeVisible();
  await expect(page.getByRole("button", { name: "Roma" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Milano" })).toBeVisible();
});
