import React from 'react';

export const KomorebiBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* GPU Accelerated layers of soft light */}
      <div 
        className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-wood/3 rounded-full blur-[80px] md:blur-[180px] animate-float" 
        style={{ willChange: 'transform', transform: 'translateZ(0)' }}
      />
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fire/3 rounded-full blur-[70px] md:blur-[160px] animate-float" 
        style={{ animationDelay: '-3.5s', willChange: 'transform', transform: 'translateZ(0)' }} 
      />
      <div 
        className="absolute top-[30%] right-[15%] w-[40%] h-[40%] bg-water/3 rounded-full blur-[60px] md:blur-[140px] animate-float" 
        style={{ animationDelay: '-7s', willChange: 'transform', transform: 'translateZ(0)' }} 
      />
      <div 
        className="absolute bottom-[20%] left-[10%] w-[35%] h-[35%] bg-earth/3 rounded-full blur-[50px] md:blur-[120px] animate-float" 
        style={{ animationDelay: '-10.5s', willChange: 'transform', transform: 'translateZ(0)' }} 
      />
      
      {/* Pulsing light cores */}
      <div className="absolute top-[10%] left-[20%] w-32 h-32 bg-white/5 rounded-full blur-[40px] md:blur-[80px] animate-pulse-soft" style={{ transform: 'translateZ(0)' }} />
      <div className="absolute bottom-[15%] right-[25%] w-48 h-48 bg-white/5 rounded-full blur-[50px] md:blur-[100px] animate-pulse-soft" style={{ animationDelay: '-2.5s', transform: 'translateZ(0)' }} />


      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/p6.png')]" />
      
      {/* Vignette for focus */}
      <div className="absolute inset-0 bg-radial-[circle_at_center,_transparent_0%,_rgba(253,252,248,0.5)_100%]" />
    </div>
  );
};
