import React from 'react';
import { Button } from '../ui/button';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface TouchControlsProps {
  onTouchStart: (control: string, touchId: number) => void;
  onTouchEnd: (control: string, touchId: number) => void;
  onShoot: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onTouchStart,
  onTouchEnd,
  onShoot,
}) => {
  const handleTouchStart = (control: string) => (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) {
      onTouchStart(control, touch.identifier);
    }
  };

  const handleTouchEnd = (control: string) => (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    if (touch) {
      onTouchEnd(control, touch.identifier);
    }
  };

  const handleShootTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    onShoot();
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Movement Controls - Left Side */}
      <div className="absolute left-4 bottom-20 pointer-events-auto">
        <div className="relative w-40 h-40">
          {/* Up */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-12 glass-effect text-white"
            onTouchStart={handleTouchStart('up')}
            onTouchEnd={handleTouchEnd('up')}
          >
            <ChevronUp size={24} />
          </Button>
          
          {/* Down */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-12 glass-effect text-white"
            onTouchStart={handleTouchStart('down')}
            onTouchEnd={handleTouchEnd('down')}
          >
            <ChevronDown size={24} />
          </Button>
          
          {/* Left */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 transform -translate-y-1/2 w-12 h-12 glass-effect text-white"
            onTouchStart={handleTouchStart('left')}
            onTouchEnd={handleTouchEnd('left')}
          >
            <ChevronLeft size={24} />
          </Button>
          
          {/* Right */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 transform -translate-y-1/2 w-12 h-12 glass-effect text-white"
            onTouchStart={handleTouchStart('right')}
            onTouchEnd={handleTouchEnd('right')}
          >
            <ChevronRight size={24} />
          </Button>
        </div>
      </div>

      {/* Shoot Button - Right Side */}
      <div className="absolute right-8 bottom-32 pointer-events-auto">
        <Button
          variant="ghost"
          size="lg"
          className="w-16 h-16 rounded-full glass-effect text-white font-bold text-xl"
          onTouchStart={handleShootTouch}
        >
          🚀
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="w-16 h-16 rounded-full glass-effect text-white font-bold text-xl"
          onTouchStart={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            if (touch) onTouchStart('missile', touch.identifier);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            if (touch) onTouchEnd('missile', touch.identifier);
          }}
        >
          🎯
        </Button>
      </div>
    </div>
  );
};
