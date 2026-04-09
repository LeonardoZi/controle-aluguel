import { expect, test } from "@playwright/test";

test("home renders primary navigation and summary cards", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Sistema ERP - Materiais Elétricos/);
  await expect(
    page.getByRole("heading", { name: "Venda e Aluguel de Materiais" }),
  ).toBeVisible();
  await expect(page.getByText("Receita Mês")).toBeVisible();
  await expect(page.getByRole("link", { name: /Vendas/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Clientes/i })).toBeVisible();
});
