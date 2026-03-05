import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "info";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: "border-transparent bg-blue-600 text-white dark:bg-blue-500",
  secondary:
    "border-transparent bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100",
  destructive:
    "border-transparent bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-200",
  outline:
    "border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-200",
  success:
    "border-transparent bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200",
  warning:
    "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200",
  info: "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
