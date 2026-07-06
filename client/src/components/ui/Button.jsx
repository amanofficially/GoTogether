import { forwardRef } from "react";

const variants = {
  primary: "bg-[var(--color-route)] text-white hover:bg-[var(--color-route-dim)] shadow-sm",
  dark: "bg-[var(--color-ink)] text-[var(--color-paper)] hover:bg-[var(--color-ink-soft)]",
  outline: "border border-[var(--color-line)]/40 text-[var(--color-ink)] hover:border-[var(--color-ink)] bg-transparent",
  ghost: "text-[var(--color-ink)] hover:bg-[var(--color-paper-dim)] bg-transparent",
  danger: "bg-transparent text-[var(--color-alert)] border border-[var(--color-alert)]/40 hover:bg-[var(--color-alert)]/10",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm rounded-full",
  md: "px-5 py-2.5 text-sm rounded-full",
  lg: "px-7 py-3.5 text-base rounded-full",
};

const Button = forwardRef(function Button(
  { as: Comp = "button", variant = "primary", size = "md", className = "", children, ...props },
  ref
) {
  return (
    <Comp
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 font-medium tracking-tight transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </Comp>
  );
});

export default Button;
