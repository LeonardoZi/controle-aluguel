"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import Link from "next/link";

export interface SaleRow {
  id: string;
  customer: { name: string };
  dataRetirada: string;
  status: string;
  totalAmount: number;
}

interface SalesTableWithFiltersProps {
  initialSales: SaleRow[];
}

export default function SalesTableWithFilters({ initialSales }: SalesTableWithFiltersProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sales, setSales] = useState<SaleRow[]>(initialSales);
  const [date, setDate] = useState("");

  // Função para converter data para yyyy-mm-dd (input date)
  function toInputDateString(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    let filtered = initialSales;
    if (search) {
      filtered = filtered.filter(sale => sale.customer.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (status) {
      filtered = filtered.filter(sale => sale.status === status);
    }
    if (date) {
      filtered = filtered.filter(sale => {
        // Corrigir para comparar apenas a data local (yyyy-mm-dd)
        const saleDate = new Date(sale.dataRetirada);
        const saleDateStr = toInputDateString(saleDate);
        return saleDateStr === date;
      });
    }
    setSales(filtered);
  }, [search, status, date, initialSales]);

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <CardTitle>Vendas</CardTitle>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <DatePicker value={date} onChange={setDate} format="dd/MM/yyyy" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-56"
          />
          <Select value={status} onChange={e => setStatus(e.target.value)} className="w-full sm:w-40">
            <option value="">Todos status</option>
            <option value="CONCLUIDO">Concluído</option>
            <option value="ATIVO">Ativo</option>
            <option value="ATRASADO">Atrasado</option>
            <option value="CANCELADO">Cancelado</option>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table className="min-w-[560px]">
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Retirada</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.length > 0 ? sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>
                  <Link href={`/sales/${sale.id}`} className="font-medium text-blue-600 hover:underline">
                    {sale.customer.name}
                  </Link>
                </TableCell>
                <TableCell>{toInputDateString(new Date(sale.dataRetirada)).split("-").reverse().join("/")}</TableCell>
                <TableCell>{sale.status}</TableCell>
                <TableCell className="text-right font-medium">R$ {sale.totalAmount?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500 py-4">Nenhuma venda encontrada.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
