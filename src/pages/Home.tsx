
import React, { useEffect, useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useTouchControls } from '../hooks/useTouchControls';
import { GameCanvas } from '../components/game/GameCanvas';
import { TouchControls } from '../components/game/TouchControls';
import { GameHUD } from '../components/game/GameHUD';
import { MainMenu } from '../components/ui/MainMenu';
import { SettingsMenu } from '../components/ui/SettingsMenu';
import { PauseMenu } from '../components/ui/PauseMenu';
import { GameOverScreen } from '../components/ui/GameOverScreen';

const Index = () => {
  const {
    gameState,
    settings,
    startGame,
    pauseGame,
    resumeGame,
    endGame,
    returnToMenu,
    openSettings,
    startBossBattle,
    endBossBattle,
    loseLife,
    gainLife,
    updateDistance,
    updateScore,
    updateSettings,
    checkPauseTimeout,
    shouldTriggerBoss,
  } = useGameState();

  const {
    controls,
    handleTouchStart,
    handleTouchEnd,
    handleShoot,
  } = useTouchControls();

  const [missileCount, setMissileCount] = useState(3);

  // Handle ESC key for pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && gameState.status === 'playing') {
        pauseGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.status, pauseGame]);

  // Check for boss battle triggers
  useEffect(() => {
    if (shouldTriggerBoss()) {
      startBossBattle();
    }
  }, [shouldTriggerBoss, startBossBattle]);

  // Handle boss spawn
  const handleBossSpawn = (boss: any) => {
    // Boss spawned, already handled by state
  };

  // Handle boss defeated
  const handleBossDefeated = () => {
    endBossBattle();
  };

  // Handle missile count changes
  const handleMissileCountChange = (count: number) => {
    setMissileCount(count);
  };

  // Handle ad watching (placeholder)
  const handleWatchAd = () => {
    console.log('Playing rewarded ad...');
    // In a real app, this would integrate with an ad network
    setTimeout(() => {
      console.log('Ad completed, granting life');
      gainLife();
      startGame();
    }, 2000);
  };

  // Apply dark mode settings
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const renderCurrentScreen = () => {
    switch (gameState.status) {
      case 'menu':
        return (
          <MainMenu
            onStartGame={startGame}
            onOpenSettings={openSettings}
          />
        );

      case 'settings':
        return (
          <SettingsMenu
            settings={settings}
            onUpdateSettings={updateSettings}
            onBack={returnToMenu}
          />
        );

      case 'playing':
      case 'paused':
      case 'boss_battle':
        return (
          <div className="relative w-full h-screen overflow-hidden">
            <GameCanvas
              isPlaying={gameState.status === 'playing' || gameState.status === 'boss_battle'}
              controls={controls}
              speed={gameState.speed}
              difficulty={gameState.difficulty}
              isBossBattle={gameState.status === 'boss_battle'}
              currentBoss={gameState.currentBoss}
              onLifeLost={loseLife}
              onScoreUpdate={updateScore}
              onDistanceUpdate={updateDistance}
              onBossSpawn={handleBossSpawn}
              onBossDefeated={handleBossDefeated}
              onMissileCountChange={handleMissileCountChange}
              gameState={gameState}
              gainLife={gainLife}
            />
            
            <GameHUD
              gameState={gameState}
              missiles={missileCount}
              onPause={pauseGame}
              onSettings={openSettings}
            />
            
            <TouchControls
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onShoot={handleShoot}
            />

            {gameState.status === 'paused' && (
              <PauseMenu
                onResume={resumeGame}
                onSettings={openSettings}
                onMainMenu={returnToMenu}
                onCheckTimeout={checkPauseTimeout}
              />
            )}
          </div>
        );

      case 'gameOver':
        return (
          <div className="relative w-full h-screen game-background">
            <GameOverScreen
              score={gameState.score}
              distance={gameState.distance}
              onRestart={startGame}
              onMainMenu={returnToMenu}
              onWatchAd={handleWatchAd}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full h-screen overflow-hidden">
      {renderCurrentScreen()}
    </div>
  );
};

export default Index;

