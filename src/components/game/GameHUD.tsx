
import React from 'react';
import { GameState } from '../../types/game';
import { distanceToLightYears } from '../../utils/gameUtils';
import { Button } from '../ui/button';
import { Pause, Settings } from 'lucide-react';

interface GameHUDProps {
  gameState: GameState;
  missiles: number;
  onPause: () => void;
  onSettings: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({ gameState, missiles, onPause, onSettings }) => {
  return (
    <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none">
      <div className="flex justify-between items-start">
        {/* Game Stats */}
        <div className="glass-effect p-3 rounded-lg">
          <div className="text-white space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-red-400">❤️</span>
              <span className="text-sm">Lives: {gameState.lives}</span>
            </div>
            
            {/* Missile Count Display */}
            <div className="flex items-center space-x-2">
              <span className="text-blue-400">🚀</span>
              <span className="text-sm">Missiles: {missiles}/3</span>
            </div>
            
            <div className="text-sm">
              <div>Distance: {distanceToLightYears(gameState.distance)}</div>
              {gameState.furthestDistance > 0 && (
                <div className="text-green-400 text-xs">
                  Best: {distanceToLightYears(gameState.furthestDistance)}
                </div>
              )}
            </div>
            
            <div className="text-sm">
              <div>Score: {gameState.score.toLocaleString()}</div>
              {gameState.highScore > 0 && (
                <div className="text-yellow-400 text-xs">
                  High: {gameState.highScore.toLocaleString()} pts
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex space-x-2 pointer-events-auto">
          <Button
            variant="ghost"
            size="icon"
            className="glass-effect text-white"
            onClick={onSettings}
          >
            <Settings size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="glass-effect text-white"
            onClick={onPause}
          >
            <Pause size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};
