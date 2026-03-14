
import React, { useEffect, useState } from 'react';
import { Button } from './button';
import { Play, Home, Settings } from 'lucide-react';

interface PauseMenuProps {
  onResume: () => void;
  onSettings: () => void;
  onMainMenu: () => void;
  onCheckTimeout: () => boolean;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onSettings,
  onMainMenu,
  onCheckTimeout,
}) => {
  const [showAdWarning, setShowAdWarning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (onCheckTimeout()) {
        setShowAdWarning(true);
        setTimeout(() => setShowAdWarning(false), 3000);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [onCheckTimeout]);

  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-effect p-8 rounded-lg max-w-sm w-full text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Game Paused</h2>
        
        {showAdWarning && (
          <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
            <p className="text-yellow-300 text-sm">
              Long pause detected - showing ad before resume
            </p>
          </div>
        )}
        
        <p className="text-muted-foreground mb-8">
          Ready to continue your mission?
        </p>

        <div className="space-y-4">
          <Button
            onClick={onResume}
            className="game-button w-full"
          >
            <Play className="mr-3" size={20} />
            Resume
          </Button>
          
          <Button
            variant="ghost"
            onClick={onSettings}
            className="glass-effect text-white hover:bg-white/20 w-full"
          >
            <Settings className="mr-3" size={20} />
            Settings
          </Button>
          
          <Button
            variant="ghost"
            onClick={onMainMenu}
            className="glass-effect text-white hover:bg-white/20 w-full"
          >
            <Home className="mr-3" size={20} />
            Main Menu
          </Button>
        </div>

        <div className="mt-6 text-xs text-muted-foreground">
          Tip: Pausing for over 2 minutes will show an ad
        </div>
      </div>
    </div>
  );
};
