// Componente DataTable
"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

// Componentes de tabela internos (já que os módulos externos não estão disponíveis)
const Table = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableElement>) => (
  <table
    className={cn("w-full caption-bottom text-sm", className)}
    {...props}
  />
);

const TableHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn("[&_tr]:border-b", className)} {...props} />
);

const TableBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
);

const TableRow = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
);

const TableHead = ({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
);

const TableCell = ({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
);

// Botão simplificado
const Button = ({
  className,
  variant = "default",
  size = "default",
  disabled = false,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
  size?: "default" | "sm";
}) => (
  <button
    className={cn(
      "inline-flex items-center justify-center rounded-md font-medium transition-colors",
      variant === "default"
        ? "bg-primary text-primary-foreground hover:bg-primary/90"
        : "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      size === "sm" ? "h-9 px-3 text-xs" : "h-10 px-4 py-2",
      disabled && "opacity-50 cursor-not-allowed pointer-events-none",
      className
    )}
    disabled={disabled}
    {...props}
  >
    {children}
  </button>
);

// Input simplificado
const Input = ({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
);

// Ícones simples em vez de usar lucide-react
const ChevronDown = () => <span className="ml-1">▼</span>;
const ChevronUp = () => <span className="ml-1">▲</span>;
const ChevronsUpDown = () => <span className="ml-1">⇕</span>;
const Search = () => <span>🔍</span>;
const ChevronLeft = () => <span>◀</span>;
const ChevronRight = () => <span>▶</span>;

interface DataTableColumn<T extends Record<string, unknown>> {
  header: string;
  accessorKey: keyof T;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: DataTableColumn<T>[];
  onRowClick?: (item: T) => void;
  searchable?: boolean;
  pagination?: boolean;
  itemsPerPage?: number;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  onRowClick,
  searchable = false,
  pagination = false,
  itemsPerPage = 10,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Ordenação
  const handleSort = (column: keyof T) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Filtragem por termo de busca
  const filteredData = searchTerm
    ? data.filter((item) =>
        Object.values(item).some((value: unknown) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : data;

  // Ordenação dos dados
  const sortedData = sortColumn
    ? [...filteredData].sort((a, b) => {
        const aValue: unknown = a[sortColumn];
        const bValue: unknown = b[sortColumn];

        if (aValue === bValue) return 0;

        // Comparação segura com verificação de tipo
        if (typeof aValue === "string" && typeof bValue === "string") {
          const comp = aValue.localeCompare(bValue);
          return sortDirection === "asc" ? comp : -comp;
        }

        // Comparação numérica
        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }

        // Comparação genérica para outros tipos
        const comparison = String(aValue) < String(bValue) ? -1 : 1;
        return sortDirection === "asc" ? comparison : -comparison;
      })
    : filteredData;

  // Paginação
  const totalPages = pagination
    ? Math.ceil(sortedData.length / itemsPerPage)
    : 1;

  const paginatedData = pagination
    ? sortedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    : sortedData;

  // Renderização do ícone de ordenação
  const getSortIcon = (column: keyof T) => {
    if (column !== sortColumn) return <ChevronsUpDown />;
    return sortDirection === "asc" ? <ChevronUp /> : <ChevronDown />;
  };

  return (
    <div className="w-full space-y-4">
      {searchable && (
        <div className="relative w-full max-w-sm">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Search />
          </div>
          <Input
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={String(column.accessorKey)}
                  className={
                    column.sortable ? "cursor-pointer select-none" : ""
                  }
                  onClick={() => {
                    if (column.sortable) {
                      handleSort(column.accessorKey);
                    }
                  }}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable && getSortIcon(column.accessorKey)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item, index) => (
                <TableRow
                  key={index}
                  className={onRowClick ? "cursor-pointer hover:bg-muted" : ""}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {columns.map((column) => (
                    <TableCell key={String(column.accessorKey)}>
                      {column.cell
                        ? column.cell(item)
                        : String(item[column.accessorKey] || "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
            {Math.min(currentPage * itemsPerPage, sortedData.length)} de{" "}
            {sortedData.length} resultados
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft />
            </Button>
            <div className="text-sm font-medium">
              Página {currentPage} de {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
