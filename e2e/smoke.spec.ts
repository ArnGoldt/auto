import { test, expect } from "@playwright/test";

test("manager login and open clients", async ({ page }) => {
  await page.goto("http://127.0.0.1:43123/login");
  await page.fill('input[name="email"]', "manager@demo.local");
  await page.fill('input[name="password"]', "demo1234");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/app/);
  await page.goto("http://127.0.0.1:43123/app/clients");
  await expect(page.getByText("Клиенты сети")).toBeVisible();
});
