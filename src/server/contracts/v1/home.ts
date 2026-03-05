import { z } from "zod";
import { currencyNumberSchema, isoDateTimeSchema } from "./shared";

export const homeStatsSchema = z.object({
  totalProducts: z.number().int().nonnegative(),
  totalCustomers: z.number().int().nonnegative(),
  activeSales: z.number().int().nonnegative(),
  overdueSales: z.number().int().nonnegative(),
  monthRevenue: currencyNumberSchema,
  lowStockCount: z.number().int().nonnegative(),
});

export const upcomingExpirationSchema = z.object({
  id: z.string(),
  dataDevolucaoPrevista: isoDateTimeSchema,
  customer: z.object({
    name: z.string(),
  }),
});

export const homeOverviewSchema = z.object({
  stats: homeStatsSchema,
  upcomingExpirations: z.array(upcomingExpirationSchema),
});

export type HomeStatsDto = z.infer<typeof homeStatsSchema>;
export type UpcomingExpirationDto = z.infer<typeof upcomingExpirationSchema>;
