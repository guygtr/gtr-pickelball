/**
 * NeonButton — P1 UI : moins de glow agressif, transitions plus courtes.
 * Rollback : git revert du commit style(ui): P1
 */
import React from "react";

type NeonButtonProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "tertiary" | "muted" | "yellow" | "acid" | "gold";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
};

export function NeonButton({
  children,
  className = "",
  onClick,
  variant = "primary",
  disabled = false,
  type = "button",
}: NeonButtonProps) {
  const baseClasses =
    "px-6 py-2.5 rounded-xl font-semibold tracking-wide text-xs flex items-center justify-center gap-2 transition-colors duration-200 active:scale-[0.99] border";

  const variants: Record<string, string> = {
    primary:
      "bg-pickle-primary/10 border-pickle-primary/30 text-pickle-primary hover:bg-pickle-primary hover:text-black hover:border-pickle-primary",
    muted:
      "bg-pickle-muted/5 border-white/10 text-pickle-muted hover:bg-pickle-muted hover:text-black hover:border-pickle-muted",
    tertiary:
      "bg-pickle-tertiary/5 border-white/10 text-pickle-tertiary hover:bg-pickle-tertiary hover:text-white hover:border-pickle-tertiary",
    secondary:
      "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/20",
    yellow:
      "bg-pickle-yellow/5 border-white/10 text-pickle-yellow/90 hover:bg-pickle-yellow hover:text-black hover:border-pickle-yellow",
    acid: "bg-pickle-primary border-pickle-primary text-black hover:bg-[#cbfb10]",
    gold: "bg-transparent border-[var(--color-gold)]/30 text-[var(--color-gold)] hover:bg-[var(--color-gold)]/10 hover:border-[var(--color-gold)]",
  };

  const disabledClasses =
    "opacity-40 cursor-not-allowed grayscale pointer-events-none";

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant] ?? variants.primary} ${
        disabled ? disabledClasses : ""
      } ${className}`.trim()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default NeonButton;
