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
  const baseClasses = "px-6 py-2.5 rounded-xl font-black uppercase tracking-[0.15em] text-[10px] flex items-center justify-center gap-2.5 transition-all duration-300 active:scale-[0.98]";
  
  const variants = {
    green: "bg-pickle-green/5 border-pickle-green/20 text-pickle-green hover:bg-pickle-green hover:text-black hover:border-pickle-green hover:shadow-[0_0_20px_rgba(132,204,22,0.4)]",
    orange: "bg-pickle-orange/5 border-pickle-orange/20 text-pickle-orange hover:bg-pickle-orange hover:text-black hover:border-pickle-orange hover:shadow-[0_0_20px_rgba(251,146,60,0.4)]",
    pink: "bg-pickle-pink/5 border-pickle-pink/20 text-pickle-pink hover:bg-pickle-pink hover:text-white hover:border-pickle-pink hover:shadow-[0_0_20px_rgba(244,63,94,0.4)]",
    blue: "bg-pickle-blue/5 border-pickle-blue/20 text-pickle-blue hover:bg-pickle-blue hover:text-black hover:border-pickle-blue hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]",
  };

  const disabledClasses = "opacity-40 cursor-not-allowed grayscale pointer-events-none";

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
