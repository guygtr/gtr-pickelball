import React from 'react';

/**
 * NeonButton - Bouton premium avec effet glow néon.
 * 
 * @param {string} children - Étiquette du bouton.
 * @param {string} className - Classes CSS additionnelles.
 * @param {function} onClick - Action au clic.
 */
export const NeonButton = ({ children, className = '', onClick }) => {
  const baseClasses = "px-6 py-2 rounded-lg font-heading font-medium tracking-wide transition-all duration-300";
  const neonClasses = "bg-transparent border border-[var(--color-gold)]/30 text-[var(--color-gold)] hover:bg-[var(--color-gold)]/10 hover:border-[var(--color-gold)] hover:shadow-gold text-glow";
  
  return (
    <button 
      className={`${baseClasses} ${neonClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default NeonButton;
