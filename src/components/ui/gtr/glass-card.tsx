/**
 * GlassCard — aligné sur D:\GrokBuild\shared-ui\glass-card.tsx
 * Palette / utilitaires glass du projet (globals.css).
 */
import React from "react";

type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  variant?: "default" | "neon";
};

export function GlassCard({
  children,
  className = "",
  hoverEffect = true,
  variant = "default",
}: GlassCardProps) {
  const baseClasses =
    variant === "neon"
      ? "glass-neon p-6 rounded-2xl"
      : "glass p-6 rounded-2xl border border-white/5 shadow-2xl";

  const hoverClasses = hoverEffect ? "glass-hover cursor-pointer" : "";

  return (
    <div className={`${baseClasses} ${hoverClasses} ${className}`.trim()}>
      {children}
    </div>
  );
}

export default GlassCard;
