import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Spaceship, Projectile, Asteroid, Enemy, Position, Boss, Missile, PowerUp, GameState } from '../../types/game';
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
} from '../../utils/gameUtils';
import { drawSprite } from './SpriteRenderer';
import { createBoss, updateBossMovement, BossHealthBar } from './BossManager';
import { handleBossDefeat } from '../../utils/bossUtils';
import { useGameState } from '../../hooks/useGameState';
import { GameHUD } from './GameHUD';
import { drawOrbitPowerUp } from './SpriteRenderer';

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
  gameState: GameState;
  gainLife: () => void;
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
  shield_hit: new Audio('/sounds/shield-hit.mp3'),
  kill_all: new Audio("/sounds/kill-all.mp3"),
};

function getRandomPowerUpType(): PowerUp['type'] {
  const types: PowerUp['type'][] = ['missile', 'shield', 'extra_life', 'mine', 'orbiting_orbs'];
  const weights = [0.3, 0.3, 0.15, 0.15, 0.1]; // adjust as desired
  //const weights = [0.1, 0.1, 0.1, 0.1, 0.6]; // 60% orbiting_orbs

  const total = weights.reduce((a, b) => a + b, 0);
  const r = Math.random() * total;
  let sum = 0;

  for (let i = 0; i < types.length; i++) {
    sum += weights[i];
    if (r <= sum) return types[i];
  }

  return 'missile'; // fallback
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
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
  gameState,
  gainLife,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);
  const lastPowerUpSpawnRef = useRef<number>(0);
  const lastShotRef = useRef<number>(0);
  const isShooting = useRef<boolean>(false);

  // Deferred callback refs for batching updates (avoid unnecessary re-renders)
  const distanceRef = useRef(0);
  const scoreRef = useRef(0);
  const lifeLostRef = useRef(false);
  const bossDefeatedRef = useRef(false);
  const bossSpawnedRef = useRef<Boss | null>(null);
  const [isShieldInWarningPhase, setIsShieldInWarningPhase] = useState(false);
  const lastMineSpawnRef = useRef<number>(0);

  // Core game state objects stored in both React state and refs for mutable updates
  const [spaceship, setSpaceship] = useState<Spaceship>({
    id: 'player',
    position: { x: 0, y: 0 },
    size: { width: 40, height: 60 },
    velocity: { x: 0, y: 0 },
    health: 3,
    maxHealth: 3,
    animationFrame: 0,
    lastShot: 0,
    missiles: 3,
    maxMissiles: 3,
    lastMissile: 0,
  });

  // Mutable refs for arrays to avoid triggering re-renders every frame
  const projectilesRef = useRef<Projectile[]>([]);
  const missilesRef = useRef<Missile[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const asteroidsRef = useRef<Asteroid[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const currentBossRef = useRef<Boss | undefined>(propsBoss);
  const starsRef = useRef<Position[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);

  // State versions of arrays only updated when necessary for React rendering
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [missiles, setMissiles] = useState<Missile[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [currentBoss, setCurrentBoss] = useState<Boss | undefined>(propsBoss);

  // Floating texts state and damage flash state for UI
  const [damageFlash, setDamageFlash] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [bossExplosion, setBossExplosion] = useState<{ x: number; y: number; frame: number } | null>(null);

  const [isShielded, setIsShielded] = useState(false);
  const shieldTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stage progression state
  const [gameStage, setGameStage] = useState(1);
  const [gamePhase, setGamePhase] = useState<'playing' | 'stageClear'>('playing');
  const [stageClearCountdown, setStageClearCountdown] = useState<number | null>(null);
  const [mineBlast, setMineBlast] = useState<{ frame: number } | null>(null);
  const [orbitingOrbsActive, setOrbitingOrbsActive] = useState(false);
  const [orbitingOrbsStartTime, setOrbitingOrbsStartTime] = useState<number | null>(null);

  // Sync boss prop changes into state and ref
  useEffect(() => {
    setCurrentBoss(propsBoss);
    currentBossRef.current = propsBoss;
  }, [propsBoss]);

  // Sync arrays refs into state whenever they change (utility function)
  const syncArrayRefsToState = () => {
    setProjectiles([...projectilesRef.current]);
    setMissiles([...missilesRef.current]);
    setPowerUps([...powerUpsRef.current]);
    setAsteroids([...asteroidsRef.current]);
    setEnemies([...enemiesRef.current]);
    setCurrentBoss(currentBossRef.current);
  };

  // Damage flash timeout
  useEffect(() => {
    if (damageFlash) {
      const timeout = setTimeout(() => setDamageFlash(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [damageFlash]);

  useEffect(() => {
    if (!bossExplosion) return;
    const interval = setInterval(() => {
      setBossExplosion(prev => {
        if (!prev) return null;
        if (prev.frame >= 30) return null;
        return { ...prev, frame: prev.frame + 1 };
      });
    }, 33);
    return () => clearInterval(interval);
  }, [bossExplosion]);

  // Update missile count upward callback
  useEffect(() => {
    onMissileCountChange(spaceship.missiles);
  }, [spaceship.missiles, onMissileCountChange]);

  // Log powerUps changes for debugging
  useEffect(() => {
    }, [powerUps]);

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

  useEffect(() => {
    if (!mineBlast) return;

    const interval = setInterval(() => {
      setMineBlast(prev => {
        if (!prev) return null;
        if (prev.frame > 30) return null; // end after 30 frames (~1 second)
        return { frame: prev.frame + 1 };
      });
    }, 33);

    return () => clearInterval(interval);
  }, [mineBlast]);

  // Sound play helper with canvas shake effect
  const playSound = useCallback((type: keyof typeof soundMap) => {
    const sound = soundMap[type];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }

    if (['explosion', 'boss_hit', 'boss_defeated', 'missile_explosion'].includes(type)) {
      const canvas = canvasRef.current;
      if (canvas) {
        const intensity = type === 'missile_explosion' ? 6 : type === 'boss_defeated' ? 4 : 2;
        canvas.style.transform = `translate(${intensity}px, ${intensity}px)`;
        setTimeout(() => {
          canvas.style.transform = `translate(-${intensity}px, -${intensity}px)`;
          setTimeout(() => {
            canvas.style.transform = 'translate(0px, 0px)';
          }, 50);
        }, 50);
      }
    }
  }, []);
  // Initialize canvas size and starfield
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      setSpaceship(prev => ({
        ...prev,
        position: {
          x: canvas.width / 2 - prev.size.width / 2,
          y: canvas.height - prev.size.height - 50,
        },
      }));
    };

    const initStars = () => {
      const stars: Position[] = [];
      for (let i = 0; i < 200; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
        });
      }
      starsRef.current = stars;
    };

    resizeCanvas();
    initStars();

    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Boss spawn effect (clears enemies/asteroids)
  useEffect(() => {
    if (isBossBattle && !currentBossRef.current) {
      const canvas = canvasRef.current;
      if (canvas) {
        const newBoss = createBoss(canvas.width, difficulty);
        setCurrentBoss(newBoss);
        currentBossRef.current = newBoss;
        bossSpawnedRef.current = newBoss;
        enemiesRef.current = [];
        asteroidsRef.current = [];
        syncArrayRefsToState();
      }
    }
  }, [isBossBattle, difficulty]);

  // Flush deferred callbacks outside render
  useEffect(() => {
    if (distanceRef.current !== 0) {
      onDistanceUpdate(distanceRef.current);
      distanceRef.current = 0;
    }
    if (scoreRef.current !== 0) {
      onScoreUpdate(scoreRef.current);
      scoreRef.current = 0;
    }
    if (lifeLostRef.current) {
      onLifeLost();
      lifeLostRef.current = false;
    }
    if (bossDefeatedRef.current) {
      onBossDefeated();
      bossDefeatedRef.current = false;
    }
    if (bossSpawnedRef.current) {
      onBossSpawn(bossSpawnedRef.current);
      bossSpawnedRef.current = null;
    }
  });

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

  // Shoot handler
  const shoot = useCallback(() => {
    const canvas = canvasRef.current;
    const now = Date.now();
    if (!canvas || now - lastShotRef.current < 120) return;

    lastShotRef.current = now;
    isShooting.current = true;
    playSound('shoot');
    setTimeout(() => { isShooting.current = false; }, 150);

    const newProjectiles: Projectile[] = [
      {
        id: generateId(),
        position: {
          x: spaceship.position.x + spaceship.size.width / 2 - 2,
          y: spaceship.position.y - 10,
        },
        size: { width: 4, height: 15 },
        velocity: { x: 0, y: -15 },
        damage: 1,
        owner: 'player',
      },
      {
        id: generateId(),
        position: {
          x: spaceship.position.x + spaceship.size.width * 0.2,
          y: spaceship.position.y + 5,
        },
        size: { width: 3, height: 12 },
        velocity: { x: -2, y: -12 },
        damage: 1,
        owner: 'player',
      },
      {
        id: generateId(),
        position: {
          x: spaceship.position.x + spaceship.size.width * 0.8,
          y: spaceship.position.y + 5,
        },
        size: { width: 3, height: 12 },
        velocity: { x: 2, y: -12 },
        damage: 1,
        owner: 'player',
      },
    ];

    projectilesRef.current = [...projectilesRef.current, ...newProjectiles];
    setProjectiles(projectilesRef.current);
  }, [spaceship.position, spaceship.size, playSound]);

  // Missile launch handler
  const launchMissile = useCallback(() => {
    const canvas = canvasRef.current;
    const now = Date.now();
    if (!canvas || spaceship.missiles <= 0 || now - spaceship.lastMissile < 1000) return;

    setSpaceship(prev => ({
      ...prev,
      missiles: prev.missiles - 1,
      lastMissile: now,
    }));

    playSound('missile_launch');

    const newMissile: Missile = {
      id: generateId(),
      position: {
        x: spaceship.position.x + spaceship.size.width / 2 - 8,
        y: spaceship.position.y - 20,
      },
      size: { width: 16, height: 32 },
      velocity: { x: 0, y: -10 },
      damage: 25,
      blastRadius: 120,
      explosionTime: 0,
      isExploding: false,
    };

    missilesRef.current = [...missilesRef.current, newMissile];
    setMissiles(missilesRef.current);
  }, [spaceship.missiles, spaceship.position, spaceship.size, spaceship.lastMissile, playSound]);

  // Controls effect (shoot/missile)
  useEffect(() => {
    if (controls.shoot && isPlaying) shoot();
    if (controls.missile && isPlaying) launchMissile();
  }, [controls.shoot, controls.missile, isPlaying, shoot, launchMissile]);

  // Spawn powerUps (missiles only currently)
  const spawnPowerUp = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isBossBattle) return;

    const now = Date.now();
    const powerUpInterval = 15000 + Math.random() * 10000;

    if (now - lastPowerUpSpawnRef.current > powerUpInterval) {
      lastPowerUpSpawnRef.current = now;

      const spawnPosition = getRandomSpawnPosition(canvas.width, 30);
      const newPowerUp: PowerUp = {
        id: generateId(),
        position: spawnPosition,
        size: { width: 30, height: 30 },
        velocity: { x: 0, y: 3 },
        type: getRandomPowerUpType(),
        collected: false,
      };

      console.log('🚀 Spawned power-up:', newPowerUp.type);

      powerUpsRef.current = [...powerUpsRef.current, newPowerUp];
      setPowerUps(powerUpsRef.current);
    }
  }, [isBossBattle]);

  const spawnMinePowerUp = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isBossBattle) return;

    const now = Date.now();
    const mineInterval = 25000 + Math.random() * 10000; // every ~25–35s

    if (now - lastMineSpawnRef.current > mineInterval) {
      lastMineSpawnRef.current = now;

      const spawnPosition = getRandomSpawnPosition(canvas.width, 30);
      const newPowerUp: PowerUp = {
        id: generateId(),
        position: spawnPosition,
        size: { width: 30, height: 30 },
        velocity: { x: 0, y: 2 },
        type: 'mine',
        collected: false,
      };

      powerUpsRef.current = [...powerUpsRef.current, newPowerUp];
      setPowerUps(powerUpsRef.current);
    }
  }, [isBossBattle]);

  // Spawn asteroids/enemies and powerups
  const spawnObjects = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isBossBattle) return;

    const now = Date.now();
    const spawnInterval = Math.max(600 - difficulty * 80, 200);

    if (now - lastSpawnRef.current > spawnInterval) {
      lastSpawnRef.current = now;

      const spawnChance = Math.random();
      const spawnPosition = getRandomSpawnPosition(canvas.width, 50);

      if (spawnChance < 0.45) {
        const newAsteroid = createAsteroid(spawnPosition, difficulty);
        asteroidsRef.current = [...asteroidsRef.current, newAsteroid];
      } else {
        const newEnemy = createEnemy(spawnPosition, difficulty);
        enemiesRef.current = [...enemiesRef.current, newEnemy];
      }

      setAsteroids(asteroidsRef.current);
      setEnemies(enemiesRef.current);
    }

    spawnPowerUp();
    spawnMinePowerUp();
  }, [difficulty, isBossBattle, spawnPowerUp]);

  // Enemy shooting & boss shooting handler
  const handleEnemyShooting = useCallback(() => {
    const now = Date.now();

    let enemiesChanged = false;
    const newProjectiles: Projectile[] = [];

    enemiesRef.current = enemiesRef.current.map(enemy => {
      if ((enemy.aiType === 'shooter' || enemy.aiType === 'sideways_shooter') && now - enemy.lastShot > enemy.shootInterval) {
        let enemyProjectile: Projectile;

        if (enemy.aiType === 'sideways_shooter') {
          const direction = enemy.velocity.x > 0 ? 1 : -1;
          enemyProjectile = {
            id: generateId(),
            position: {
              x: enemy.position.x + (direction > 0 ? enemy.size.width : 0),
              y: enemy.position.y + enemy.size.height / 2 - 2,
            },
            size: { width: 8, height: 3 },
            velocity: { x: direction * 8, y: 0 },
            damage: 1,
            owner: 'enemy',
          };
        } else {
          enemyProjectile = {
            id: generateId(),
            position: {
              x: enemy.position.x + enemy.size.width / 2 - 2,
              y: enemy.position.y + enemy.size.height,
            },
            size: { width: 3, height: 10 },
            velocity: { x: 0, y: 6 },
            damage: 1,
            owner: 'enemy',
          };
        }

        playSound('enemy_shoot');
        newProjectiles.push(enemyProjectile);

        enemiesChanged = true;
        return { ...enemy, lastShot: now };
      }
      return enemy;
    });

    if (enemiesChanged) {
      enemiesRef.current = [...enemiesRef.current];
      setEnemies(enemiesRef.current);
    }

    if (newProjectiles.length > 0) {
      projectilesRef.current = [...projectilesRef.current, ...newProjectiles];
      setProjectiles(projectilesRef.current);
    }

    // Boss shooting
    if (currentBossRef.current) {
      const bossProjectiles = createBossProjectiles(currentBossRef.current, spaceship.position);
      if (bossProjectiles.length > 0) {
        projectilesRef.current = [...projectilesRef.current, ...bossProjectiles];
        setProjectiles(projectilesRef.current);

        currentBossRef.current = { ...currentBossRef.current, lastShot: Date.now() };
        setCurrentBoss(currentBossRef.current);

        playSound('enemy_shoot');
      }
    }
  }, [playSound, spaceship.position]);

const gameLoop = useCallback((currentTime: number) => {
  const canvas = canvasRef.current;
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx || !isPlaying) return;

  const deltaTime = currentTime - lastTimeRef.current;
  lastTimeRef.current = currentTime;

  const ORB_DURATION = 13000;
  const ORB_FLASH_START = 10000;

  const now = Date.now();
  const orbElapsed = orbitingOrbsStartTime ? now - orbitingOrbsStartTime : 0;
  const orbitingOrbsTimeLeft = orbitingOrbsActive ? Math.max(0, ORB_DURATION - orbElapsed) : 0;
  const orbitingOrbsFlashing = orbitingOrbsTimeLeft <= (ORB_DURATION - ORB_FLASH_START);

  if (orbitingOrbsActive && orbitingOrbsTimeLeft <= 0) {
    setOrbitingOrbsActive(false);
    setOrbitingOrbsStartTime(null);
  }

  // Update distance traveled
  distanceRef.current += deltaTime * speed * (isBossBattle ? 0.3 : 0.01);

  // Update spaceship position based on controls
  setSpaceship(prev => {
    const moveSpeed = 6;
    let newX = prev.position.x;
    let newY = prev.position.y;

    if (controls.left) newX -= moveSpeed;
    if (controls.right) newX += moveSpeed;
    if (controls.up) newY -= moveSpeed;
    if (controls.down) newY += moveSpeed;

    newX = clamp(newX, 0, canvas.width - prev.size.width);
    newY = clamp(newY, 0, canvas.height - prev.size.height);

    return {
      ...prev,
      position: { x: newX, y: newY },
      animationFrame: (prev.animationFrame + deltaTime * 0.01) % (Math.PI * 2),
    };
  });

  // Move stars for starfield effect
  starsRef.current = starsRef.current.map(star => ({
    x: star.x,
    y: (star.y + speed * (isBossBattle ? 0.3 : 0.8)) % canvas.height,
  }));

  // Update missiles (movement + explosion timer)
  missilesRef.current = missilesRef.current.flatMap(missile => {
    if (missile.isExploding) {
      missile.explosionTime += deltaTime;
      return missile.explosionTime > 500 ? [] : [missile];
    }

    const moved = {
      ...missile,
      position: {
        x: missile.position.x + missile.velocity.x,
        y: missile.position.y + missile.velocity.y,
      },
    };

    let explode = false;

    if (!isBossBattle) {
      if (
        enemiesRef.current.some(e => checkCollision(moved, e)) || 
        asteroidsRef.current.some(a => checkCollision(moved, a))
      ) {
        explode = true;
      }
    }

    if (currentBossRef.current && checkCollision(moved, currentBossRef.current)) {
      explode = true;
    }

    if (moved.position.y < -50) explode = true;

    if (explode) {
      playSound('missile_explosion');

      const blastCenter = {
        x: moved.position.x + moved.size.width / 2,
        y: moved.position.y + moved.size.height / 2,
      };

      // Damage boss
      if (currentBossRef.current) {
        const bossCenter = {
          x: currentBossRef.current.position.x + currentBossRef.current.size.width / 2,
          y: currentBossRef.current.position.y + currentBossRef.current.size.height / 2,
        };
        const dist = Math.hypot(blastCenter.x - bossCenter.x, blastCenter.y - bossCenter.y);
        if (dist <= moved.blastRadius) {
          setCurrentBoss(prev => {
            if (!prev) return prev;

            // ✅ Prevent multiple death triggers
            if (prev.health <= 0) return prev;

            const newHealth = prev.health - moved.damage;

            // ✅ Sync the ref to keep logic consistent
            currentBossRef.current = { ...prev, health: newHealth };

            if (newHealth <= 0) {
              handleBossDefeat(
                prev,
                difficulty,
                generateId,
                setBossExplosion,
                setPowerUps,
                powerUpsRef,
                setCurrentBoss,
                currentBossRef,
                setGamePhase,
                setStageClearCountdown,
                scoreRef,
                bossDefeatedRef,
                playSound
              );
              return undefined;
            }
            playSound('boss_hit');
            return { ...prev, health: newHealth };
          });
        }
      }

      // Damage enemies in blast radius and direct hit kills
      setEnemies(prev => {
        return prev.map(enemy => {
          const expandedMissileHitBox = {
            position: {
              x: moved.position.x,
              y: moved.position.y - 20, // expand upward for hit detection
            },
            size: {
              width: moved.size.width,
              height: moved.size.height + 20,
            },
          };

          const directHit = checkCollision(expandedMissileHitBox as any, enemy);
          if (directHit) {
            playSound('explosion');
            scoreRef.current += 50;
            return null; // instant kill
          }

          // Blast radius check remains the same...
          const enemyCenter = {
            x: enemy.position.x + enemy.size.width / 2,
            y: enemy.position.y + enemy.size.height / 2,
          };
          const blastCenter = {
            x: moved.position.x + moved.size.width / 2,
            y: moved.position.y + moved.size.height / 2,
          };
          const dist = Math.hypot(blastCenter.x - enemyCenter.x, blastCenter.y - enemyCenter.y);
          if (dist <= missile.blastRadius) {
            playSound('explosion');
            const newHealth = enemy.health - missile.damage * 3;
            if (newHealth <= 0) {
              scoreRef.current += 50;
              return null;
            }
            return { ...enemy, health: newHealth };
          }

          return enemy;
        }).filter(Boolean) as Enemy[];
      });

      // Damage asteroids in blast radius
      setAsteroids(prev => prev.filter(asteroid => {
        const asteroidCenter = {
          x: asteroid.position.x + asteroid.size.width / 2,
          y: asteroid.position.y + asteroid.size.height / 2,
        };
        const dist = Math.hypot(blastCenter.x - asteroidCenter.x, blastCenter.y - asteroidCenter.y);
        if (dist <= moved.blastRadius) {
          playSound('explosion');
          scoreRef.current += 25;
          return false;
        }
        return true;
      }));

      return [{ ...moved, isExploding: true, explosionTime: 0, velocity: { x: 0, y: 0 } }];
    }

    return [moved];
  });

  setMissiles(missilesRef.current);

  // Update powerUps: move down, check collision with spaceship
  powerUpsRef.current = powerUpsRef.current
    .map(powerUp => {
      const newPos = {
        x: powerUp.position.x + powerUp.velocity.x,
        y: powerUp.position.y + powerUp.velocity.y,
      };

      if (checkCollision(spaceship, { ...powerUp, position: newPos })) {
        playSound('powerup_collect');

        if (powerUp.type === 'missile') {
          setSpaceship(prev => ({
            ...prev,
            missiles: Math.min(prev.missiles + 1, prev.maxMissiles),
          }));
        } else if (powerUp.type === 'shield') {
          setIsShielded(true);
          if (shieldTimeoutRef.current) clearTimeout(shieldTimeoutRef.current);

          // Flashing warning starts after 10s, ends at 13s
          setTimeout(() => {
            setIsShieldInWarningPhase(true);
          }, 10000); // starts at 10s

          shieldTimeoutRef.current = setTimeout(() => {
            setIsShieldInWarningPhase(false);
            setIsShielded(false);
          }, 13000); // ends at 13s
        } else if (powerUp.type === 'extra_life') {
          gainLife();
          const text: FloatingText = {
            id: generateId(),
            text: '+1 LIFE',
            x: spaceship.position.x + spaceship.size.width / 2,
            y: spaceship.position.y,
            opacity: 1,
          };
          floatingTextsRef.current.push(text);
          setFloatingTexts([...floatingTextsRef.current]);
        } else if (powerUp.type === 'mine') {
          playSound('kill_all');
          setMineBlast({ frame: 0 });

          // 💥 Destroy all enemies on screen
          const killedCount = enemiesRef.current.length;
          enemiesRef.current = [];
          setEnemies([]);

          scoreRef.current += killedCount * 50;

          // Add floating text
          const text: FloatingText = {
            id: generateId(),
            text: `+${killedCount * 50}`,
            x: spaceship.position.x + spaceship.size.width / 2,
            y: spaceship.position.y,
            opacity: 1,
          };
          floatingTextsRef.current.push(text);
          setFloatingTexts([...floatingTextsRef.current]);
        } else if (powerUp.type === 'orbiting_orbs') {
          setOrbitingOrbsActive(true);
          setOrbitingOrbsStartTime(Date.now());
        }

        return { ...powerUp, position: newPos, collected: true };
      }

      return { ...powerUp, position: newPos };
    })
    .filter(p => !p.collected);


  setPowerUps(powerUpsRef.current);

  // Boss movement update
  if (currentBossRef.current && currentBossRef.current.health > 0) {
    const updated = updateBossMovement(currentBossRef.current, spaceship.position, canvas.width, deltaTime);
    currentBossRef.current = {
      ...updated,
      position: {
        x: updated.position.x + updated.velocity.x,
        y: updated.position.y + updated.velocity.y,
      },
    };
    setCurrentBoss(currentBossRef.current);
  }

  // Update projectiles: move and cull out-of-bounds
  projectilesRef.current = projectilesRef.current
    .map(proj => ({
      ...proj,
      position: {
        x: proj.position.x + proj.velocity.x,
        y: proj.position.y + proj.velocity.y,
      },
    }))
    .filter(proj => !isOutOfBounds(proj, canvas.width, canvas.height));
  setProjectiles(projectilesRef.current);

  // Update asteroids & enemies (if no boss)
  if (!isBossBattle) {
    asteroidsRef.current = asteroidsRef.current
      .map(asteroid => ({
        ...asteroid,
        position: {
          x: asteroid.position.x + asteroid.velocity.x,
          y: asteroid.position.y + asteroid.velocity.y,
        },
        rotation: asteroid.rotation + asteroid.rotationSpeed,
      }))
      .filter(a => !isOutOfBounds(a, canvas.width, canvas.height));
    setAsteroids(asteroidsRef.current);

    enemiesRef.current = enemiesRef.current
      .map(enemy => {
        const updatedEnemy = updateEnemyAI(enemy, spaceship.position, canvas.width, canvas.height, deltaTime);
        return {
          ...updatedEnemy,
          position: {
            x: updatedEnemy.position.x + updatedEnemy.velocity.x,
            y: updatedEnemy.position.y + updatedEnemy.velocity.y,
          },
        };
      })
      .filter(e => !isOutOfBounds(e, canvas.width, canvas.height));
    setEnemies(enemiesRef.current);
  }

  // Handle enemy and boss shooting
  handleEnemyShooting();

  // Missile explosions detect collisions and apply damage
  missilesRef.current = missilesRef.current.filter(missile => {
    if (missile.isExploding) return true;

    let explode = false;
    if (!isBossBattle) {
      if (enemiesRef.current.some(e => checkCollision(missile, e)) || asteroidsRef.current.some(a => checkCollision(missile, a))) {
        explode = true;
      }
    }
    if (currentBossRef.current && checkCollision(missile, currentBossRef.current)) {
      explode = true;
    }

    if (explode) {
      playSound('missile_explosion');
      const blastCenter = {
        x: missile.position.x + missile.size.width / 2,
        y: missile.position.y + missile.size.height / 2,
      };

      // Damage boss
      if (currentBossRef.current) {
        const bossCenter = {
          x: currentBossRef.current.position.x + currentBossRef.current.size.width / 2,
          y: currentBossRef.current.position.y + currentBossRef.current.size.height / 2,
        };
        const dist = Math.hypot(blastCenter.x - bossCenter.x, blastCenter.y - bossCenter.y);
        if (dist <= missile.blastRadius) {
          setCurrentBoss(prev => {
            if (!prev) return prev;
            const newHealth = prev.health - missile.damage;
            if (prev.health <= 0) return undefined;

            // ✅ Sync ref to avoid desync bugs
            currentBossRef.current = { ...prev, health: newHealth };

            if (newHealth <= 0) {
              handleBossDefeat(
                prev,
                difficulty,
                generateId,
                setBossExplosion,
                setPowerUps,
                powerUpsRef,
                setCurrentBoss,
                currentBossRef,
                setGamePhase,
                setStageClearCountdown,
                scoreRef,
                bossDefeatedRef,
                playSound
              );
              return undefined;
            }
            playSound('boss_hit');
            return { ...prev, health: newHealth };
          });
        }
      }

      // Damage enemies with direct collision and blast radius
      enemiesRef.current = enemiesRef.current.filter(enemy => {
        // Remove enemy instantly on direct missile collision
        if (checkCollision(missile, enemy)) {
          playSound('explosion');
          scoreRef.current += 50;
          return false; // remove enemy immediately
        }

        // Then blast radius damage
        const enemyCenter = {
          x: enemy.position.x + enemy.size.width / 2,
          y: enemy.position.y + enemy.size.height / 2,
        };
        const dist = Math.hypot(blastCenter.x - enemyCenter.x, blastCenter.y - enemyCenter.y);
        if (dist <= missile.blastRadius) {
          playSound('explosion');
          enemy.health -= missile.damage * 3;
          if (enemy.health <= 0) {
            scoreRef.current += 50;
            return false; // remove dead enemy
          }
        }

        return true;
      });

      // Damage asteroids in blast radius
      setAsteroids(prev => prev.filter(asteroid => {
        const asteroidCenter = {
          x: asteroid.position.x + asteroid.size.width / 2,
          y: asteroid.position.y + asteroid.size.height / 2,
        };
        const dist = Math.hypot(blastCenter.x - asteroidCenter.x, blastCenter.y - asteroidCenter.y);
        if (dist <= missile.blastRadius) {
          playSound('explosion');
          scoreRef.current += 25;
          return false;
        }
        return true;
      }));

      syncArrayRefsToState(); // Sync refs -> state after mutation

      return false; // Remove missile immediately on explosion
    }

    return true; // Keep missile if no explosion
  });
  setMissiles(missilesRef.current);

  // Player projectiles vs boss
  if (currentBossRef.current) {
    projectilesRef.current = projectilesRef.current.filter(proj => {
      if (proj.owner === 'player' && checkCollision(proj, currentBossRef.current!)) {
        setCurrentBoss(prev => {
          if (!prev) return prev;
          const newHealth = prev.health - 1;

          // ✅ Sync the ref for consistency
          currentBossRef.current = { ...prev, health: newHealth };

          if (newHealth <= 0) {
            handleBossDefeat(
              prev,
              difficulty,
              generateId,
              setBossExplosion,
              setPowerUps,
              powerUpsRef,
              setCurrentBoss,
              currentBossRef,
              setGamePhase,
              setStageClearCountdown,
              scoreRef,
              bossDefeatedRef,
              playSound
            );
            return undefined;
          }
          // Only play hit sound for normal damage
          playSound('boss_hit');
          return { ...prev, health: newHealth };
        });

        return false; // remove projectile
      }
      return true;
    });

    setProjectiles(projectilesRef.current);
  }

  // Player projectiles vs asteroids & enemies
  if (!isBossBattle) {
    projectilesRef.current = projectilesRef.current.filter(proj => {
      if (proj.owner !== 'player') return true;

      let hit = false;

      asteroidsRef.current = asteroidsRef.current.filter(asteroid => {
        if (hit) return true;
        if (checkCollision(proj, asteroid)) {
          playSound('explosion');
          scoreRef.current += asteroid.size_variant === 'large' ? 15 : asteroid.size_variant === 'medium' ? 10 : 5;
          hit = true;
          return false;
        }
        return true;
      });

      enemiesRef.current = enemiesRef.current.map(enemy => {
        if (hit) return enemy;
        if (checkCollision(proj, enemy)) {
          hit = true;
          const newHealth = enemy.health - 1;
          if (newHealth <= 0) {
            playSound('explosion');
            scoreRef.current += enemy.aiType === 'kamikaze' ? 30 : enemy.aiType === 'chaser' ? 25 : enemy.aiType === 'sideways_shooter' ? 35 : 20;
            return null;
          } else {
            playSound('hit');
            return { ...enemy, health: newHealth };
          }
        }
        return enemy;
      }).filter(Boolean) as Enemy[];

      return !hit;
    });
    setProjectiles(projectilesRef.current);
    setAsteroids(asteroidsRef.current);
    setEnemies(enemiesRef.current);
  }

  // Enemy/Boss projectiles vs player
  projectilesRef.current = projectilesRef.current.filter(proj => {
    if ((proj.owner === 'enemy' || proj.owner === 'boss') && checkCollision(proj, spaceship)) {
      if (!isShielded) {
        playSound('hit');
        lifeLostRef.current = true;
        setDamageFlash(true);

        // Floating "-1" text
        const newFloatingText = {
          id: generateId(),
          text: '-1',
          x: spaceship.position.x + spaceship.size.width / 2,
          y: spaceship.position.y,
          opacity: 1,
        };
        floatingTextsRef.current = [...floatingTextsRef.current, newFloatingText];
        setFloatingTexts([...floatingTextsRef.current]);
      }
      return false;
    }
    return true;
  });
  setProjectiles(projectilesRef.current);

  // Player collisions with asteroids/enemies/boss
  let collisionDetected = false;

  if (!isBossBattle) {
    if (asteroidsRef.current.some(a => checkCollision(spaceship, a))) collisionDetected = true;
    if (enemiesRef.current.some(e => checkCollision(spaceship, e))) collisionDetected = true;

    if (collisionDetected) {
      asteroidsRef.current = asteroidsRef.current.filter(a => !checkCollision(spaceship, a));
      enemiesRef.current = enemiesRef.current.filter(e => !checkCollision(spaceship, e));
      setAsteroids(asteroidsRef.current);
      setEnemies(enemiesRef.current);
    }
  }

  if (currentBossRef.current && checkCollision(spaceship, currentBossRef.current)) collisionDetected = true;

  if (collisionDetected && !isShielded) {
    playSound('life_lost');
    lifeLostRef.current = true;
    setDamageFlash(true);

    const newFloatingText = {
      id: generateId(),
      text: '-1',
      x: spaceship.position.x + spaceship.size.width / 2,
      y: spaceship.position.y,
      opacity: 1,
    };
    floatingTextsRef.current = [...floatingTextsRef.current, newFloatingText];
    setFloatingTexts([...floatingTextsRef.current]);

  } else if (collisionDetected && isShielded) {
    playSound('shield_hit');

    // 💥 Optional burst visual on shield collision
    const newFloatingText = {
      id: generateId(),
      text: '💥',
      x: spaceship.position.x + spaceship.size.width / 2,
      y: spaceship.position.y,
      opacity: 1,
    };
    floatingTextsRef.current = [...floatingTextsRef.current, newFloatingText];
    setFloatingTexts([...floatingTextsRef.current]);
  }

  if (!isBossBattle) {
    spawnObjects();
  }

  // Clear canvas and draw all objects
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (bossExplosion) {
    const radius = 60 + bossExplosion.frame * 2;
    const opacity = 1 - bossExplosion.frame / 30;
    ctx.beginPath();
    ctx.arc(bossExplosion.x, bossExplosion.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(255, 100, 0, ${opacity})`;
    ctx.fill();
  }

  // 🔥 Mine blast wave effect
  if (mineBlast) {
    const maxRadius = Math.max(canvas.width, canvas.height) * 1.2;
    const progress = mineBlast.frame / 30;
    const radius = maxRadius * progress;
    const opacity = 1 - progress;

    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(255, 200, 50, ${opacity})`;
    ctx.fill();
  }

  starsRef.current.forEach((star, i) => {
    const brightness = (i % 3) === 0 ? 1 : 0.6;
    const size = (i % 4) === 0 ? 2 : 1;
    ctx.fillStyle = `rgba(200, 200, 255, ${brightness})`;
    ctx.fillRect(star.x, star.y, size, size);
  });

  drawSprite({
    ctx,
    object: spaceship,
    spriteType: 'spaceship',
    animationFrame: spaceship.animationFrame,
    isShooting: isShooting.current,
  });

  projectilesRef.current.forEach(proj => {
    drawSprite({ ctx, object: proj, spriteType: 'projectile' });
  });

  missilesRef.current.forEach(missile => {
    if (missile.isExploding) {
      drawSprite({
        ctx,
        object: missile,
        spriteType: 'missile_explosion',
        animationFrame: missile.explosionTime,
      });
    } else {
      drawSprite({ ctx, object: missile, spriteType: 'missile' });
    }
  });

  powerUpsRef.current.forEach(pu => {
    if (!pu.collected) {
      let spriteType: 
        | 'spaceship'
        | 'enemy'
        | 'asteroid'
        | 'projectile'
        | 'boss'
        | 'sideways_enemy'
        | 'missile'
        | 'missile_explosion'
        | 'powerup_missile'
        | 'powerup_shield'
        | 'powerup_1up'
        | 'powerup_mine'
        | 'powerup_orbit';

      if (pu.type === 'missile') {
        spriteType = 'powerup_missile';
      } else if (pu.type === 'shield') {
        spriteType = 'powerup_shield';
      } else if (pu.type === 'extra_life') {
        spriteType = 'powerup_1up';
      } else if (pu.type === 'mine') {
        spriteType = 'powerup_mine';
      } else if (pu.type === 'orbiting_orbs') {
        spriteType = 'powerup_orbit';
      }

      if (pu.type === 'orbiting_orbs') {
        console.log('🌀 Orbiting Orb visible at:', pu.position);
      }

      drawSprite({
        ctx,
        object: pu,
        spriteType,
        animationFrame: currentTime * 0.005,
      });
    }
  });

  if (!isBossBattle) {
    asteroidsRef.current.forEach(a => {
      drawSprite({ ctx, object: a, spriteType: 'asteroid', rotation: a.rotation });
    });
    enemiesRef.current.forEach(e => {
      const type = e.aiType === 'sideways_shooter' ? 'sideways_enemy' : 'enemy';
      drawSprite({ ctx, object: e, spriteType: type, animationFrame: e.animationFrame });
    });
  }

  if (currentBossRef.current) {
    drawSprite({
      ctx,
      object: currentBossRef.current,
      spriteType: 'boss',
      animationFrame: currentBossRef.current.animationFrame,
    });
  }

  if (orbitingOrbsActive) {
    const orbCount = 3;
    const radius = 60;
    const centerX = spaceship.position.x + spaceship.size.width / 2;
    const centerY = spaceship.position.y + spaceship.size.height / 2;
    const baseAngle = currentTime * 0.005; // spins over time

    for (let i = 0; i < orbCount; i++) {
      const angle = baseAngle + (i * (Math.PI * 2)) / orbCount;
      const orbX = centerX + radius * Math.cos(angle);
      const orbY = centerY + radius * Math.sin(angle);

      const alpha = orbitingOrbsFlashing
        ? Math.sin(currentTime * 0.02 + i) > 0
          ? 0.3
          : 1
        : 1;

      // 🔥 FIXED DRAWING USING translate() AND drawOrbitPowerUp
      ctx.save();
      ctx.translate(orbX, orbY);
      drawOrbitPowerUp(ctx, { width: 24, height: 24 }, currentTime * 0.01); // reuse your existing function
      ctx.restore();

      // ✅ KEEP collision logic as-is
      asteroidsRef.current = asteroidsRef.current.filter(asteroid => {
        const ax = asteroid.position.x + asteroid.size.width / 2;
        const ay = asteroid.position.y + asteroid.size.height / 2;
        const dist = Math.hypot(orbX - ax, orbY - ay);

        if (dist < asteroid.size.width / 2 + 8) {
          playSound('explosion');
          scoreRef.current += 25;
          return false;
        }
        return true;
      });

      enemiesRef.current = enemiesRef.current.filter(enemy => {
        const ex = enemy.position.x + enemy.size.width / 2;
        const ey = enemy.position.y + enemy.size.height / 2;
        const dist = Math.hypot(orbX - ex, orbY - ey);

        if (dist < enemy.size.width / 2 + 8) {
          playSound('explosion');
          scoreRef.current += 50;
          return false;
        }
        return true;
      });
}

  // Sync updates to visible state
  setAsteroids([...asteroidsRef.current]);
  setEnemies([...enemiesRef.current]);
}

  animationIdRef.current = requestAnimationFrame(gameLoop);
}, [
  isPlaying,
  controls,
  spaceship,
  speed,
  difficulty,
  isBossBattle,
  spawnObjects,
  handleEnemyShooting,
  playSound,
]);
// Start/stop game loop
useEffect(() => {
  if (isPlaying) {
    lastTimeRef.current = performance.now();
    animationIdRef.current = requestAnimationFrame(gameLoop);
  } else if (animationIdRef.current) {
    cancelAnimationFrame(animationIdRef.current);
  }
  return () => {
    if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
  };
}, [isPlaying, gameLoop]);

// Floating texts animation (damage, score popups, etc)
useEffect(() => {
  if (!isPlaying) return;

  const interval = setInterval(() => {
    floatingTextsRef.current = floatingTextsRef.current
      .map(ft => ({ ...ft, y: ft.y - 0.5, opacity: ft.opacity - 0.02 }))
      .filter(ft => ft.opacity > 0);

    setFloatingTexts([...floatingTextsRef.current]);
  }, 16);

  return () => clearInterval(interval);
}, [isPlaying]);

useEffect(() => {
  const handleDevKeys = (e: KeyboardEvent) => {
    if (e.key === 'b') {
      console.log('🧪 DEV: Spawning test boss + 1UP');

      const canvas = canvasRef.current;
      if (!canvas) return;

      // 👾 Spawn a dummy boss
      const boss: Boss = {
        id: 'dev-boss',
        position: { x: canvas.width / 2 - 75, y: 100 },
        size: { width: 150, height: 150 },
        velocity: { x: 0, y: 0 },
        health: 1,
        maxHealth: 1,
        animationFrame: 0,
        lastShot: 0,

        // Required fields with valid enum values
        shootInterval: 2000,
        phase: 1,
        attackPattern: 'spread', 
        movePattern: 'side_to_side',     
        lastPhaseChange: Date.now(),
      };

      currentBossRef.current = boss;
      setCurrentBoss(boss);

      // ❤️ Spawn a 1UP powerup near the spaceship
      const newPowerUp: PowerUp = {
        id: generateId(),
        position: {
          x: spaceship.position.x,
          y: spaceship.position.y - 60,
        },
        size: { width: 30, height: 30 },
        velocity: { x: 0, y: 1 },
        type: 'extra_life',
        collected: false,
      };

      console.log('🚀 Spawned power-up:', newPowerUp.type);
      powerUpsRef.current.push(newPowerUp);
      setPowerUps([...powerUpsRef.current]);
    }
  };

  window.addEventListener('keydown', handleDevKeys);
  return () => window.removeEventListener('keydown', handleDevKeys);
}, [spaceship.position]);

return (
  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
    <GameHUD
      gameState={gameState}
      missiles={spaceship.missiles}
      onPause={() => console.log('Paused')}
      onSettings={() => console.log('Settings')}
    />
    <canvas
      ref={canvasRef}
      className="w-full h-full game-background"
      style={{ touchAction: 'none' }}
    />

    {/* Shield visual effect */}
    {isShielded && (
      <div
        style={{
          position: 'absolute',
          left: spaceship.position.x,
          top: spaceship.position.y,
          width: spaceship.size.width,
          height: spaceship.size.height,
          borderRadius: '50%',
          boxShadow: isShieldInWarningPhase
            ? '0 0 20px 10px rgba(0, 255, 255, 0.3)'
            : '0 0 20px 10px rgba(0, 255, 255, 0.6)',
          animation: isShieldInWarningPhase ? 'flash 0.5s infinite' : undefined,
          zIndex: 10,
          pointerEvents: 'none',
        }}
      />
    )}

    {currentBoss && (
      <BossHealthBar boss={currentBoss} canvasWidth={canvasRef.current?.width || 800} />
    )}

    {/* Damage flash overlay */}
    {damageFlash && (
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(255, 0, 0, 0.3)',
          pointerEvents: 'none',
          zIndex: 20,
          mixBlendMode: 'screen',
          transition: 'opacity 0.2s ease-out',
        }}
      />
    )}

    {/* Floating texts */}
    {floatingTexts.map(text => (
      <div
        key={text.id}
        style={{
          position: 'absolute',
          left: text.x,
          top: text.y,
          color: 'yellow',
          fontWeight: 'bold',
          pointerEvents: 'none',
          userSelect: 'none',
          opacity: text.opacity,
          fontSize: '18px',
          textShadow: '0 0 5px black',
          transform: 'translate(-50%, 0)', // horizontally center
          zIndex: 25,
        }}
      >
        {text.text}
      </div>
    ))}
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
}