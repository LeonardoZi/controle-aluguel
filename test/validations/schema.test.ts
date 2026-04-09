import { describe, expect, it } from "vitest";
import { createProductSchema, createSaleSchema } from "@/validations/schema";

describe("createProductSchema", () => {
  it("applies defaults for stock and unit", () => {
    const parsed = createProductSchema.parse({
      name: "Disjuntor bipolar",
      precoUnitario: "24.9",
      unit: "",
    });

    expect(parsed).toMatchObject({
      name: "Disjuntor bipolar",
      precoUnitario: 24.9,
      currentStock: 0,
      unit: "un",
    });
  });
});

describe("createSaleSchema", () => {
  it("normalizes blank notes", () => {
    const parsed = createSaleSchema.parse({
      customerId: "customer-1",
      userId: "user-1",
      dataDevolucaoPrevista: "2026-04-30",
      notes: "   ",
      items: [
        {
          produtoId: "product-1",
          quantidadeRetirada: 1,
          precoUnitarioNoMomento: 19.9,
        },
      ],
    });

    expect(parsed.notes).toBeNull();
  });

  it("requires at least one item", () => {
    const result = createSaleSchema.safeParse({
      customerId: "customer-1",
      userId: "user-1",
      dataDevolucaoPrevista: "2026-04-30",
      notes: "Observacao teste",
      items: [],
    });

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Expected createSaleSchema to reject empty items");
    }

    expect(result.error.flatten().fieldErrors.items).toContain(
      "Adicione pelo menos um item",
    );
  });
});
