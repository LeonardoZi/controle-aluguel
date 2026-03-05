import {
  dashboardOverviewSchema,
  type DashboardOverviewDto,
} from "@/server/contracts/v1/dashboard";
import {
  DEFAULT_DASHBOARD_SECTION_LIMIT,
  DEFAULT_DASHBOARD_WINDOW_DAYS,
} from "@/server/shared/constants";
import { listLowStockProducts } from "@/server/inventory/queries";
import { getSalesSummaryReadModel, listSales } from "@/server/sales/queries";

export interface DashboardOverviewOptions {
  windowDays?: number;
  sectionLimit?: number;
}

export async function getDashboardOverview(
  options: DashboardOverviewOptions = {},
): Promise<DashboardOverviewDto> {
  const windowDays = options.windowDays ?? DEFAULT_DASHBOARD_WINDOW_DAYS;
  const sectionLimit = options.sectionLimit ?? DEFAULT_DASHBOARD_SECTION_LIMIT;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - windowDays);

  const [summary, recentRentals, overdueRentals, lowStockProducts] =
    await Promise.all([
      getSalesSummaryReadModel({ startDate, endDate }),
      listSales({ startDate, endDate, limit: sectionLimit }),
      listSales({ status: "ATRASADO", limit: sectionLimit }),
      listLowStockProducts(sectionLimit),
    ]);

  return dashboardOverviewSchema.parse({
    summary,
    recentRentals,
    overdueRentals,
    lowStockProducts,
  });
}
