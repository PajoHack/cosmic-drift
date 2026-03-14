import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Spaceship, Projectile, Asteroid, Enemy, Position, Boss, Missile, PowerUp } from '../src/types/game';
import { 
  generateId, 
  checkCollision, 
  clamp, 
  isOutOfBounds, 
  getRandomSpawnPosition,
  updateEnemyAI,
  createAsteroid,
  createEnemy,
  createBossProjectiles
} from '../src/utils/gameUtils';
import { drawSprite } from '../src/components/game/SpriteRenderer';
import { createBoss, updateBossMovement, BossHealthBar } from '../src/components/game/BossManager';

interface GameCanvasProps {
  isPlaying: boolean;
  controls: {
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    shoot: boolean;
    missile: boolean;
  };
  speed: number;
  difficulty: number;
  isBossBattle: boolean;
  currentBoss?: Boss;
  onLifeLost: () => void;
  onScoreUpdate: (points: number) => void;
  onDistanceUpdate: (distance: number) => void;
  onBossSpawn: (boss: Boss) => void;
  onBossDefeated: () => void;
  onMissileCountChange: (count: number) => void;
}

interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  opacity: number;
}

const soundMap = {
  boss_defeated: new Audio('/sounds/boss-dies.mp3'),
  explosion: new Audio('/sounds/explode.mp3'),
  shoot: new Audio('/sounds/laser.mp3'),
  life_lost: new Audio('/sounds/loose-life.mp3'),
  missile_launch: new Audio('/sounds/missile.mp3'),
  hit: new Audio('/sounds/hit.mp3'),
  enemy_shoot: new Audio('/sounds/enemy-shoot.mp3'),
  boss_hit: new Audio('/sounds/boss-hit.mp3'),
  missile_explosion: new Audio('/sounds/explode.mp3'),
  powerup_collect: new Audio('/sounds/powerup-collect.mp3'),
};

const StageClearDemo: React.FC<GameCanvasProps> = ({
  isPlaying,
  controls,
  speed,
  difficulty,
  isBossBattle,
  currentBoss: propsBoss,
  onLifeLost,
  onScoreUpdate,
  onDistanceUpdate,
  onBossSpawn,
  onBossDefeated,
  onMissileCountChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [gameStage, setGameStage] = useState(1);
  const [gamePhase, setGamePhase] = useState<'playing' | 'stageClear'>('stageClear');
  const [stageClearCountdown, setStageClearCountdown] = useState<number | null>(3);

  useEffect(() => {
    if (stageClearCountdown === null || gamePhase !== 'stageClear') return;

    const timer = setInterval(() => {
      setStageClearCountdown(prev => {
        if (prev === null) return null;

        if (prev <= 1) {
          clearInterval(timer);
          setGameStage(stage => stage + 1);
          setGamePhase('playing');
          return null;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stageClearCountdown, gamePhase]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full game-background"
        style={{ touchAction: 'none' }}
      />

      {/* STAGE CLEAR OVERLAY */}
      {gamePhase === 'stageClear' && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '32px',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '0 0 10px black',
            pointerEvents: 'none',
            zIndex: 50,
          }}
        >
          STAGE {gameStage} CLEARED
          {stageClearCountdown !== null && (
            <div style={{ fontSize: '20px', marginTop: 10 }}>
              Next wave in {stageClearCountdown}...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { StageClearDemo };
