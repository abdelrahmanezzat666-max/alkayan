import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-teal-700 text-white hover:bg-teal-800 focus:ring-teal-600/20",
  secondary: "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 focus:ring-slate-500/10",
  ghost: "text-slate-700 hover:bg-slate-100 focus:ring-slate-500/10",
  danger: "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-600/20"
};

export function Button({ className, children, variant = "primary", loading, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
        variantClass[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
