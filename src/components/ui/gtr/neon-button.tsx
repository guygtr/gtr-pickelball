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
  variant = 'primary',
  disabled = false,
  type = 'button'
}: { 
  children: React.ReactNode; 
  className?: string; 
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'muted' | 'yellow';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}) => {
  const baseClasses = "px-6 py-2.5 rounded-xl font-black uppercase tracking-[0.15em] text-[10px] flex items-center justify-center gap-2.5 transition-all duration-500 active:scale-[0.98] backdrop-blur-sm";
  
  const variants = {
    primary: "bg-pickle-primary/5 border-white/10 text-pickle-primary/90 hover:bg-pickle-primary hover:text-white hover:border-pickle-primary hover:shadow-[0_8px_30px_rgb(227,24,55,0.4)] shadow-inner",
    muted: "bg-pickle-muted/5 border-white/10 text-pickle-muted/90 hover:bg-pickle-muted hover:text-white hover:border-pickle-muted hover:shadow-[0_8px_30px_rgb(150,32,2,0.4)] shadow-inner",
    tertiary: "bg-pickle-tertiary/5 border-white/10 text-pickle-tertiary/90 hover:bg-pickle-tertiary hover:text-white hover:border-pickle-tertiary hover:shadow-[0_8px_30px_rgb(59,130,246,0.4)] shadow-inner",
    secondary: "bg-pickle-secondary/5 border-white/10 text-pickle-secondary/90 hover:bg-pickle-secondary hover:text-black hover:border-pickle-secondary hover:shadow-[0_8px_30px_rgb(220,252,68,0.4)] shadow-inner",
    yellow: "bg-pickle-yellow/5 border-white/10 text-pickle-yellow/90 hover:bg-pickle-yellow hover:text-black hover:border-pickle-yellow hover:shadow-[0_8px_30px_rgb(253,224,71,0.4)] shadow-inner",
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
