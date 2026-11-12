import * as React from "react";

const buttonVariants = (
  variant: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link" = "default",
  size: "default" | "sm" | "lg" | "icon" = "default",
  className = ""
) => {
  const base =
    "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  const variants: Record<string, string> = {
    default: "bg-brand-600 text-white shadow-sm hover:bg-brand-700 dark:hover:bg-brand-800",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
  };
  const sizes: Record<string, string> = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-xl px-8",
    icon: "h-10 w-10",
  };
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim();
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function Button({ className, variant = "default", size = "default", ...props }: ButtonProps) {
  return <button className={buttonVariants(variant, size, className)} {...props} />;
}
