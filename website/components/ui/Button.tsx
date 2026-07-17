import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
};

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const styles = {
    primary:
      "bg-green-700 text-white hover:bg-green-800",
    secondary:
      "border border-green-700 bg-white text-green-700 hover:bg-green-50",
    danger:
      "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      className={`rounded-lg px-6 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}