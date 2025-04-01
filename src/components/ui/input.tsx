// Componente Input
import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean | string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type, error = false, icon, iconPosition = "left", ...props },
    ref
  ) => {
    return (
      <div className="relative">
        {icon && iconPosition === "left" && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            {icon}
          </div>
        )}

        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
            "placeholder:text-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !!error && "border-red-500 focus:ring-red-500",
            icon && iconPosition === "left" && "pl-10",
            icon && iconPosition === "right" && "pr-10",
            className
          )}
          ref={ref}
          {...props}
        />

        {icon && iconPosition === "right" && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {icon}
          </div>
        )}

        {error && props.id && (
          <div className="mt-1 text-sm text-red-500" id={`${props.id}-error`}>
            {props["aria-errormessage"]}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
