import React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "onChange"
  > {
  onCheckedChange?: (checked: boolean) => void;
  checked?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, checked, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className={cn(
            "h-4 w-4 rounded border-gray-300 text-blue-600",
            "focus:ring-blue-500 focus:ring-offset-0",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
