import { useState, useCallback, useRef, useEffect } from 'react';
import { TouchControls } from '../types/game';

export const useTouchControls = () => {
  const [controls, setControls] = useState<TouchControls>({
    left: false,
    right: false,
    up: false,
    down: false,
    shoot: false,
    missile: false, // Added missile here
  });

  const touchRefs = useRef<{ [key: string]: number }>({});

  const handleTouchStart = useCallback((control: keyof TouchControls, touchId: number) => {
    touchRefs.current[control] = touchId;
    setControls(prev => ({ ...prev, [control]: true }));
  }, []);

  const handleTouchEnd = useCallback((control: keyof TouchControls, touchId: number) => {
    if (touchRefs.current[control] === touchId) {
      delete touchRefs.current[control];
      setControls(prev => ({ ...prev, [control]: false }));
    }
  }, []);

  const handleShoot = useCallback(() => {
    setControls(prev => ({ ...prev, shoot: true }));
    // Auto-release shoot after a short delay
    setTimeout(() => {
      setControls(prev => ({ ...prev, shoot: false }));
    }, 100);
  }, []);

  // Keyboard controls for desktop testing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setControls(prev => ({ ...prev, left: true }));
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          setControls(prev => ({ ...prev, right: true }));
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          setControls(prev => ({ ...prev, up: true }));
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          setControls(prev => ({ ...prev, down: true }));
          break;
        case ' ':
          e.preventDefault();
          handleShoot();
          break;
        case 'm':  // Added missile key down
        case 'M':
          setControls(prev => ({ ...prev, missile: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setControls(prev => ({ ...prev, left: false }));
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          setControls(prev => ({ ...prev, right: false }));
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          setControls(prev => ({ ...prev, up: false }));
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          setControls(prev => ({ ...prev, down: false }));
          break;
        case 'm':  // Added missile key up
        case 'M':
          setControls(prev => ({ ...prev, missile: false }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleShoot]);

  return {
    controls,
    setControls,         // Expose setControls so missile button can update state
    handleTouchStart,
    handleTouchEnd,
    handleShoot,
  };
};
