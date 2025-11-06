import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Decimal } from "@prisma/client/runtime/library";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: Decimal | number | null | undefined,
  currency = "BRL",
  locale = "pt-BR"
): string {
  if (value === null || value === undefined) {
    return "-";
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(Number(value));
}

export function formatDate(
  date: Date | string | null | undefined,
  locale = "pt-BR",
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) {
    return "-";
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...options,
  };

  return new Intl.DateTimeFormat(locale, defaultOptions).format(
    typeof date === "string" ? new Date(date) : date
  );
}

export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

export function generateSKU(name: string, categoryPrefix = ""): string {
  const namePart = name
    .toUpperCase()
    .substring(0, 3)
    .replace(/[^A-Z0-9]/g, "");

  const randomPart = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");

  return `${categoryPrefix}${namePart}${randomPart}`;
}

export function debounce<F extends (...args: unknown[]) => void>(
  func: F,
  wait: number
): (...args: Parameters<F>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return function debouncedFunction(...args: Parameters<F>) {
    const later = () => {
      timeoutId = undefined;
      func(...args);
    };

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(later, wait);
  };
}

export function calculateTotal<
  T extends { quantity: number; unitPrice?: number | Decimal }
>(items: T[]): number {
  return items.reduce((sum, item) => {
    const price = item.unitPrice ? Number(item.unitPrice) : 0;
    return sum + item.quantity * price;
  }, 0);
}

export function truncateText(text: string, limit: number): string {
  if (!text || text.length <= limit) {
    return text || "";
  }
  return text.substring(0, limit) + "...";
}

export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: "status-pending",
    PROCESSING: "status-processing",
    APPROVED: "status-approved",
    ORDERED: "status-processing",
    SHIPPED: "status-shipped",
    PARTIALLY_RECEIVED: "status-delivered",
    RECEIVED: "status-completed",
    DELIVERED: "status-delivered",
    COMPLETED: "status-completed",
    CANCELLED: "status-cancelled",
    PAID: "status-completed",
    PARTIAL: "status-processing",
    REFUNDED: "status-cancelled",
  };

  return statusMap[status] || "bg-gray-100 text-gray-800";
}
