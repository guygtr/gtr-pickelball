"use client";

import React from 'react';

export const BackgroundScene: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none select-none bg-[#0a0a0c]">
      {/* 1. Official GTR Mesh Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-pickle-primary/10 blur-[120px] rounded-full animate-pulse-gentle" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-pickle-secondary/5 blur-[150px] rounded-full animate-pulse-gentle" style={{ animationDelay: '-5s' }} />
      <div className="absolute bottom-[20%] left-[-15%] w-[40%] h-[40%] bg-pickle-tertiary/5 blur-[130px] rounded-full animate-pulse-gentle" style={{ animationDelay: '-10s' }} />

      {/* 2. Court Grid Layer (Subtle SVG) */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <pattern id="court-pattern" x="0" y="0" width="10" height="20" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#court-pattern)" />
        {/* Main court lines */}
        <line x1="10" y1="0" x2="10" y2="100" stroke="white" strokeWidth="0.2" />
        <line x1="90" y1="0" x2="90" y2="100" stroke="white" strokeWidth="0.2" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="white" strokeWidth="0.3" />
        <line x1="50" y1="0" x2="50" y2="100" stroke="white" strokeWidth="0.1" strokeDasharray="1 1" />
      </svg>

      {/* 3. Ghost Floating Assets */}
      
      {/* Pickelball Ball (Top Right) */}
      <div className="absolute top-[15%] right-[10%] opacity-[0.04] animate-float-slow" style={{ animationDuration: '25s' }}>
        <svg width="200" height="200" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" stroke="white" strokeWidth="2" />
          <circle cx="30" cy="30" r="5" fill="white" />
          <circle cx="50" cy="25" r="5" fill="white" />
          <circle cx="70" cy="30" r="5" fill="white" />
          <circle cx="25" cy="50" r="5" fill="white" />
          <circle cx="75" cy="50" r="5" fill="white" />
          <circle cx="30" cy="70" r="5" fill="white" />
          <circle cx="50" cy="75" r="5" fill="white" />
          <circle cx="70" cy="70" r="5" fill="white" />
        </svg>
      </div>

      {/* Paddle (Bottom Left) */}
      <div className="absolute bottom-[10%] left-[5%] opacity-[0.03] animate-float-slow" style={{ animationDelay: '-7s', animationDuration: '30s' }}>
        <svg width="300" height="300" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(-15)">
          <rect x="25" y="10" width="50" height="60" rx="15" stroke="white" strokeWidth="2" />
          <rect x="42" y="70" width="16" height="25" rx="4" stroke="white" strokeWidth="2" />
          <line x1="30" y1="25" x2="70" y2="25" stroke="white" strokeWidth="1" opacity="0.3" />
          <line x1="30" y1="35" x2="70" y2="35" stroke="white" strokeWidth="1" opacity="0.3" />
          <line x1="30" y1="45" x2="70" y2="45" stroke="white" strokeWidth="1" opacity="0.3" />
        </svg>
      </div>

      {/* Vignette Effect */}
      <div className="absolute inset-0 bg-radial-[at_50%_50%] from-transparent via-transparent to-[#0a0a0c]/80" />
    </div>
  );
};
