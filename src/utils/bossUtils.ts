// src/utils/bossUtils.ts
import { Boss, PowerUp } from '../types/game';

export function handleBossDefeat(
  prev: Boss,
  difficulty: number,
  generateId: () => string,
  setBossExplosion: (explosion: { x: number; y: number; frame: number } | null) => void,
  setPowerUps: (powerUps: PowerUp[]) => void,
  powerUpsRef: React.MutableRefObject<PowerUp[]>,
  setCurrentBoss: (boss: Boss | undefined) => void,
  currentBossRef: React.MutableRefObject<Boss | undefined>,
  setGamePhase: (phase: 'playing' | 'stageClear') => void,
  setStageClearCountdown: (count: number) => void,
  scoreRef: React.MutableRefObject<number>,
  bossDefeatedRef: React.MutableRefObject<boolean>,
  playSound: (key: string) => void
) {
  playSound('boss_defeated');
  scoreRef.current += 1000 + difficulty * 500;
  bossDefeatedRef.current = true;

  const bossCenterX = prev.position.x + prev.size.width / 2;
  const bossCenterY = prev.position.y + prev.size.height / 2;
  setBossExplosion({ x: bossCenterX, y: bossCenterY, frame: 0 });

  const extraLife: PowerUp = {
    id: generateId(),
    position: { x: bossCenterX - 15, y: bossCenterY },
    size: { width: 30, height: 30 },
    velocity: { x: 0, y: 2 },
    type: 'extra_life',
    collected: false,
  };
  powerUpsRef.current.push(extraLife);
  setPowerUps([...powerUpsRef.current]);

  setCurrentBoss(undefined);
  currentBossRef.current = undefined;

  setTimeout(() => {
    setGamePhase('stageClear');
    setStageClearCountdown(3);
  }, 0);
}
