import React, { useMemo } from 'react';
import { motion } from 'motion/react';

export const OceanBackground: React.FC = () => {
  // Generate random flickering light spots (Caustics)
  const lightSpots = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      size: Math.random() * 4 + 2,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.4 + 0.1,
    }));
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#0A1128]">
      {/* Breathing Background Gradient */}
      <div 
        className="absolute inset-0 animate-pulse-soft"
        style={{
          background: 'radial-gradient(circle at 50% 50%, #1A237E 0%, #0A1128 100%)',
        }}
      />

      {/* Warm Wood Energy Glows (Subtle) */}
      <motion.div
        animate={{
          x: [-30, 30, -30],
          y: [-30, 30, -30],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 20% 30%, rgba(168, 201, 127, 0.12) 0%, transparent 60%), radial-gradient(circle at 80% 70%, rgba(168, 201, 127, 0.08) 0%, transparent 60%)',
        }}
      />

      {/* SVG Water Ripple Filter Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay">
        <svg width="100%" height="100%">
          <filter id="waterRipple">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="5">
              <animate attributeName="baseFrequency" dur="40s" values="0.012;0.018;0.012" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale="30" />
          </filter>
          <rect width="100%" height="100%" filter="url(#waterRipple)" fill="rgba(255,255,255,0.1)" />
        </svg>
      </div>

      {/* Flickering Light Spots (Caustics) */}
      <div className="absolute inset-0 pointer-events-none">
        {lightSpots.map((spot) => (
          <motion.div
            key={spot.id}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, spot.opacity, 0],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: spot.duration,
              repeat: Infinity,
              delay: spot.delay,
              ease: "easeInOut",
            }}
            style={{
              position: 'absolute',
              left: `${spot.left}%`,
              top: `${spot.top}%`,
              width: `${spot.size}px`,
              height: `${spot.size}px`,
              backgroundColor: 'white',
              borderRadius: '50%',
              boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
              filter: 'blur(1px)',
            }}
          />
        ))}
      </div>

      {/* Surface Shimmer Overlay */}
      <motion.div
        animate={{
          opacity: [0.05, 0.15, 0.05],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 pointer-events-none bg-gradient-to-t from-transparent via-white/5 to-transparent"
      />
    </div>
  );
};
