import React from 'react';
import { Heart } from 'lucide-react';

interface OneUpHeartProps {
  size?: number;
  animated?: boolean;
  glowing?: boolean;
  className?: string;
}

const OneUpHeart = ({ 
  size = 64, 
  animated = true, 
  glowing = true, 
  className = "" 
}: OneUpHeartProps) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Glow effect background */}
      {glowing && (
        <div 
          className="absolute inset-0 bg-red-500/30 rounded-full blur-lg animate-pulse"
          style={{ 
            width: size * 1.2, 
            height: size * 1.2,
            left: '-10%',
            top: '-10%'
          }}
        />
      )}
      
      {/* Main heart icon */}
      <Heart
        size={size}
        className={`
          fill-red-500 text-red-500 drop-shadow-lg relative z-10
          ${animated ? 'animate-pulse hover:scale-110 transition-transform duration-200' : ''}
        `}
      />
      
      {/* 1UP text overlay */}
      <div 
        className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
        style={{ fontSize: size * 0.2 }}
      >
        <span 
          className="font-bold text-white drop-shadow-md tracking-wider"
          style={{ 
            textShadow: '1px 1px 2px rgba(0,0,0,0.8), 0 0 4px rgba(255,255,255,0.3)',
            fontSize: size * 0.18
          }}
        >
          1UP
        </span>
      </div>
      
      {/* Sparkle effects */}
      {animated && (
        <>
          <div 
            className="absolute top-0 right-0 w-2 h-2 bg-yellow-300 rounded-full animate-ping"
            style={{ 
              animationDelay: '0s',
              width: size * 0.08,
              height: size * 0.08
            }}
          />
          <div 
            className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-white rounded-full animate-ping"
            style={{ 
              animationDelay: '1s',
              width: size * 0.06,
              height: size * 0.06
            }}
          />
          <div 
            className="absolute top-1/4 left-0 w-1 h-1 bg-pink-300 rounded-full animate-ping"
            style={{ 
              animationDelay: '0.5s',
              width: size * 0.04,
              height: size * 0.04
            }}
          />
        </>
      )}
    </div>
  );
};

export default OneUpHeart;