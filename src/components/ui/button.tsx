import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  loading?: boolean;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      loading = false,
      asChild = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? React.Fragment : "button";
    const buttonProps = {
      ref: asChild ? undefined : ref,
      disabled: disabled || loading,
      className: cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        "disabled:opacity-50 disabled:pointer-events-none",

        variant === "default" && "bg-blue-600 text-white hover:bg-blue-700",
        variant === "destructive" && "bg-red-600 text-white hover:bg-red-700",
        variant === "outline" &&
          "border border-gray-300 bg-transparent hover:bg-gray-50",
        variant === "ghost" && "bg-transparent hover:bg-gray-100",
        variant === "link" &&
          "bg-transparent underline-offset-4 hover:underline text-blue-600",

        size === "default" && "h-10 px-4 py-2 text-sm",
        size === "sm" && "h-8 px-3 text-xs",
        size === "lg" && "h-12 px-6 text-base",
        size === "icon" && "h-10 w-10",

        className
      ),
      ...props,
    };

    return (
      <Comp {...(asChild ? {} : buttonProps)}>
        {asChild ? (
          React.cloneElement(children as React.ReactElement, buttonProps)
        ) : loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";
