import SalesTableWithFilters, {
  SaleRow,
} from "@/components/data-display/SalesTableWithFilters";
import { getSales } from "@/actions/sales";
import { Sale } from "@prisma/client";

export default async function AllSalesTable() {
  const { sales = [] } = await getSales();

  const rows: SaleRow[] = (sales as unknown[]).map((item) => {
    const sale = item as Sale & { customer?: { name: string } | null };

    return {
      id: sale.id,
      customer: { name: sale.customer?.name || "-" },
      dataRetirada:
        sale.dataRetirada instanceof Date
          ? sale.dataRetirada.toLocaleDateString("pt-BR")
          : String(sale.dataRetirada),
      status: String(sale.status),
      totalAmount: Number(sale.totalAmount ?? 0),
    };
  });

  return <SalesTableWithFilters initialSales={rows} />;
}
