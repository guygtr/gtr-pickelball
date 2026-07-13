/**
 * NeonButton — aligné sur D:\GrokBuild\shared-ui\neon-button.tsx
 * Variantes pickle-* (tokens du projet).
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
    "px-6 py-2.5 rounded-xl font-bold uppercase tracking-[0.1em] text-[11px] flex items-center justify-center gap-2.5 transition-all duration-500 active:scale-[0.98] border";

  const variants: Record<string, string> = {
    primary:
      "bg-pickle-primary/5 border-white/10 text-pickle-primary hover:bg-pickle-primary hover:text-black hover:border-pickle-primary hover:shadow-[0_8px_30px_rgba(220,252,68,0.4)] shadow-inner",
    muted:
      "bg-pickle-muted/5 border-white/10 text-pickle-muted hover:bg-pickle-muted hover:text-black hover:border-pickle-muted hover:shadow-[0_8px_30px_rgba(132,204,22,0.4)] shadow-inner",
    tertiary:
      "bg-pickle-tertiary/5 border-white/10 text-pickle-tertiary hover:bg-pickle-tertiary hover:text-white hover:border-pickle-tertiary hover:shadow-[0_8px_30px_rgba(59,130,246,0.4)] shadow-inner",
    secondary:
      "bg-pickle-secondary/5 border-white/10 text-pickle-secondary/90 hover:bg-pickle-secondary hover:text-white hover:border-pickle-secondary hover:shadow-[0_8px_30px_rgba(227,24,55,0.4)] shadow-inner",
    yellow:
      "bg-pickle-yellow/5 border-white/10 text-pickle-yellow/90 hover:bg-pickle-yellow hover:text-black hover:border-pickle-yellow hover:shadow-[0_8px_30px_rgba(253,224,71,0.4)] shadow-inner",
    acid: "bg-[#dcfc44] border-[#dcfc44] text-black hover:bg-[#cbfb10] hover:shadow-[0_0_30px_rgba(220,252,68,0.5)] shadow-lg shadow-black/20",
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
