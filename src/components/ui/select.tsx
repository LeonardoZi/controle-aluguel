import React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  label?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, error = false, label, helperText, children, ...props },
    ref
  ) => {
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}

        <select
          className={cn(
            "block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>

        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}

        {error && props.id && (
          <p className="mt-1 text-sm text-red-500" id={`${props.id}-error`}>
            {props["aria-errormessage"] || "Este campo é inválido"}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
