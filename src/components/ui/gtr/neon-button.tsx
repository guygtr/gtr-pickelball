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
  const baseClasses = "px-6 py-2.5 rounded-xl font-black uppercase tracking-[0.15em] text-[10px] flex items-center justify-center gap-2.5 transition-all duration-500 active:scale-[0.98] backdrop-blur-sm";
  
  const variants = {
    green: "bg-pickle-green/5 border-white/10 text-pickle-green/90 hover:bg-pickle-green hover:text-black hover:border-pickle-green hover:shadow-[0_8px_30px_rgb(132,204,22,0.3)] shadow-inner",
    orange: "bg-pickle-orange/5 border-white/10 text-pickle-orange/90 hover:bg-pickle-orange hover:text-black hover:border-pickle-orange hover:shadow-[0_8px_30px_rgb(251,146,60,0.3)] shadow-inner",
    pink: "bg-pickle-pink/5 border-white/10 text-pickle-pink/90 hover:bg-pickle-pink hover:text-white hover:border-pickle-pink hover:shadow-[0_8px_30px_rgb(244,63,94,0.3)] shadow-inner",
    blue: "bg-pickle-blue/5 border-white/10 text-pickle-blue/90 hover:bg-pickle-blue hover:text-black hover:border-pickle-blue hover:shadow-[0_8px_30px_rgb(34,211,238,0.3)] shadow-inner",
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
