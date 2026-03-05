import { z } from "zod";
import { productSchema } from "./inventory";
import { saleDetailsSchema, salesSummarySchema } from "./sales";

export const dashboardOverviewSchema = z.object({
  summary: salesSummarySchema,
  recentRentals: z.array(saleDetailsSchema),
  overdueRentals: z.array(saleDetailsSchema),
  lowStockProducts: z.array(productSchema),
});

export type DashboardOverviewDto = z.infer<typeof dashboardOverviewSchema>;
