import React from 'react';
import { GameObject, Boss } from '../../types/game';

interface SpriteRendererProps {
  ctx: CanvasRenderingContext2D;
  object: GameObject;
  spriteType: 'spaceship' | 'enemy' | 'asteroid' | 'projectile' | 'boss' | 'sideways_enemy' | 'missile' | 'missile_explosion' | 'powerup_missile' | 'powerup_shield' | 'powerup_1up' | 'powerup_mine' | 'powerup_orbit';
  animationFrame?: number;
  rotation?: number;
  isShooting?: boolean;
}

export const drawSprite = ({
  ctx,
  object,
  spriteType,
  animationFrame = 0,
  rotation = 0,
  isShooting = false,
}: SpriteRendererProps) => {
  const { position, size } = object;
  
  ctx.save();
  ctx.translate(position.x + size.width / 2, position.y + size.height / 2);
  
  if (rotation !== 0) {
    ctx.rotate(rotation);
  }

  switch (spriteType) {
    case 'spaceship':
      drawPlayerSpaceship(ctx, size, animationFrame, isShooting);
      break;
    case 'enemy':
      drawEnemySpaceship(ctx, size, animationFrame);
      break;
    case 'sideways_enemy':
      drawSidewaysEnemySpaceship(ctx, size, animationFrame);
      break;
    case 'boss':
      drawBossSpaceship(ctx, size, animationFrame, object as Boss);
      break;
    case 'asteroid':
      drawAsteroid(ctx, size, rotation);
      break;
    case 'projectile':
      drawProjectile(ctx, size, object);
      break;
    case 'missile':
      drawMissile(ctx, size, animationFrame);
      break;
    case 'missile_explosion':
      drawMissileExplosion(ctx, size, animationFrame);
      break;
    case 'powerup_missile':
      drawMissilePowerUp(ctx, size, animationFrame);
      break;
    case 'powerup_shield':
      drawShieldPowerUp(ctx, size, animationFrame);
    break;
    case 'powerup_1up':
      drawOneUpPowerUp(ctx, size, animationFrame);
    break;
    case 'powerup_mine':
      drawMinePowerUp(ctx, size, animationFrame);
    break;
    case 'powerup_orbit':
      drawOrbitPowerUp(ctx, size, animationFrame);
    break;
    }

  ctx.restore();
};

const drawPlayerSpaceship = (ctx: CanvasRenderingContext2D, size: { width: number; height: number }, frame: number, isShooting: boolean) => {
  const { width, height } = size;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  
  // Main body - sleek design with enhanced details
  ctx.fillStyle = '#00CCFF';
  ctx.beginPath();
  ctx.moveTo(0, -halfHeight);
  ctx.lineTo(halfWidth * 0.7, halfHeight * 0.3);
  ctx.lineTo(halfWidth * 0.3, halfHeight);
  ctx.lineTo(-halfWidth * 0.3, halfHeight);
  ctx.lineTo(-halfWidth * 0.7, halfHeight * 0.3);
  ctx.closePath();
  ctx.fill();
  
  // Hull highlights
  ctx.strokeStyle = '#66DDFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -halfHeight);
  ctx.lineTo(halfWidth * 0.5, halfHeight * 0.1);
  ctx.moveTo(0, -halfHeight);
  ctx.lineTo(-halfWidth * 0.5, halfHeight * 0.1);
  ctx.stroke();
  
  // Cockpit with enhanced glass effect
  ctx.fillStyle = '#0099DD';
  ctx.beginPath();
  ctx.ellipse(0, -halfHeight * 0.4, halfWidth * 0.35, halfHeight * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Cockpit glass reflection
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.ellipse(-halfWidth * 0.1, -halfHeight * 0.5, halfWidth * 0.15, halfHeight * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Enhanced engine glow with shooting effect
  const baseGlowIntensity = 0.5 + Math.sin(frame * 0.3) * 0.3;
  const shootingBoost = isShooting ? 0.4 : 0;
  const glowIntensity = Math.min(baseGlowIntensity + shootingBoost, 1);
  
  // Main engine
  ctx.fillStyle = `rgba(0, 255, 255, ${glowIntensity})`;
  ctx.fillRect(-halfWidth * 0.15, halfHeight * 0.7, halfWidth * 0.3, halfHeight * 0.3);
  
  // Engine particles when shooting
  if (isShooting) {
    for (let i = 0; i < 5; i++) {
      const particleX = (Math.random() - 0.5) * halfWidth * 0.3;
      const particleY = halfHeight * 0.9 + Math.random() * 10;
      ctx.fillStyle = `rgba(0, 255, 255, ${Math.random() * 0.8})`;
      ctx.fillRect(particleX, particleY, 2, 4);
    }
  }
  
  // Wing thrusters
  ctx.fillStyle = `rgba(0, 200, 255, ${glowIntensity * 0.7})`;
  ctx.fillRect(-halfWidth * 0.8, halfHeight * 0.2, halfWidth * 0.15, halfHeight * 0.15);
  ctx.fillRect(halfWidth * 0.65, halfHeight * 0.2, halfWidth * 0.15, halfHeight * 0.15);
  
  // Weapon hardpoints
  ctx.fillStyle = '#004466';
  ctx.fillRect(-halfWidth * 0.9, halfHeight * 0.1, halfWidth * 0.1, halfHeight * 0.2);
  ctx.fillRect(halfWidth * 0.8, halfHeight * 0.1, halfWidth * 0.1, halfHeight * 0.2);
  
  // Shooting muzzle flash
  if (isShooting) {
    ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
    ctx.fillRect(-3, -halfHeight - 5, 6, 8);
    
    // Side weapon flashes
    ctx.fillRect(-halfWidth * 0.85, halfHeight * 0.05, 4, 6);
    ctx.fillRect(halfWidth * 0.81, halfHeight * 0.05, 4, 6);
  }
};

const drawEnemySpaceship = (ctx: CanvasRenderingContext2D, size: { width: number; height: number }, frame: number) => {
  const { width, height } = size;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  
  // Main body - angular, menacing design
  ctx.fillStyle = '#FF4444';
  ctx.beginPath();
  ctx.moveTo(0, halfHeight);
  ctx.lineTo(halfWidth * 0.8, -halfHeight * 0.5);
  ctx.lineTo(halfWidth * 0.4, -halfHeight);
  ctx.lineTo(-halfWidth * 0.4, -halfHeight);
  ctx.lineTo(-halfWidth * 0.8, -halfHeight * 0.5);
  ctx.closePath();
  ctx.fill();
  
  // Hull details
  ctx.strokeStyle = '#AA2222';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-halfWidth * 0.6, -halfHeight * 0.3);
  ctx.lineTo(halfWidth * 0.6, -halfHeight * 0.3);
  ctx.stroke();
  
  // Weapon pods with enhanced detail
  ctx.fillStyle = '#CC2222';
  ctx.fillRect(-halfWidth * 0.9, -halfHeight * 0.3, halfWidth * 0.2, halfHeight * 0.6);
  ctx.fillRect(halfWidth * 0.7, -halfHeight * 0.3, halfWidth * 0.2, halfHeight * 0.6);
  
  // Weapon pod details
  ctx.fillStyle = '#881111';
  ctx.fillRect(-halfWidth * 0.85, -halfHeight * 0.1, halfWidth * 0.1, halfHeight * 0.2);
  ctx.fillRect(halfWidth * 0.75, -halfHeight * 0.1, halfWidth * 0.1, halfHeight * 0.2);
  
  // Cockpit
  ctx.fillStyle = '#660000';
  ctx.beginPath();
  ctx.ellipse(0, -halfHeight * 0.3, halfWidth * 0.2, halfHeight * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Engine glow
  const glowIntensity = 0.4 + Math.sin(frame * 0.4) * 0.2;
  ctx.fillStyle = `rgba(255, 100, 100, ${glowIntensity})`;
  ctx.fillRect(-halfWidth * 0.2, halfHeight * 0.8, halfWidth * 0.4, halfHeight * 0.2);
  
  // Engine particles
  for (let i = 0; i < 3; i++) {
    const particleX = (Math.random() - 0.5) * halfWidth * 0.4;
    const particleY = halfHeight * 0.9 + Math.random() * 8;
    ctx.fillStyle = `rgba(255, 80, 80, ${Math.random() * 0.6})`;
    ctx.fillRect(particleX, particleY, 1, 3);
  }
};

const drawSidewaysEnemySpaceship = (ctx: CanvasRenderingContext2D, size: { width: number; height: number }, frame: number) => {
  const { width, height } = size;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  
  // Main body - wider, more horizontal design
  ctx.fillStyle = '#FF8800';
  ctx.beginPath();
  ctx.moveTo(-halfWidth, 0);
  ctx.lineTo(-halfWidth * 0.3, -halfHeight * 0.8);
  ctx.lineTo(halfWidth * 0.3, -halfHeight * 0.8);
  ctx.lineTo(halfWidth, 0);
  ctx.lineTo(halfWidth * 0.3, halfHeight * 0.8);
  ctx.lineTo(-halfWidth * 0.3, halfHeight * 0.8);
  ctx.closePath();
  ctx.fill();
  
  // Hull highlights
  ctx.strokeStyle = '#FFAA44';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-halfWidth * 0.8, -halfHeight * 0.4);
  ctx.lineTo(halfWidth * 0.8, -halfHeight * 0.4);
  ctx.moveTo(-halfWidth * 0.8, halfHeight * 0.4);
  ctx.lineTo(halfWidth * 0.8, halfHeight * 0.4);
  ctx.stroke();
  
  // Side weapon pods
  ctx.fillStyle = '#CC6600';
  ctx.fillRect(-halfWidth, -halfHeight * 0.2, halfWidth * 0.3, halfHeight * 0.4);
  ctx.fillRect(halfWidth * 0.7, -halfHeight * 0.2, halfWidth * 0.3, halfHeight * 0.4);
  
  // Cockpit
  ctx.fillStyle = '#884400';
  ctx.beginPath();
  ctx.ellipse(0, 0, halfWidth * 0.3, halfHeight * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Engine trails on sides
  const glowIntensity = 0.4 + Math.sin(frame * 0.5) * 0.3;
  ctx.fillStyle = `rgba(255, 136, 0, ${glowIntensity})`;
  ctx.fillRect(-halfWidth * 1.1, -halfHeight * 0.1, halfWidth * 0.2, halfHeight * 0.2);
  ctx.fillRect(halfWidth * 0.9, -halfHeight * 0.1, halfWidth * 0.2, halfHeight * 0.2);
  
  // Side engine particles
  for (let i = 0; i < 2; i++) {
    const particleY = (Math.random() - 0.5) * halfHeight * 0.2;
    ctx.fillStyle = `rgba(255, 120, 0, ${Math.random() * 0.7})`;
    ctx.fillRect(-halfWidth * 1.2 - Math.random() * 8, particleY, 2, 3);
    ctx.fillRect(halfWidth * 1.1 + Math.random() * 8, particleY, 2, 3);
  }
};

const drawBossSpaceship = (ctx: CanvasRenderingContext2D, size: { width: number; height: number }, frame: number, boss: Boss) => {
  const { width, height } = size;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  
  // Health-based damage visualization
  const healthPercent = boss.health / boss.maxHealth;
  const damageIntensity = 1 - healthPercent;
  
  // Main body - massive, intimidating design
  ctx.fillStyle = `rgba(139, 0, 139, ${0.9 + healthPercent * 0.1})`;
  ctx.beginPath();
  ctx.moveTo(0, -halfHeight);
  ctx.lineTo(halfWidth * 0.9, -halfHeight * 0.3);
  ctx.lineTo(halfWidth, halfHeight * 0.5);
  ctx.lineTo(halfWidth * 0.6, halfHeight);
  ctx.lineTo(-halfWidth * 0.6, halfHeight);
  ctx.lineTo(-halfWidth, halfHeight * 0.5);
  ctx.lineTo(-halfWidth * 0.9, -halfHeight * 0.3);
  ctx.closePath();
  ctx.fill();
  
  // Battle damage effects
  if (damageIntensity > 0.3) {
    ctx.fillStyle = `rgba(255, 100, 100, ${damageIntensity * 0.6})`;
    for (let i = 0; i < 3; i++) {
      const damageX = (Math.random() - 0.5) * width * 0.8;
      const damageY = (Math.random() - 0.5) * height * 0.8;
      ctx.fillRect(damageX, damageY, 3, 3);
    }
  }
  
  // Hull armor plating
  ctx.strokeStyle = '#8B008B';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-halfWidth * 0.7, -halfHeight * 0.5);
  ctx.lineTo(halfWidth * 0.7, -halfHeight * 0.5);
  ctx.moveTo(-halfWidth * 0.8, 0);
  ctx.lineTo(halfWidth * 0.8, 0);
  ctx.moveTo(-halfWidth * 0.6, halfHeight * 0.5);
  ctx.lineTo(halfWidth * 0.6, halfHeight * 0.5);
  ctx.stroke();
  
  // Massive weapon arrays
  ctx.fillStyle = '#4B0048';
  ctx.fillRect(-halfWidth * 1.1, -halfHeight * 0.2, halfWidth * 0.3, halfHeight * 0.4);
  ctx.fillRect(halfWidth * 0.8, -halfHeight * 0.2, halfWidth * 0.3, halfHeight * 0.4);
  ctx.fillRect(-halfWidth * 0.4, halfHeight * 0.8, halfWidth * 0.8, halfHeight * 0.3);
  
  // Command bridge
  ctx.fillStyle = '#2D001F';
  ctx.beginPath();
  ctx.ellipse(0, -halfHeight * 0.4, halfWidth * 0.4, halfHeight * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Pulsing energy core
  const coreIntensity = 0.6 + Math.sin(frame * 0.6) * 0.4;
  ctx.fillStyle = `rgba(186, 85, 211, ${coreIntensity})`;
  ctx.beginPath();
  ctx.ellipse(0, 0, halfWidth * 0.3, halfHeight * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Phase-based visual effects
  if (boss.phase >= 2) {
    // Energy crackling effects
    ctx.strokeStyle = `rgba(255, 0, 255, ${0.7 + Math.sin(frame * 0.8) * 0.3})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < boss.phase; i++) {
      const angle = (frame + i * Math.PI / 2) % (Math.PI * 2);
      const startX = Math.cos(angle) * halfWidth * 0.6;
      const startY = Math.sin(angle) * halfHeight * 0.6;
      const endX = Math.cos(angle + 0.3) * halfWidth * 0.8;
      const endY = Math.sin(angle + 0.3) * halfHeight * 0.8;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  }
  
  // Engine glow - multiple thrusters
  const engineGlow = 0.5 + Math.sin(frame * 0.4) * 0.3;
  ctx.fillStyle = `rgba(186, 85, 211, ${engineGlow})`;
  ctx.fillRect(-halfWidth * 0.3, halfHeight * 0.9, halfWidth * 0.15, halfHeight * 0.2);
  ctx.fillRect(-halfWidth * 0.1, halfHeight * 0.9, halfWidth * 0.2, halfHeight * 0.2);
  ctx.fillRect(halfWidth * 0.15, halfHeight * 0.9, halfWidth * 0.15, halfHeight * 0.2);
};

const drawAsteroid = (ctx: CanvasRenderingContext2D, size: { width: number; height: number }, rotation: number) => {
  const { width, height } = size;
  const radius = Math.min(width, height) / 2;
  
  // Irregular asteroid shape with more detail
  ctx.fillStyle = '#8B4513';
  ctx.beginPath();
  
  const points = 12;
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const variance = 0.7 + Math.sin(angle * 3 + rotation) * 0.3;
    const x = Math.cos(angle) * radius * variance;
    const y = Math.sin(angle) * radius * variance;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.fill();
  
  // Enhanced surface details
  ctx.fillStyle = '#6B3410';
  ctx.beginPath();
  ctx.ellipse(radius * 0.3, -radius * 0.3, radius * 0.2, radius * 0.15, rotation, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.ellipse(-radius * 0.4, radius * 0.2, radius * 0.15, radius * 0.1, rotation, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.ellipse(radius * 0.1, radius * 0.4, radius * 0.1, radius * 0.08, rotation, 0, Math.PI * 2);
  ctx.fill();
  
  // Highlight edges
  ctx.strokeStyle = '#A0522D';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.9, 0, Math.PI * 0.3);
  ctx.stroke();
};

const drawProjectile = (ctx: CanvasRenderingContext2D, size: { width: number; height: number }, projectile: any) => {
  const { width, height } = size;
  const isPlayerProjectile = projectile.owner === 'player';
  const isBossProjectile = projectile.owner === 'boss';
  
  if (isPlayerProjectile) {
    // Player projectile - enhanced energy beam
    ctx.fillStyle = '#00FF88';
    ctx.shadowColor = '#00FF88';
    ctx.shadowBlur = 12;
    
    // Outer glow
    ctx.fillRect(-width/2 - 2, -height/2 - 2, width + 4, height + 4);
    
    // Main beam
    ctx.fillStyle = '#00FFAA';
    ctx.fillRect(-width/2, -height/2, width, height);
    
    // Core
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-width/4, -height/2, width/2, height);
    
    // Energy particles
    for (let i = 0; i < 3; i++) {
      const particleX = (Math.random() - 0.5) * width;
      const particleY = (Math.random() - 0.5) * height;
      ctx.fillStyle = `rgba(0, 255, 136, ${Math.random() * 0.8})`;
      ctx.fillRect(particleX, particleY, 1, 2);
    }
  } else if (isBossProjectile) {
    // Boss projectile - purple plasma
    ctx.fillStyle = '#8B00FF';
    ctx.shadowColor = '#8B00FF';
    ctx.shadowBlur = 10;
    
    // Outer glow
    ctx.fillRect(-width/2 - 2, -height/2 - 2, width + 4, height + 4);
    
    // Main projectile
    ctx.fillStyle = '#BA55D3';
    ctx.fillRect(-width/2, -height/2, width, height);
    
    // Core
    ctx.fillStyle = '#DDA0DD';
    ctx.fillRect(-width/4, -height/2, width/2, height);
  } else {
    // Enemy projectile - red plasma
    ctx.fillStyle = '#FF4444';
    ctx.shadowColor = '#FF4444';
    ctx.shadowBlur = 8;
    
    // Outer glow
    ctx.fillRect(-width/2 - 1, -height/2 - 1, width + 2, height + 2);
    
    // Main projectile
    ctx.fillStyle = '#FF6666';
    ctx.fillRect(-width/2, -height/2, width, height);
    
    // Core
    ctx.fillStyle = '#FFAAAA';
    ctx.fillRect(-width/4, -height/2, width/2, height);
  }
  
  ctx.shadowBlur = 0;
};

const drawMissile = (ctx: CanvasRenderingContext2D, size: { width: number; height: number }, frame: number) => {
  const { width, height } = size;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  
  // Main missile body - sleek design
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.moveTo(0, -halfHeight);
  ctx.lineTo(halfWidth * 0.6, -halfHeight * 0.3);
  ctx.lineTo(halfWidth * 0.4, halfHeight * 0.6);
  ctx.lineTo(halfWidth * 0.7, halfHeight);
  ctx.lineTo(-halfWidth * 0.7, halfHeight);
  ctx.lineTo(-halfWidth * 0.4, halfHeight * 0.6);
  ctx.lineTo(-halfWidth * 0.6, -halfHeight * 0.3);
  ctx.closePath();
  ctx.fill();
  
  // Warhead
  ctx.fillStyle = '#FF4444';
  ctx.beginPath();
  ctx.ellipse(0, -halfHeight * 0.7, halfWidth * 0.4, halfHeight * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Engine glow
  const glowIntensity = 0.7 + Math.sin(frame * 0.5) * 0.3;
  ctx.fillStyle = `rgba(0, 255, 255, ${glowIntensity})`;
  ctx.fillRect(-halfWidth * 0.3, halfHeight * 0.7, halfWidth * 0.6, halfHeight * 0.3);
  
  // Engine particles
  for (let i = 0; i < 4; i++) {
    const particleX = (Math.random() - 0.5) * halfWidth * 0.6;
    const particleY = halfHeight * 0.9 + Math.random() * 12;
    ctx.fillStyle = `rgba(0, 255, 255, ${Math.random() * 0.9})`;
    ctx.fillRect(particleX, particleY, 2, 6);
  }
  
  // Warning stripes
  ctx.strokeStyle = '#FF0000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-halfWidth * 0.3, halfHeight * 0.2);
  ctx.lineTo(halfWidth * 0.3, halfHeight * 0.2);
  ctx.stroke();
};

const drawMissileExplosion = (ctx: CanvasRenderingContext2D, size: { width: number; height: number }, explosionTime: number) => {
  const { width, height } = size;
  const maxRadius = Math.max(width, height) * 3;
  const safeExplosionTime = Math.max(explosionTime, 0);
  const progress = Math.min(safeExplosionTime / 500, 1); // 500ms explosion duration
  const currentRadius = maxRadius * progress;
  
  // Outer explosion ring
  const outerAlpha = (1 - progress) * 0.8;
  ctx.fillStyle = `rgba(255, 100, 0, ${outerAlpha})`;
  ctx.beginPath();
  ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // Inner explosion core
  const innerRadius = currentRadius * 0.6;
  const innerAlpha = (1 - progress) * 0.9;
  ctx.fillStyle = `rgba(255, 255, 100, ${innerAlpha})`;
  ctx.beginPath();
  ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // Explosion particles
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const particleDistance = currentRadius * (0.8 + Math.random() * 0.4);
    const particleX = Math.cos(angle) * particleDistance;
    const particleY = Math.sin(angle) * particleDistance;
    const particleAlpha = (1 - progress) * (0.5 + Math.random() * 0.5);
    
    ctx.fillStyle = `rgba(255, 150, 0, ${particleAlpha})`;
    ctx.fillRect(particleX - 3, particleY - 3, 6, 6);
  }
};

const drawMissilePowerUp = (ctx: CanvasRenderingContext2D, size: { width: number; height: number }, frame: number) => {
  const { width, height } = size;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  
  // Pulsing glow effect
  const pulseIntensity = 0.5 + Math.sin(frame) * 0.3;
  ctx.shadowColor = '#00AAFF';
  ctx.shadowBlur = 15;
  
  // Main power-up container
  ctx.fillStyle = `rgba(0, 170, 255, ${pulseIntensity})`;
  ctx.beginPath();
  ctx.roundRect(-halfWidth, -halfHeight, width, height, 8);
  ctx.fill();
  
  // Missile icon inside
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.moveTo(0, -halfHeight * 0.6);
  ctx.lineTo(halfWidth * 0.3, -halfHeight * 0.2);
  ctx.lineTo(halfWidth * 0.2, halfHeight * 0.3);
  ctx.lineTo(halfWidth * 0.4, halfHeight * 0.6);
  ctx.lineTo(-halfWidth * 0.4, halfHeight * 0.6);
  ctx.lineTo(-halfWidth * 0.2, halfHeight * 0.3);
  ctx.lineTo(-halfWidth * 0.3, -halfHeight * 0.2);
  ctx.closePath();
  ctx.fill();
  
  // Power-up border
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-halfWidth, -halfHeight, width, height, 8);
  ctx.stroke();
  
  // Floating animation effect
  const floatOffset = Math.sin(frame * 2) * 2;
  ctx.translate(0, floatOffset);
  
  ctx.shadowBlur = 0;

};

const drawShieldPowerUp = (ctx: CanvasRenderingContext2D, size: { width: number; height: number }, frame: number) => {
  const { width, height } = size;
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  // Pulsing glow effect
  const pulse = 0.6 + Math.sin(frame * 2) * 0.4;
  ctx.shadowColor = '#00FFFF';
  ctx.shadowBlur = 15;

  // Shield bubble
  ctx.fillStyle = `rgba(0, 255, 255, ${pulse * 0.6})`;
  ctx.beginPath();
  ctx.arc(0, 0, Math.min(halfWidth, halfHeight), 0, Math.PI * 2);
  ctx.fill();

  // Inner sparkle
  ctx.fillStyle = '#FFFFFF';
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.arc(-halfWidth * 0.2, -halfHeight * 0.2, 2 + Math.sin(frame * 3), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // Border
  ctx.strokeStyle = '#00FFFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, Math.min(halfWidth, halfHeight), 0, Math.PI * 2);
  ctx.stroke();

  ctx.shadowBlur = 0;
};

const drawOneUpPowerUp = (
  ctx: CanvasRenderingContext2D,
  size: { width: number; height: number },
  frame: number
) => {
  const { width, height } = size;
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  // Glowing heart background
  const pulse = 0.5 + Math.sin(frame * 0.2) * 0.3;
  ctx.shadowColor = 'rgba(255, 0, 0, 0.7)';
  ctx.shadowBlur = 20;

  ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
  ctx.beginPath();
  ctx.moveTo(0, -halfHeight * 0.5);
  ctx.bezierCurveTo(
    halfWidth, -halfHeight * 1.2,
    halfWidth * 1.5, halfHeight * 0.5,
    0, halfHeight * 1.2
  );
  ctx.bezierCurveTo(
    -halfWidth * 1.5, halfHeight * 0.5,
    -halfWidth, -halfHeight * 1.2,
    0, -halfHeight * 0.5
  );
  ctx.fill();

  // 1UP Text overlay
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'white';
  ctx.font = `${Math.floor(halfHeight * 0.8)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('1UP', 0, 0);
};

const drawMinePowerUp = (
  ctx: CanvasRenderingContext2D,
  size: { width: number; height: number },
  frame: number
) => {
  const { width, height } = size;
  const pulse = 0.5 + Math.sin(frame * 2) * 0.3;

  ctx.shadowColor = 'red';
  ctx.shadowBlur = 15;

  ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
  ctx.beginPath();
  ctx.arc(0, 0, Math.min(width, height) / 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;

  ctx.fillStyle = 'white';
  ctx.font = `${Math.floor(height * 0.4)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('M', 0, 0);
};

export const drawOrbitPowerUp = (
  ctx: CanvasRenderingContext2D,
  size: { width: number; height: number },
  animationFrame: number
) => {
  const radius = size.width / 2;
  const glow = Math.sin(animationFrame) * 0.5 + 0.5;

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, 2 * Math.PI);
  ctx.fillStyle = `rgba(0, 255, 255, ${0.5 + glow * 0.5})`;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, radius - 4, 0, 2 * Math.PI);
  ctx.fillStyle = `rgba(0, 100, 255, 0.8)`;
  ctx.fill();
};
