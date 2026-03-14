import React from 'react';
import { Boss, Position } from '../../types/game';
import { generateId } from '../../utils/gameUtils';

interface BossConfig {
  health: number;
  size: { width: number; height: number };
  attackPattern: 'spread' | 'focused' | 'spiral';
  movePattern: 'side_to_side' | 'circular' | 'chase';
  shootInterval: number;
}

const BOSS_CONFIGS: Record<number, BossConfig> = {
  1: {
    health: 15,
    size: { width: 120, height: 80 },
    attackPattern: 'spread',
    movePattern: 'side_to_side',
    shootInterval: 1500,
  },
  2: {
    health: 25,
    size: { width: 140, height: 90 },
    attackPattern: 'focused',
    movePattern: 'circular',
    shootInterval: 1200,
  },
  3: {
    health: 35,
    size: { width: 160, height: 100 },
    attackPattern: 'spiral',
    movePattern: 'chase',
    shootInterval: 1000,
  },
};

const DEFAULT_BOSS_CONFIG: BossConfig = {
  health: 20,
  size: { width: 130, height: 85 },
  attackPattern: 'spread',
  movePattern: 'side_to_side',
  shootInterval: 1300,
};

export const createBoss = (canvasWidth: number, difficulty: number): Boss => {
  const bossLevel = Math.min(difficulty, 3);
  const config = BOSS_CONFIGS[bossLevel] || DEFAULT_BOSS_CONFIG;
  
  return {
    id: generateId(),
    position: {
      x: canvasWidth / 2 - config.size.width / 2,
      y: -config.size.height,
    },
    size: config.size,
    velocity: { x: 2, y: 1 },
    health: config.health + Math.floor(difficulty * 2), // Scale with difficulty
    maxHealth: config.health + Math.floor(difficulty * 2),
    lastShot: 0,
    shootInterval: Math.max(config.shootInterval - difficulty * 50, 800),
    phase: 1,
    animationFrame: 0,
    attackPattern: config.attackPattern,
    movePattern: config.movePattern,
    lastPhaseChange: 0,
  };
};

export const updateBossMovement = (
  boss: Boss,
  playerPosition: Position,
  canvasWidth: number,
  deltaTime: number
): Boss => {
  const updatedBoss = { ...boss };
  
  // Update animation frame
  updatedBoss.animationFrame = (boss.animationFrame + deltaTime * 0.01) % (Math.PI * 2);
  
  // Health-based phase progression
  const healthPercent = boss.health / boss.maxHealth;
  if (healthPercent < 0.7 && boss.phase === 1) {
    updatedBoss.phase = 2;
    updatedBoss.lastPhaseChange = Date.now();
  } else if (healthPercent < 0.3 && boss.phase === 2) {
    updatedBoss.phase = 3;
    updatedBoss.lastPhaseChange = Date.now();
  }
  
  // Movement patterns
  switch (boss.movePattern) {
    case 'side_to_side':
      if (boss.position.x <= 0 || boss.position.x >= canvasWidth - boss.size.width) {
        updatedBoss.velocity.x *= -1;
      }
      updatedBoss.velocity.y = Math.sin(boss.animationFrame * 2) * 0.5;
      break;
      
    case 'circular':
      const centerX = canvasWidth / 2;
      const radius = 100 + boss.phase * 20;
      updatedBoss.position.x = centerX + Math.cos(boss.animationFrame) * radius - boss.size.width / 2;
      updatedBoss.position.y = 50 + Math.sin(boss.animationFrame * 0.5) * 30;
      updatedBoss.velocity = { x: 0, y: 0 };
      break;
      
    case 'chase':
      const dx = playerPosition.x - boss.position.x;
      const dy = playerPosition.y - boss.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 0) {
        const speed = 1 + boss.phase * 0.5;
        updatedBoss.velocity.x = (dx / distance) * speed * 0.3;
        updatedBoss.velocity.y = Math.max((dy / distance) * speed * 0.2, -1);
      }
      break;
  }
  
  // Keep boss on screen
  updatedBoss.position.x = Math.max(0, Math.min(canvasWidth - boss.size.width, updatedBoss.position.x));
  updatedBoss.position.y = Math.max(-boss.size.height * 0.5, Math.min(200, updatedBoss.position.y));
  
  return updatedBoss;
};

interface BossHealthBarProps {
  boss: Boss;
  canvasWidth: number;
}

export const BossHealthBar: React.FC<BossHealthBarProps> = ({ boss, canvasWidth }) => {
  const healthPercent = (boss.health / boss.maxHealth) * 100;
  const barWidth = Math.min(canvasWidth * 0.6, 400);
  
  return (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10">
      <div className="glass-effect p-3 rounded-lg">
        <div className="text-white text-center mb-2 font-bold">
          BOSS - Phase {boss.phase}
        </div>
        <div className="w-full bg-gray-700 rounded-full h-4 border-2 border-purple-400">
          <div
            className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(0, healthPercent)}%` }}
          />
        </div>
        <div className="text-white text-center mt-1 text-sm">
          {boss.health} / {boss.maxHealth} HP
        </div>
      </div>
    </div>
  );
};
