"use client";

import React from 'react';

export const BackgroundScene: React.FC = () => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none select-none bg-[#020617] perspective-[1200px]">
      {/* 1. Global Defs (Patterns & Filters) */}
      <svg className="absolute w-0 h-0">
        <defs>
          {/* Honeycomb Pattern (Nid d'abeille) */}
          <pattern id="honeycomb" x="0" y="0" width="12" height="10.4" patternUnits="userSpaceOnUse" patternTransform="scale(0.8)">
            <path 
              d="M 6 0 L 12 3.46 L 12 10.4 L 6 13.86 L 0 10.4 L 0 3.46 Z" 
              fill="none" 
              stroke="#22d3ee" 
              strokeWidth="0.3" 
              strokeOpacity="0.2" 
            />
          </pattern>

          {/* Ball Gradients (Validés) */}
          <radialGradient id="sphere-yellow" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="60%" stopColor="#dcfc44" />
            <stop offset="100%" stopColor="#879b00" />
          </radialGradient>

          <radialGradient id="sphere-orange" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffedd5" />
            <stop offset="60%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#ea580c" />
          </radialGradient>
        </defs>
      </svg>

      {/* 2. Atmosphere Mesh */}
      <div 
        className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_0%_0%,#1e3a8a_0%,transparent_50%),radial-gradient(circle_at_100%_100%,#0f172a_0%,transparent_50%)]" 
      />

      {/* 3. Ball Assets (Validés) */}

      {/* Optic Yellow Ball */}
      <div 
        className="absolute top-[15%] left-[10%] animate-float-slow"
        style={{ 
            filter: 'drop-shadow(0 0 30px rgba(220, 252, 68, 0.4)) drop-shadow(0 0 10px rgba(220, 252, 68, 0.6))',
            transform: 'translateZ(100px)'
        }}
      >
        <svg width="90" height="90" viewBox="0 0 100 100" fill="none" className="overflow-visible">
          <circle cx="50" cy="50" r="42" fill="url(#sphere-yellow)" />
          <ellipse cx="35" cy="35" rx="15" ry="10" fill="white" fillOpacity="0.3" transform="rotate(-30, 35, 35)" />
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <circle 
              key={i} 
              cx={(50 + 26 * Math.cos(angle * Math.PI / 180)).toFixed(3)} 
              cy={(50 + 26 * Math.sin(angle * Math.PI / 180)).toFixed(3)} 
              r="4.5" 
              fill="#060b1d" 
            />
          ))}
          <circle cx="50" cy="50" r="5" fill="#060b1d" />
        </svg>
      </div>

      {/* Fire Orange Ball */}
      <div 
        className="absolute bottom-[20%] right-[10%] animate-float-slow"
        style={{ 
            animationDelay: '-5s',
            filter: 'drop-shadow(0 0 35px rgba(251, 146, 60, 0.4)) drop-shadow(0 0 10px rgba(251, 146, 60, 0.6))',
            transform: 'translateZ(140px)'
        }}
      >
        <svg width="120" height="120" viewBox="0 0 100 100" fill="none" className="overflow-visible">
          <circle cx="50" cy="50" r="42" fill="url(#sphere-orange)" />
          <ellipse cx="35" cy="35" rx="18" ry="12" fill="white" fillOpacity="0.25" transform="rotate(-30, 35, 35)" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <circle 
              key={i} 
              cx={(50 + 28 * Math.cos(angle * Math.PI / 180)).toFixed(3)} 
              cy={(50 + 28 * Math.sin(angle * Math.PI / 180)).toFixed(3)} 
              r="4" 
              fill="#060b1d" 
            />
          ))}
          <circle cx="50" cy="50" r="5" fill="#060b1d" />
        </svg>
      </div>

      {/* 4. Elite Mesh Paddles (Redesigned Style Maquette) */}

      {/* Paddle 1 (Top Right) */}
      <div 
        className="absolute top-[8%] right-[8%] animate-float-slow"
        style={{ 
            animationDelay: '-8s',
            transform: 'rotateY(-25deg) rotateX(15deg) translateZ(50px)',
            filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))'
        }}
      >
        <div style={{ backdropFilter: 'blur(3px)' }}>
          <svg width="340" height="440" viewBox="0 0 100 150" fill="none" className="overflow-visible">
            {/* Paddle Face with Honeycomb Pattern */}
            <path 
              d="M 20 20 Q 20 0 50 0 Q 80 0 80 20 L 80 80 Q 80 100 50 100 Q 20 100 20 80 Z" 
              fill="url(#honeycomb)"
              fillOpacity="0.4"
              stroke="#22d3ee" 
              strokeWidth="0.8"
              strokeOpacity="0.6"
              style={{ filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.5))' }}
            />
            {/* Grip handle */}
            <rect x="42" y="100" width="16" height="40" rx="2" fill="#0f172a" fillOpacity="0.8" stroke="#1e293b" strokeWidth="0.5" />
            {/* Subliminal Brand Logo */}
            <text x="50" y="60" fill="#22d3ee" fontSize="24" fontWeight="100" textAnchor="middle" opacity="0.08">P</text>
          </svg>
        </div>
      </div>

      {/* Paddle 2 (Bottom Left) */}
      <div 
        className="absolute bottom-[2%] left-[5%] animate-float-slow"
        style={{ 
            animationDelay: '-15s',
            transform: 'rotateY(30deg) rotateX(-10deg) translateZ(80px)',
            filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))'
        }}
      >
        <div style={{ backdropFilter: 'blur(3px)' }}>
          <svg width="260" height="360" viewBox="0 0 100 150" fill="none" className="overflow-visible">
            <path 
              d="M 20 20 Q 20 0 50 0 Q 80 0 80 20 L 80 80 Q 80 100 50 100 Q 20 100 20 80 Z" 
              fill="url(#honeycomb)"
              fillOpacity="0.3"
              stroke="#22d3ee" 
              strokeWidth="0.6"
              strokeOpacity="0.4"
              style={{ filter: 'drop-shadow(0 0 6px rgba(34, 211, 238, 0.4))' }}
            />
            <rect x="44" y="100" width="12" height="35" rx="2" fill="#0f172a" fillOpacity="0.8" stroke="#1e293b" strokeWidth="0.5" />
          </svg>
        </div>
      </div>

      {/* 5. Depth Fog & Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_40%,#020617_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#020617] opacity-60" />
    </div>
  );
};
