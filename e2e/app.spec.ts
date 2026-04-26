import { expect, test } from "@playwright/test";

test("renders the PMTiles-backed WikiBarrio-style shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByLabel("Product").getByRole("img", { name: "QuartierVivo" })).toBeVisible();
  await expect(page.getByRole("button", { name: /\$ Declared income per capita/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Toggle 3D" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Roma" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Milano" })).toBeVisible();
  await expect(page.getByLabel("Map legend")).toBeVisible();
  await expect(page.getByLabel("Selected area details")).toBeVisible();
});

test("metric picker filters grouped metrics and updates the selected variable", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /\$ Declared income per capita/ }).click();
  await page.getByPlaceholder("Search variables...").fill("education");
  await page.getByRole("option", { name: "Population with higher education (%) 2023" }).click();

  await expect(page.getByRole("button", { name: /\$ Population with higher education/ })).toBeVisible();
  await expect(page.getByLabel("Map legend")).toContainText("Higher ed.");
});

test("city jump, poi toggles, language, theme, and 3D controls are interactive", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Milano" }).click();
  await expect(page.getByRole("button", { name: "Milano" })).toHaveClass(/active/);

  const schools = page.getByRole("button", { name: "Schools" });
  await expect(schools).toHaveAttribute("aria-pressed", "true");
  await schools.click();
  await expect(schools).toHaveAttribute("aria-pressed", "false");

  await page.getByRole("button", { name: "Switch language" }).click();
  await expect(page.getByRole("heading", { name: "Seleziona variabile da visualizzare:" })).toBeVisible();

  await page.getByRole("button", { name: "Attiva/disattiva tema scuro" }).click();
  await expect(page.locator(".app-shell")).toHaveClass(/dark/);

  const threeD = page.getByRole("button", { name: "Attiva/disattiva 3D" });
  await threeD.click();
  await expect(threeD).toHaveAttribute("aria-pressed", "false");
});

test("address search uses geocoder suggestions and flies to the selected result", async ({ page }) => {
  await page.route("https://nominatim.openstreetmap.org/search?**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        {
          place_id: 1,
          display_name: "Roma, Lazio, Italy",
          lat: "41.9028",
          lon: "12.4964",
          type: "city"
        }
      ])
    });
  });
  await page.goto("/");

  await page.getByPlaceholder("Search address...").fill("Roma");
  await expect(page.getByRole("button", { name: "Roma, Lazio, Italy" })).toBeVisible();
  await page.getByRole("button", { name: "Roma, Lazio, Italy" }).click();
  await expect(page.getByText("Moved to search result.")).toBeVisible();
});

test("about modal opens and the sidebar can collapse on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Open sidebar" })).toBeVisible();
  await expect(page.getByLabel("Selected area details")).toBeHidden();

  await page.getByRole("button", { name: "About" }).click();
  await expect(page.getByRole("dialog", { name: "What is QuartierVivo?" })).toBeVisible();
  await page.getByRole("button", { name: "Close modal" }).click();

  await page.getByRole("button", { name: "Open sidebar" }).click();
  await expect(page.getByRole("button", { name: /\$ Declared income per capita/ })).toBeVisible();
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(page.getByRole("button", { name: "Open sidebar" })).toBeVisible();
});
