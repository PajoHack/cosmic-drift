import { Position, Size, GameObject, Enemy, Asteroid, Boss, Projectile } from '../types/game';

/**
 * Check if two game objects are colliding using AABB collision detection
 */
export const checkCollision = (obj1: GameObject, obj2: GameObject): boolean => {
  return (
    obj1.position.x < obj2.position.x + obj2.size.width &&
    obj1.position.x + obj1.size.width > obj2.position.x &&
    obj1.position.y < obj2.position.y + obj2.size.height &&
    obj1.position.y + obj1.size.height > obj2.position.y
  );
};

/**
 * Generate a unique ID for game objects
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Clamp a value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Linear interpolation between two values
 */
export const lerp = (start: number, end: number, factor: number): number => {
  return start + (end - start) * factor;
};

/**
 * Convert distance to light years for display
 */
export const distanceToLightYears = (distance: number): string => {
  const lightYears = (distance / 1000).toFixed(2);
  return `${lightYears} LY`;
};

/**
 * Check if an object is outside the game bounds (for cleanup)
 */
export const isOutOfBounds = (obj: GameObject, canvasWidth: number, canvasHeight: number): boolean => {
  return (
    obj.position.x + obj.size.width < -50 ||
    obj.position.x > canvasWidth + 50 ||
    obj.position.y + obj.size.height < -50 ||
    obj.position.y > canvasHeight + 100
  );
};

/**
 * Calculate the distance between two positions
 */
export const getDistance = (pos1: Position, pos2: Position): number => {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Generate random position for spawning objects
 */
export const getRandomSpawnPosition = (canvasWidth: number, objectWidth: number): Position => {
  const side = Math.random();
  
  if (side < 0.7) {
    // Spawn from top
    return {
      x: Math.random() * (canvasWidth - objectWidth),
      y: -50
    };
  } else {
    // Spawn from sides
    return {
      x: Math.random() < 0.5 ? -50 : canvasWidth + 10,
      y: Math.random() * 200 - 100
    };
  }
};

/**
 * Enhanced enemy AI behavior with new sideways shooter type
 */
export const updateEnemyAI = (enemy: Enemy, playerPosition: Position, canvasWidth: number, canvasHeight: number, deltaTime: number): Enemy => {
  const updatedEnemy = { ...enemy };
  const distanceToPlayer = getDistance(enemy.position, playerPosition);
  
  switch (enemy.aiType) {
    case 'chaser':
      // Move toward player
      const chaseSpeed = 2;
      const dx = playerPosition.x - enemy.position.x;
      const dy = playerPosition.y - enemy.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        updatedEnemy.velocity.x = (dx / distance) * chaseSpeed;
        updatedEnemy.velocity.y = (dy / distance) * chaseSpeed + 1; // Always move down somewhat
      }
      break;
      
    case 'shooter':
      // Move in formation and shoot at intervals
      updatedEnemy.velocity.y = 1.5;
      updatedEnemy.velocity.x = Math.sin(Date.now() * 0.002) * 1;
      break;
      
    case 'kamikaze':
      // Aggressive pursuit
      const kamikazeSpeed = 3;
      const kdx = playerPosition.x - enemy.position.x;
      const kdy = playerPosition.y - enemy.position.y;
      const kdistance = Math.sqrt(kdx * kdx + kdy * kdy);
      
      if (kdistance > 0) {
        updatedEnemy.velocity.x = (kdx / kdistance) * kamikazeSpeed;
        updatedEnemy.velocity.y = (kdy / kdistance) * kamikazeSpeed;
      }
      break;
      
    case 'sideways_shooter':
      // Move horizontally across screen and shoot sideways
      updatedEnemy.velocity.y = 1;
      updatedEnemy.velocity.x = enemy.position.x < canvasWidth / 2 ? 2 : -2;
      break;
  }
  
  // Update animation frame
  updatedEnemy.animationFrame = (enemy.animationFrame + deltaTime * 0.01) % (Math.PI * 2);
  
  return updatedEnemy;
};

/**
 * Create varied asteroid with different sizes and properties
 */
export const createAsteroid = (spawnPosition: Position, difficulty: number): Asteroid => {
  const sizeVariants = ['small', 'medium', 'large'] as const;
  const variant = sizeVariants[Math.floor(Math.random() * sizeVariants.length)];
  
  let size: Size;
  let baseSpeed: number;
  
  switch (variant) {
    case 'small':
      size = { width: 25, height: 25 };
      baseSpeed = 2 + difficulty * 0.5;
      break;
    case 'medium':
      size = { width: 40, height: 40 };
      baseSpeed = 1.5 + difficulty * 0.3;
      break;
    case 'large':
      size = { width: 60, height: 60 };
      baseSpeed = 1 + difficulty * 0.2;
      break;
  }
  
  return {
    id: generateId(),
    position: spawnPosition,
    size,
    velocity: {
      x: (Math.random() - 0.5) * 3,
      y: baseSpeed + Math.random() * 2
    },
    rotationSpeed: (Math.random() - 0.5) * 0.15,
    rotation: Math.random() * Math.PI * 2,
    size_variant: variant
  };
};

/**
 * Create enemy with AI type based on difficulty (including new sideways shooter)
 */
export const createEnemy = (spawnPosition: Position, difficulty: number): Enemy => {
  const aiTypes = ['chaser', 'shooter', 'kamikaze', 'sideways_shooter'] as const;
  const weights = difficulty < 2 ? [0.4, 0.3, 0.1, 0.2] : 
                 difficulty < 4 ? [0.3, 0.3, 0.2, 0.2] : 
                 [0.25, 0.25, 0.25, 0.25];
  
  let aiType: typeof aiTypes[number] = 'shooter';
  const rand = Math.random();
  let cumWeight = 0;
  
  for (let i = 0; i < weights.length; i++) {
    cumWeight += weights[i];
    if (rand < cumWeight) {
      aiType = aiTypes[i];
      break;
    }
  }
  
  return {
    id: generateId(),
    position: spawnPosition,
    size: { width: 35, height: 35 },
    velocity: { x: 0, y: 1 },
    health: aiType === 'kamikaze' ? 1 : 2,
    lastShot: Date.now(),
    shootInterval: aiType === 'sideways_shooter' ? 800 : 1500 + Math.random() * 1000,
    aiType,
    animationFrame: 0
  };
};

/**
 * Create boss projectiles with different attack patterns
 */
export const createBossProjectiles = (boss: Boss, playerPosition: Position): Projectile[] => {
  const projectiles: Projectile[] = [];
  const now = Date.now();
  
  if (now - boss.lastShot < boss.shootInterval) {
    return projectiles;
  }
  
  const centerX = boss.position.x + boss.size.width / 2;
  const centerY = boss.position.y + boss.size.height;
  
  switch (boss.attackPattern) {
    case 'focused':
      // Single aimed shot
      const dx = playerPosition.x - centerX;
      const dy = playerPosition.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        const speed = 8;
        projectiles.push({
          id: generateId(),
          position: { x: centerX - 3, y: centerY },
          size: { width: 6, height: 12 },
          velocity: { x: (dx / distance) * speed, y: (dy / distance) * speed },
          damage: 1,
          owner: 'boss',
        });
      }
      break;
      
    case 'spread':
      // Multiple projectiles in a spread pattern
      const angles = [-0.5, -0.25, 0, 0.25, 0.5];
      angles.forEach(angle => {
        const speed = 6;
        projectiles.push({
          id: generateId(),
          position: { x: centerX - 2, y: centerY },
          size: { width: 4, height: 10 },
          velocity: { x: Math.sin(angle) * speed, y: Math.cos(angle) * speed },
          damage: 1,
          owner: 'boss',
        });
      });
      break;
      
    case 'spiral':
      // Rotating spiral pattern
      const spiralCount = 6;
      const baseAngle = (now * 0.005) % (Math.PI * 2);
      
      for (let i = 0; i < spiralCount; i++) {
        const angle = baseAngle + (i * Math.PI * 2) / spiralCount;
        const speed = 5;
        projectiles.push({
          id: generateId(),
          position: { x: centerX - 2, y: centerY },
          size: { width: 4, height: 10 },
          velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed + 2 },
          damage: 1,
          owner: 'boss',
        });
      }
      break;
  }
  
  return projectiles;
};

/**
 * Performance optimization: Object pooling utility
 */
export class ObjectPool<T> {
  private available: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;

  constructor(createFn: () => T, resetFn: (obj: T) => void, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    
    // Pre-populate the pool
    for (let i = 0; i < initialSize; i++) {
      this.available.push(this.createFn());
    }
  }

  get(): T {
    if (this.available.length > 0) {
      return this.available.pop()!;
    }
    return this.createFn();
  }

  release(obj: T): void {
    this.resetFn(obj);
    this.available.push(obj);
  }
}
