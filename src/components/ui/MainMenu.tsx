
import React from 'react';
import { Button } from './button';
import { Settings, Play } from 'lucide-react';

interface MainMenuProps {
  onStartGame: () => void;
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, onOpenSettings }) => {
  return (
    <div className="min-h-screen game-background flex items-center justify-center p-4">
      {/* Animated Background Stars */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Shooting Star Effect */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shooting-star"
            style={{
              animationDelay: `${i * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center">
        {/* Game Title */}
        <div className="mb-12">
          <h1 className="text-6xl md:text-8xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-fade-in">
            COSMIC
          </h1>
          <h2 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-400 bg-clip-text text-transparent animate-fade-in animation-delay-300">
            DRIFT
          </h2>
          <p className="text-xl text-muted-foreground animate-fade-in animation-delay-600">
            Navigate the cosmos. Survive the void.
          </p>
        </div>

        {/* Menu Buttons */}
        <div className="space-y-4 animate-slide-up animation-delay-900">
          <Button
            onClick={onStartGame}
            className="game-button w-64 h-16 text-xl"
          >
            <Play className="mr-3" size={24} />
            START MISSION
          </Button>
          
          <div className="pt-4">
            <Button
              variant="ghost"
              onClick={onOpenSettings}
              className="glass-effect text-white hover:bg-white/20 px-8 py-3"
            >
              <Settings className="mr-3" size={20} />
              Settings
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 text-sm text-muted-foreground animate-fade-in animation-delay-1200">
          <p>Use arrow keys or touch controls to move</p>
          <p>Press SPACE or tap the rocket button to shoot</p>
        </div>
      </div>
    </div>
  );
};
