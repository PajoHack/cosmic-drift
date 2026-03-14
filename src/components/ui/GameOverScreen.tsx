
import React from 'react';
import { Button } from './button';
import { Play, Home } from 'lucide-react';
import { distanceToLightYears } from '../../utils/gameUtils';

interface GameOverScreenProps {
  score: number;
  distance: number;
  onRestart: () => void;
  onMainMenu: () => void;
  onWatchAd: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  score,
  distance,
  onRestart,
  onMainMenu,
  onWatchAd,
}) => {
  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-effect p-8 rounded-lg max-w-md w-full text-center animate-fade-in">
        <h2 className="text-4xl font-bold text-red-400 mb-4">Mission Failed</h2>
        
        <div className="mb-8 space-y-3">
          <div className="text-white">
            <p className="text-lg">Distance Traveled</p>
            <p className="text-3xl font-bold text-blue-400">
              {distanceToLightYears(distance)}
            </p>
          </div>
          
          <div className="text-white">
            <p className="text-lg">Final Score</p>
            <p className="text-2xl font-bold text-green-400">
              {score.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={onRestart}
            className="game-button w-full"
          >
            <Play className="mr-3" size={20} />
            New Mission
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
          {distance > 5000 ? "Impressive journey, Commander!" : "Train harder, pilot!"}
        </div>
      </div>
    </div>
  );
};
