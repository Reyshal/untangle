import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "high" | "medium" | "low" | "outline" | "success";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-background-subtle text-foreground border-border",
    high: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    medium: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20",
    low: "bg-stone-500/10 text-stone-700 dark:text-stone-400 border-stone-500/20",
    outline: "bg-transparent text-foreground-muted border-border",
    success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  };

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider",
          variantStyles[variant],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
}
