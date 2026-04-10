import React from 'react';

/**
 * GlassCard - Un composant conteneur avec effet Glassmorphism premium.
 * 
 * @param {string} children - Contenu de la carte.
 * @param {string} className - Classes CSS additionnelles.
 * @param {boolean} hoverEffect - Active l'effet de survol lumineux.
 */
export const GlassCard = ({ 
  children, 
  className = '', 
  hoverEffect = true,
  variant = 'default'
}: { 
  children: React.ReactNode; 
  className?: string; 
  hoverEffect?: boolean;
  variant?: 'default' | 'neon';
}) => {
  const baseClasses = variant === 'neon' 
    ? "glass-neon p-6 rounded-2xl" 
    : "glass p-6 rounded-2xl border border-white/5 shadow-2xl";
    
  const hoverClasses = hoverEffect ? "glass-hover cursor-pointer" : "";
  
  return (
    <div className={`${baseClasses} ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
};

export default GlassCard;
