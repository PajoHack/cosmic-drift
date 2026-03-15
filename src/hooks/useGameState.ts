
import { useState, useCallback, useRef } from 'react';
import { GameState, GameSettings } from '../types/game';
import { useHighScore } from './useHighScore';

const initialGameState: GameState = {
  status: 'menu',
  lives: 3,
  distance: 0,
  score: 0,
  highScore: 0,
  furthestDistance: 0,
  speed: 2,
  lastSpawn: 0,
  spawnRate: 2000, // milliseconds
  difficulty: 1,
  lastBossDistance: 0,
  lastPowerUpSpawn: 0,
};

const initialSettings: GameSettings = {
  soundEffects: true,
  music: true,
  darkMode: false,
};

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>({
    ...initialGameState,
    difficulty: 1,
  });
  const [settings, setSettings] = useState<GameSettings>(initialSettings);
  const pauseStartTime = useRef<number | null>(null);
  const pausedFromStatus = useRef<'playing' | 'boss_battle'>('playing');
  const lastBossDefeatedTime = useRef<number | null>(null);
  const { highScore, furthestDistance, updateHighScore, updateFurthestDistance } = useHighScore();

  const startGame = useCallback(() => {
    setGameState(prev => ({
      ...initialGameState,
      status: 'playing',
      highScore: highScore,
      furthestDistance: furthestDistance,
      lastBossDistance: 0, // ✅ ADD THIS
    }));
  }, [highScore, furthestDistance]);

  const pauseGame = useCallback(() => {
    if (gameState.status === 'playing' || gameState.status === 'boss_battle') {
      pausedFromStatus.current = gameState.status;
      setGameState(prev => ({ ...prev, status: 'paused' }));
      pauseStartTime.current = Date.now();
    }
  }, [gameState.status]);

  const resumeGame = useCallback(() => {
    if (gameState.status === 'paused') {
      setGameState(prev => ({ ...prev, status: pausedFromStatus.current }));
      pauseStartTime.current = null;
    }
  }, [gameState.status]);

  const endGame = useCallback(() => {
    setGameState(prev => {
      const isNewHighScore = updateHighScore(prev.score);
      const isNewFurthestDistance = updateFurthestDistance(prev.distance);

      return {
        ...prev,
        status: 'gameOver',
        highScore: isNewHighScore ? prev.score : prev.highScore,
        furthestDistance: isNewFurthestDistance ? prev.distance : prev.furthestDistance,
      };
    });
  }, [updateHighScore, updateFurthestDistance]);

  const returnToMenu = useCallback(() => {
    setGameState(prev => ({ ...prev, status: 'menu' }));
  }, []);

  const openSettings = useCallback(() => {
    setGameState(prev => ({ ...prev, status: 'settings' }));
  }, []);

  const startBossBattle = useCallback(() => {
    setGameState(prev => {
      console.log('🚀 Starting boss battle at distance:', prev.distance);
      return {
        ...prev,
        status: 'boss_battle',
        lastBossDistance: prev.distance,
      };
    });
  }, []);

  const endBossBattle = useCallback(() => {
    setGameState(prev => {
      console.log('✅ Boss defeated at distance:', prev.distance);
      lastBossDefeatedTime.current = Date.now(); // ⏱️ Track defeat time
      return {
        ...prev,
        status: 'playing',
        currentBoss: undefined,
        lastBossDistance: prev.distance,
      };
    });
  }, []);

  const loseLife = useCallback(() => {
    setGameState(prev => {
      const newLives = prev.lives - 1;
      if (newLives <= 0) {
        return { ...prev, lives: 0, status: 'gameOver' };
      }
      return { ...prev, lives: newLives };
    });
  }, []);

  const gainLife = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      lives: Math.min(prev.lives + 1, 5), // Max 5 lives
    }));
  }, []);

  const updateDistance = useCallback((delta: number) => {
    setGameState(prev => {
      const newDistance = prev.distance + delta;
      const newDifficulty = Math.floor(newDistance / 2000) + 1;
      
      return {
        ...prev,
        distance: newDistance,
        speed: Math.min(prev.speed + delta * 0.0008, 10),
        difficulty: newDifficulty,
      };
    });
  }, []);

  const updateScore = useCallback((points: number) => {
    setGameState(prev => ({
      ...prev,
      score: prev.score + points,
    }));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const checkPauseTimeout = useCallback(() => {
    if (pauseStartTime.current && Date.now() - pauseStartTime.current > 120000) { // 2 minutes
      console.log('Pause timeout - showing ad');
      pauseStartTime.current = Date.now();
      return true;
    }
    return false;
  }, []);

  // Check if boss battle should trigger (every light year = 1000 distance units)
  const shouldTriggerBoss = useCallback(() => {
    const now = Date.now();
    const lightYearsCompleted = Math.floor(gameState.distance / 1000);
    const lastBossLightYear = Math.floor(gameState.lastBossDistance / 1000);
    const timeSinceLastBoss = now - (lastBossDefeatedTime.current ?? 0);

    return (
      lightYearsCompleted > lastBossLightYear &&
      gameState.status === 'playing' &&
      timeSinceLastBoss > 60000 // 60 seconds cooldown
    );
  }, [gameState.distance, gameState.lastBossDistance, gameState.status]);

  return {
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
  };
};
