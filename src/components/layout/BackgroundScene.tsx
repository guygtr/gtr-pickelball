"use client";

import React from 'react';

export const BackgroundScene: React.FC = () => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[-100] overflow-hidden pointer-events-none select-none bg-[#020617]">
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 2s ease-out forwards;
        }
      `}</style>

      {/* 1. Global Atmosphere (Ambient Light) */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,#1e3a8a_0%,transparent_60%),radial-gradient(circle_at_80%_80%,#0f172a_0%,transparent_60%)] animate-fade-in" />
      
      {/* 2. Professional Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_45%,#020617_110%)] animate-fade-in" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#020617] opacity-80 animate-fade-in" />
      
      {/* 3. Subtle Animated Grain / Texture (Optional for premium feel) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};
