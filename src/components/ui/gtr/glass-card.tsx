import React from 'react';

/**
 * GlassCard - Un composant conteneur avec effet Glassmorphism premium.
 * 
 * @param {string} children - Contenu de la carte.
 * @param {string} className - Classes CSS additionnelles.
 * @param {boolean} hoverEffect - Active l'effet de survol lumineux.
 */
export const GlassCard = ({ children, className = '', hoverEffect = true }) => {
  const baseClasses = "glass p-6 rounded-xl border border-white/10";
  const hoverClasses = hoverEffect ? "glass-hover cursor-pointer" : "";
  
  return (
    <div className={`${baseClasses} ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
};

export default GlassCard;
