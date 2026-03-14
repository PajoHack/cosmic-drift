
// Game Type Definitions
export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface GameObject {
  id: string;
  position: Position;
  size: Size;
  velocity: Position;
}

export interface Spaceship extends GameObject {
  health: number;
  maxHealth: number;
  animationFrame: number;
  lastShot: number;
  missiles: number;
  maxMissiles: number;
  lastMissile: number;
}

export interface Projectile extends GameObject {
  damage: number;
  owner: 'player' | 'enemy' | 'boss';
}

export interface Missile extends GameObject {
  damage: number;
  blastRadius: number;
  explosionTime: number;
  isExploding: boolean;
}

export interface PowerUp extends GameObject {
  type: 'missile' | 'shield' | 'extra_life' | 'mine' | 'orbiting_orbs';
  collected: boolean;
}

export interface Asteroid extends GameObject {
  rotationSpeed: number;
  rotation: number;
  size_variant: 'small' | 'medium' | 'large';
}

export interface Enemy extends GameObject {
  health: number;
  lastShot: number;
  shootInterval: number;
  aiType: 'chaser' | 'shooter' | 'kamikaze' | 'sideways_shooter';
  target?: Position;
  animationFrame: number;
}

export interface Boss extends GameObject {
  health: number;
  maxHealth: number;
  lastShot: number;
  shootInterval: number;
  phase: number;
  animationFrame: number;
  attackPattern: 'spread' | 'focused' | 'spiral';
  movePattern: 'side_to_side' | 'circular' | 'chase';
  lastPhaseChange: number;
}

export interface GameState {
  status: 'menu' | 'playing' | 'paused' | 'gameOver' | 'settings' | 'boss_battle';
  lives: number;
  distance: number;
  score: number;
  highScore: number;
  furthestDistance: number;
  speed: number;
  lastSpawn: number;
  spawnRate: number;
  difficulty: number;
  currentBoss?: Boss;
  lastBossDistance: number;
  lastPowerUpSpawn: number;
}

export interface GameSettings {
  soundEffects: boolean;
  music: boolean;
  darkMode: boolean;
}

export interface TouchControls {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  shoot: boolean;
  missile: boolean;
}
