import React from 'react';

/**
 * NeonButton - Bouton premium avec effet glow néon.
 * 
 * @param {string} children - Étiquette du bouton.
 * @param {string} className - Classes CSS additionnelles.
 * @param {function} onClick - Action au clic.
 */
export const NeonButton = ({ 
  children, 
  className = '', 
  onClick, 
  variant = 'green',
  disabled = false,
  type = 'button'
}: { 
  children: React.ReactNode; 
  className?: string; 
  onClick?: () => void;
  variant?: 'green' | 'orange' | 'pink' | 'blue';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}) => {
  const baseClasses = "px-6 py-2 rounded-lg font-heading font-medium tracking-wide transition-all duration-300 active:scale-95";
  
  const variants = {
    green: "border-pickle-green/30 text-pickle-green hover:bg-pickle-green/10 hover:border-pickle-green hover:shadow-[0_0_20px_rgba(220,252,68,0.3)]",
    orange: "border-pickle-orange/30 text-pickle-orange hover:bg-pickle-orange/10 hover:border-pickle-orange hover:shadow-[0_0_20px_rgba(251,146,60,0.3)]",
    pink: "border-pickle-pink/30 text-pickle-pink hover:bg-pickle-pink/10 hover:border-pickle-pink hover:shadow-[0_0_20px_rgba(244,63,94,0.3)]",
    blue: "border-pickle-blue/30 text-pickle-blue hover:bg-pickle-blue/10 hover:border-pickle-blue hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]",
  };

  const disabledClasses = "opacity-50 cursor-not-allowed grayscale pointer-events-none";

  return (
    <button 
      type={type}
      disabled={disabled}
      className={`${baseClasses} border ${variants[variant]} ${disabled ? disabledClasses : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default NeonButton;
