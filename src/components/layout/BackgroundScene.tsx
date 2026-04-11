"use client";

import React from 'react';
import Image from 'next/image';

export const BackgroundScene: React.FC = () => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[-100] overflow-hidden pointer-events-none select-none bg-black">
      {/* 1. Final Studio Plate (User generated reference) */}
      <div className="absolute inset-0 opacity-100">
        <Image
          src="/Background.png"
          alt="Studio Atmosphere"
          fill
          className="object-cover"
          priority
          quality={100}
        />
      </div>

      {/* 2. Color Stretch / Boosters (Pour étirer le bleu, jaune/vert et rouge) */}
      <div className="absolute top-[-5%] left-[-5%] w-[80%] h-[80%] bg-blue-600/20 blur-[160px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute top-[-5%] right-[-5%] w-[80%] h-[80%] bg-[#dcfc44]/15 blur-[160px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-10%] w-[80%] h-[80%] bg-red-600/15 blur-[160px] rounded-full mix-blend-screen pointer-events-none" />
      
      {/* 2. Professional Finishing (Vignette & Micro-grain) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_30%,#020617_120%)] opacity-40" />
      <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      {/* 3. Deep Occlusion (Bottom Shadow for content contrast) */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#020617] to-transparent opacity-60" />
    </div>
  );
};
