
import React from 'react';
import { Button } from './button';
import { Switch } from './switch';
import { ArrowLeft } from 'lucide-react';
import { GameSettings } from '../../types/game';

interface SettingsMenuProps {
  settings: GameSettings;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  onBack: () => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  settings,
  onUpdateSettings,
  onBack,
}) => {
  return (
    <div className="min-h-screen game-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="glass-effect text-white mr-4"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
        </div>

        {/* Settings Options */}
        <div className="space-y-6">
          <div className="glass-effect p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Audio</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label htmlFor="sound-effects" className="text-white">
                  Sound Effects
                </label>
                <Switch
                  id="sound-effects"
                  checked={settings.soundEffects}
                  onCheckedChange={(checked) => 
                    onUpdateSettings({ soundEffects: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label htmlFor="music" className="text-white">
                  Background Music
                </label>
                <Switch
                  id="music"
                  checked={settings.music}
                  onCheckedChange={(checked) => 
                    onUpdateSettings({ music: checked })
                  }
                />
              </div>
            </div>
          </div>

          <div className="glass-effect p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Display</h2>
            
            <div className="flex items-center justify-between">
              <label htmlFor="dark-mode" className="text-white">
                Dark Mode UI
              </label>
              <Switch
                id="dark-mode"
                checked={settings.darkMode}
                onCheckedChange={(checked) => 
                  onUpdateSettings({ darkMode: checked })
                }
              />
            </div>
          </div>

          <div className="glass-effect p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Controls</h2>
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Desktop:</strong> Arrow keys or WASD to move, Space to shoot</p>
              <p><strong>Mobile:</strong> Touch controls to move, Rocket button to shoot</p>
              <p><strong>Pause:</strong> Press pause button or ESC key</p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Button
            onClick={onBack}
            className="game-button"
          >
            Back to Menu
          </Button>
        </div>
      </div>
    </div>
  );
};
