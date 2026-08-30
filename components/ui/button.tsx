import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary:
      "bg-primary hover:bg-primary-hover text-primary-foreground shadow-sm shadow-primary/20 focus-visible:ring-primary",
    secondary:
      "bg-background-subtle hover:bg-border-muted text-foreground border border-border focus-visible:ring-foreground-muted",
    outline:
      "bg-transparent hover:bg-background-subtle text-foreground border border-border focus-visible:ring-primary",
    ghost:
      "bg-transparent hover:bg-background-subtle text-foreground-muted hover:text-foreground focus-visible:ring-foreground-muted",
    destructive:
      "bg-destructive hover:bg-red-700 text-destructive-foreground focus-visible:ring-destructive",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
    md: "px-4 py-2 text-sm rounded-lg gap-2",
    lg: "px-5 py-2.5 text-base rounded-xl gap-2.5",
    icon: "p-2 rounded-lg",
  };

  return (
    <button
      className={twMerge(
        clsx(
          "inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          variantStyles[variant],
          sizeStyles[size],
          className
        )
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4 text-current shrink-0"
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
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
