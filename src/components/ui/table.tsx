// Componente Table
import React from "react";
import { cn } from "@/lib/utils";

// Table principal
export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  hoverable?: boolean;
  striped?: boolean;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, hoverable, striped, ...props }, ref) => (
    <div className="w-full overflow-auto">
      <table
        ref={ref}
        className={cn(
          "w-full caption-bottom text-sm",
          hoverable && "[&_tr:hover]:bg-gray-50",
          striped && "[&_tr:nth-child(even)]:bg-gray-50",
          className
        )}
        {...props}
      />
    </div>
  )
);
Table.displayName = "Table";

// Cabeçalho da tabela
export type TableHeaderProps = React.HTMLAttributes<HTMLTableSectionElement>;

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  TableHeaderProps
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("bg-gray-50 text-gray-700", className)}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

// Corpo da tabela
export interface TableBodyProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {
  striped?: boolean;
  hoverable?: boolean;
}

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  TableBodyProps
>(({ className, striped = false, hoverable = false, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn(
      "[&_tr:last-child]:border-0",
      striped && "[&_tr:nth-child(even)]:bg-gray-50",
      hoverable && "[&_tr:hover]:bg-gray-50",
      className
    )}
    {...props}
  />
));
TableBody.displayName = "TableBody";

// Rodapé da tabela
export type TableFooterProps = React.HTMLAttributes<HTMLTableSectionElement>;

export const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  TableFooterProps
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn("bg-gray-50 font-medium text-gray-900", className)}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

// Linha da tabela
export interface TableRowProps
  extends React.HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
}

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, selected = false, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-gray-200 transition-colors",
        selected && "bg-blue-50",
        className
      )}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

// Célula de cabeçalho
export interface TableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
}

export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, sortable = false, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-gray-500",
        sortable && "cursor-pointer select-none",
        className
      )}
      {...props}
    />
  )
);
TableHead.displayName = "TableHead";

// Célula
export type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>;

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("p-4 align-middle", className)} {...props} />
  )
);
TableCell.displayName = "TableCell";

// Caption
export type TableCaptionProps = React.HTMLAttributes<HTMLTableCaptionElement>;

export const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  TableCaptionProps
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-gray-500", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";
