// Componente StatusBadge
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Tipos de status que a badge pode exibir
type StatusType =
  | "in" // Em estoque
  | "low" // Estoque baixo
  | "out" // Sem estoque
  | "pending" // Pendente
  | "processing" // Em processamento
  | "shipped" // Enviado
  | "delivered" // Entregue
  | "cancelled" // Cancelado
  | "success" // Sucesso
  | "warning" // Alerta
  | "error" // Erro
  | "info"; // Informação

// Props do componente
interface StatusBadgeProps {
  status: StatusType;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({
  status,
  children,
  className,
  size = "md",
}: StatusBadgeProps) {
  // Mapeamento de cores e estilos baseados no status
  const statusStyles: Record<StatusType, string> = {
    in: "bg-green-100 text-green-800 border-green-200",
    low: "bg-amber-100 text-amber-800 border-amber-200",
    out: "bg-red-100 text-red-800 border-red-200",
    pending: "bg-blue-100 text-blue-800 border-blue-200",
    processing: "bg-purple-100 text-purple-800 border-purple-200",
    shipped: "bg-indigo-100 text-indigo-800 border-indigo-200",
    delivered: "bg-teal-100 text-teal-800 border-teal-200",
    cancelled: "bg-gray-100 text-gray-800 border-gray-200",
    success: "bg-green-100 text-green-800 border-green-200",
    warning: "bg-amber-100 text-amber-800 border-amber-200",
    error: "bg-red-100 text-red-800 border-red-200",
    info: "bg-blue-100 text-blue-800 border-blue-200",
  };

  // Tamanhos diferentes para a badge
  const sizeStyles = {
    sm: "text-xs px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border font-medium",
        statusStyles[status],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}
