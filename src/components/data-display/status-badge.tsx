import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatusType =
  | "in"
  | "low"
  | "out"
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "success"
  | "warning"
  | "error"
  | "info";

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
  const statusStyles: Record<StatusType, string> = {
    in: "border-green-200 bg-green-100 text-green-800 dark:border-green-900 dark:bg-green-900/40 dark:text-green-200",
    low: "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
    out: "border-red-200 bg-red-100 text-red-800 dark:border-red-900 dark:bg-red-900/40 dark:text-red-200",
    pending:
      "border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-900 dark:bg-blue-900/40 dark:text-blue-200",
    processing:
      "border-purple-200 bg-purple-100 text-purple-800 dark:border-purple-900 dark:bg-purple-900/40 dark:text-purple-200",
    shipped:
      "border-indigo-200 bg-indigo-100 text-indigo-800 dark:border-indigo-900 dark:bg-indigo-900/40 dark:text-indigo-200",
    delivered:
      "border-teal-200 bg-teal-100 text-teal-800 dark:border-teal-900 dark:bg-teal-900/40 dark:text-teal-200",
    cancelled:
      "border-gray-200 bg-gray-100 text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200",
    success:
      "border-green-200 bg-green-100 text-green-800 dark:border-green-900 dark:bg-green-900/40 dark:text-green-200",
    warning:
      "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
    error:
      "border-red-200 bg-red-100 text-red-800 dark:border-red-900 dark:bg-red-900/40 dark:text-red-200",
    info: "border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-900 dark:bg-blue-900/40 dark:text-blue-200",
  };

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
        className,
      )}
    >
      {children}
    </span>
  );
}
