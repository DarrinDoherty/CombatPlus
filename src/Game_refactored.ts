import { Tank } from './Tank.js';
import { Player } from './Player.js';
import { Bullet } from './Bullet.js';
import { Explosion } from './Explosion.js';
import { InjuredSoldier } from './InjuredSoldier.js';
import { FreezeGrenade } from './FreezeGrenade.js';
import { GameConfig } from './types.js';

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private config: GameConfig;
    private tanks: Tank[];
    private player: Player | null;
    private bullets: Bullet[];
    private explosions: Explosion[];
    private freezeGrenades: FreezeGrenade[];
    private pressedKeys: Set<string>;
    private gameRunning: boolean;
    private player1Score: number;
    private player2Score: number;
    private playerLives: number;
    private gameOver: boolean;
    private injuredSoldier: InjuredSoldier | null;
    private missionComplete: boolean;
    private rescuesCompleted: number;
    private baseFreezeTime: number;
    private screenShake: number;
    private screenShakeDecay: number;
    private channelWidth: number;
    private channelLeft: number;
    private channelRight: number;
    private lastSpawnTime: number;
    private spawnInterval: number;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get 2D context from canvas');
        }
        this.ctx = ctx;

        this.config = {
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            tankSpeed: 1.5, // Much slower movement - was 3
            bulletSpeed: 8, // Keep bullets fast for danger
            tankSize: 30,
            bulletSize: 6
        };

        this.bullets = [];
        this.explosions = [];
        this.freezeGrenades = [];
        this.tanks = [];
        this.player = null;
        this.injuredSoldier = null;
        this.missionComplete = false;
        this.rescuesCompleted = 0;
        this.baseFreezeTime = 5000; // Start with 5 seconds freeze time
        this.pressedKeys = new Set();
        this.gameRunning = false; // Start in not-running mode
        this.player1Score = 0;
        this.player2Score = 0;
        this.playerLives = 3;
        this.gameOver = false;
        this.screenShake = 0;
        this.screenShakeDecay = 0.9;

        // Setup no man's land channel
        this.channelWidth = 60; // Wide enough for a character to run through
        this.channelLeft = (this.config.canvasWidth / 2) - (this.channelWidth / 2);
        this.channelRight = (this.config.canvasWidth / 2) + (this.channelWidth / 2);

        // Tank spawning system
        this.lastSpawnTime = Date.now();
        this.spawnInterval = 15000; // Start with 15 seconds between spawns

        this.initializeTanks();
        this.initializePlayer();
        this.initializeInjuredSoldier();
        this.setupEventListeners();
        this.updateScore();
    }

    private initializeTanks(): void {
        // Clear existing tanks
        this.tanks = [];
        
        // Generate random starting positions within each army's territory
        const leftArmyBounds = {
            minX: 50,
            maxX: this.channelLeft - 50,
            minY: 50,
            maxY: this.config.canvasHeight - 50
        };
        
        const rightArmyBounds = {
            minX: this.channelRight + 50,
            maxX: this.config.canvasWidth - 50,
            minY: 50,
            maxY: this.config.canvasHeight - 50
        };
        
        // Personality types to cycle through
        const personalities = ['aggressive', 'sniper', 'defensive', 'flanker', 'aggressive'] as const;
        
        // Create 5 tanks for left army (player 1)
        for (let i = 0; i < 5; i++) {
            let leftStartX, leftStartY;
            let attempts = 0;
            
            // Try to find a position that doesn't overlap with existing tanks
            do {
                leftStartX = leftArmyBounds.minX + Math.random() * (leftArmyBounds.maxX - leftArmyBounds.minX);
                leftStartY = leftArmyBounds.minY + Math.random() * (leftArmyBounds.maxY - leftArmyBounds.minY);
                attempts++;
            } while (attempts < 50 && this.isPositionOccupied(leftStartX, leftStartY, this.tanks, this.config.tankSize * 1.5));
            
            const tank = new Tank(
                { x: leftStartX, y: leftStartY },
                this.config.tankSize,
                this.config.tankSpeed,
                '#00ff00',
                1,
                {
                    up: 'w',
                    down: 's',
                    left: 'a',
                    right: 'd',
                    shoot: ' ' // spacebar
                },
                true, // AI enabled
                personalities[i], // Different personality for each tank
                'left'
            );
            this.tanks.push(tank);
            console.log(`Created left tank ${i + 1} at (${leftStartX.toFixed(1)}, ${leftStartY.toFixed(1)}) after ${attempts} attempts`);
        }
        
        // Create 5 tanks for right army (player 2)
        for (let i = 0; i < 5; i++) {
            let rightStartX, rightStartY;
            let attempts = 0;
            
            // Try to find a position that doesn't overlap with existing tanks
            do {
                rightStartX = rightArmyBounds.minX + Math.random() * (rightArmyBounds.maxX - rightArmyBounds.minX);
                rightStartY = rightArmyBounds.minY + Math.random() * (rightArmyBounds.maxY - rightArmyBounds.minY);
                attempts++;
            } while (attempts < 50 && this.isPositionOccupied(rightStartX, rightStartY, this.tanks, this.config.tankSize * 1.5));
            
            const tank = new Tank(
                { x: rightStartX, y: rightStartY },
                this.config.tankSize,
                this.config.tankSpeed,
                '#ff0000',
                2,
                {
                    up: 'ArrowUp',
                    down: 'ArrowDown',
                    left: 'ArrowLeft',
                    right: 'ArrowRight',
                    shoot: 'Enter'
                },
                true, // AI enabled
                personalities[i], // Different personality for each tank
                'right'
            );
            this.tanks.push(tank);
            console.log(`Created right tank ${i + 1} at (${rightStartX.toFixed(1)}, ${rightStartY.toFixed(1)}) after ${attempts} attempts`);
        }
        
        const leftCount = this.tanks.filter(t => t.team === 'left').length;
        const rightCount = this.tanks.filter(t => t.team === 'right').length;
        console.log(`Total tanks created: ${leftCount} left, ${rightCount} right`);
    }

    private spawnNewTank(): void {
        const currentTime = Date.now();
        if (currentTime - this.lastSpawnTime < this.spawnInterval) {
            return;
        }

        // Dynamic spawn interval - gets shorter as more soldiers are rescued
        const baseInterval = 15000; // 15 seconds
        const minInterval = 3000;   // 3 seconds minimum
        this.spawnInterval = Math.max(minInterval, baseInterval - (this.rescuesCompleted * 2000));

        // Randomly choose which side to spawn on
        const spawnLeft = Math.random() < 0.5;
        const team = spawnLeft ? 'left' : 'right';
        
        // Define spawn areas on the outer edges
        const spawnBounds = spawnLeft ? {
            minX: 10,
            maxX: 80,
            minY: 50,
            maxY: this.config.canvasHeight - 50
        } : {
            minX: this.config.canvasWidth - 80,
            maxX: this.config.canvasWidth - 10,
            minY: 50,
            maxY: this.config.canvasHeight - 50
        };

        // Find spawn position
        let spawnX, spawnY;
        let attempts = 0;
        do {
            spawnX = spawnBounds.minX + Math.random() * (spawnBounds.maxX - spawnBounds.minX);
            spawnY = spawnBounds.minY + Math.random() * (spawnBounds.maxY - spawnBounds.minY);
            attempts++;
        } while (attempts < 20 && this.isPositionOccupied(spawnX, spawnY, this.tanks, this.config.tankSize * 2));

        if (attempts >= 20) {
            console.log('Could not find spawn position for new tank');
            return;
        }

        // Random personality
        const personalities = ['aggressive', 'sniper', 'defensive', 'flanker'] as const;
        const personality = personalities[Math.floor(Math.random() * personalities.length)];

        const tank = new Tank(
            { x: spawnX, y: spawnY },
            this.config.tankSize,
            this.config.tankSpeed,
            team === 'left' ? '#00ff00' : '#ff0000',
            team === 'left' ? 1 : 2,
            team === 'left' ? {
                up: 'w',
                down: 's',
                left: 'a',
                right: 'd',
                shoot: ' '
            } : {
                up: 'ArrowUp',
                down: 'ArrowDown',
                left: 'ArrowLeft',
                right: 'ArrowRight',
                shoot: 'Enter'
            },
            true,
            personality,
            team
        );

        this.tanks.push(tank);
        this.lastSpawnTime = currentTime;
        
        console.log(`Spawned new ${team} tank with ${personality} personality. Spawn interval: ${this.spawnInterval/1000}s`);
    }

    private getTanksByTeam(team: 'left' | 'right'): Tank[] {
        return this.tanks.filter(tank => tank.team === team);
    }

    private getEnemyTanks(tank: Tank): Tank[] {
        return this.tanks.filter(t => t.team !== tank.team);
    }

    private isPositionOccupied(x: number, y: number, tanks: Tank[], minDistance: number): boolean {
        for (const tank of tanks) {
            const dx = x - tank.position.x;
            const dy = y - tank.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < minDistance) {
                return true;
            }
        }
        return false;
    }

    private initializePlayer(): void {
        // Start player at the top of the channel
        const startX = this.config.canvasWidth / 2;
        const startY = 30;
        
        this.player = new Player(
            { x: startX, y: startY },
            20, // Player size
            3   // Player speed (faster than tanks)
        );
    }

    private initializeInjuredSoldier(): void {
        // Place injured soldier at the bottom of the channel
        const soldierX = this.config.canvasWidth / 2;
        const soldierY = this.config.canvasHeight - 50;
        
        this.injuredSoldier = new InjuredSoldier({ x: soldierX, y: soldierY }, 15);
    }

    start(): void {
        if (!this.gameRunning) {
            this.gameRunning = true;
            this.gameLoop();
        }
    }

    pause(): void {
        this.gameRunning = false;
    }

    restart(): void {
        // Reset all game state
        this.gameRunning = false;
        this.gameOver = false;
        this.missionComplete = false;
        this.rescuesCompleted = 0;
        this.playerLives = 3;
        this.bullets = [];
        this.explosions = [];
        this.freezeGrenades = [];
        this.screenShake = 0;
        this.lastSpawnTime = Date.now();
        this.spawnInterval = 15000; // Reset spawn interval
        
        // Reinitialize everything
        this.initializeTanks();
        this.initializePlayer();
        this.initializeInjuredSoldier();
        
        // Reset player grenades
        if (this.player) {
            this.player.refillGrenades();
        }
        
        this.updateScore();
        
        // Start the game
        this.gameRunning = true;
        this.gameLoop();
    }

    private updateAI(): void {
        if (!this.gameRunning) return;

        // Update each tank's AI with nearest enemy
        for (const tank of this.tanks) {
            if (tank.isAI) {
                const enemies = this.getEnemyTanks(tank);
                let nearestEnemy: Tank | undefined;
                let minDistance = Infinity;
                
                for (const enemy of enemies) {
                    const dx = enemy.position.x - tank.position.x;
                    const dy = enemy.position.y - tank.position.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestEnemy = enemy;
                    }
                }
                
                tank.update(this.pressedKeys, this.config.canvasWidth, this.config.canvasHeight, this.channelLeft, this.channelRight, nearestEnemy);
                
                // Handle AI shooting
                if (nearestEnemy && tank.canShoot()) {
                    const bullet = tank.shoot(this.config.bulletSpeed, this.config.bulletSize);
                    if (bullet) {
                        this.bullets.push(bullet);
                    }
                }
            }
        }
    }

    private handleCollisions(): void {
        // Check bullet-tank collisions
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            let bulletHit = false;

            // Check collision with tanks
            for (let j = this.tanks.length - 1; j >= 0; j--) {
                const tank = this.tanks[j];
                
                // Skip if bullet is from same team
                if (bullet.playerId === tank.playerId) continue;

                const dx = bullet.position.x - tank.position.x;
                const dy = bullet.position.y - tank.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < tank.size / 2 + bullet.size / 2) {
                    // Tank hit!
                    const result = tank.takeDamage();
                    
                    // Create explosion
                    this.explosions.push(new Explosion(
                        { x: tank.position.x, y: tank.position.y },
                        result === 'destroyed' ? 30 : 15
                    ));
                    
                    if (result === 'destroyed') {
                        console.log(`Tank destroyed! Removing from battlefield.`);
                        this.tanks.splice(j, 1);
                    } else if (result === 'disabled') {
                        console.log(`Tank disabled! Cannot move or shoot.`);
                    }

                    this.bullets.splice(i, 1);
                    bulletHit = true;
                    this.screenShake = 5;
                    break;
                }
            }

            // Check collision with player
            if (!bulletHit && this.player) {
                const dx = bullet.position.x - this.player.position.x;
                const dy = bullet.position.y - this.player.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.player.size / 2 + bullet.size / 2) {
                    // Player hit!
                    this.bullets.splice(i, 1);
                    this.playerLives--;
                    
                    // Create explosion at player position
                    this.explosions.push(new Explosion(
                        { x: this.player.position.x, y: this.player.position.y },
                        20
                    ));
                    
                    this.screenShake = 8;
                    bulletHit = true;

                    if (this.playerLives <= 0) {
                        this.gameOver = true;
                        this.gameRunning = false;
                    } else {
                        // Reset player position if they have lives left
                        this.player.position = { x: this.config.canvasWidth / 2, y: 30 };
                        this.player.isCarryingSoldier = false; // Drop soldier if carrying
                    }
                    
                    this.updateScore();
                }
            }
        }
    }

    private gameLoop(): void {
        if (!this.gameRunning) return;

        this.update();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    private update(): void {
        // Update player
        if (this.player) {
            this.player.update(this.pressedKeys, this.config.canvasHeight, this.channelLeft, this.channelRight);
        }

        // Update AI
        this.updateAI();
        
        // Spawn new tanks
        this.spawnNewTank();

        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update();

            // Remove bullets that are off-screen
            if (bullet.position.x < 0 || bullet.position.x > this.config.canvasWidth ||
                bullet.position.y < 0 || bullet.position.y > this.config.canvasHeight) {
                this.bullets.splice(i, 1);
            }
        }

        // Update explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            explosion.update();
            if (!explosion.active) {
                this.explosions.splice(i, 1);
            }
        }

        // Update freeze grenades
        this.updateFreezeGrenades();

        // Check player-soldier collision
        if (this.player && this.injuredSoldier && !this.player.isCarryingSoldier) {
            const dx = this.player.position.x - this.injuredSoldier.position.x;
            const dy = this.player.position.y - this.injuredSoldier.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.player.size / 2 + this.injuredSoldier.size / 2) {
                this.player.isCarryingSoldier = true;
                console.log('Soldier rescued! Bring them to safety at the top!');
            }
        }

        // Check if player reached safety with soldier
        if (this.player && this.player.isCarryingSoldier && this.player.position.y < 50) {
            this.rescuesCompleted++;
            this.player.isCarryingSoldier = false;
            
            // Create new injured soldier
            this.initializeInjuredSoldier();
            
            // Update difficulty - tanks freeze for less time as more rescues are completed
            this.baseFreezeTime = Math.max(1000, 5000 - (this.rescuesCompleted * 800));
            
            this.updateScore();
            console.log(`Soldier ${this.rescuesCompleted} rescued! Freeze time now: ${this.baseFreezeTime/1000}s`);
        }

        // Handle collisions
        this.handleCollisions();

        // Update screen shake
        if (this.screenShake > 0) {
            this.screenShake *= this.screenShakeDecay;
            if (this.screenShake < 0.1) this.screenShake = 0;
        }
    }

    private updateFreezeGrenades(): void {
        for (let i = this.freezeGrenades.length - 1; i >= 0; i--) {
            const grenade = this.freezeGrenades[i];
            grenade.update();
            
            if (!grenade.active) {
                // Grenade has exploded, freeze all tanks in range
                this.freezeAllTanksInRange(grenade.position, grenade.explosionRadius);
                this.freezeGrenades.splice(i, 1);
            }
        }
    }

    private freezeAllTanksInRange(center: { x: number, y: number }, radius: number): void {
        let tanksAffected = 0;
        for (const tank of this.tanks) {
            const dx = tank.position.x - center.x;
            const dy = tank.position.y - center.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= radius) {
                tank.freeze(this.baseFreezeTime);
                tanksAffected++;
            }
        }
        
        console.log(`Freeze grenade affected ${tanksAffected} tanks for ${this.baseFreezeTime/1000}s`);
        
        // Create explosion effect
        this.explosions.push(new Explosion(center, 25));
        this.screenShake = 3;
    }

    throwFreezeGrenade(): void {
        if (this.player && this.player.canThrowGrenade()) {
            const grenadeData = this.player.throwGrenade({ x: 0, y: 1 }); // Default downward throw
            if (grenadeData) {
                const grenade = new FreezeGrenade(grenadeData.position, grenadeData.velocity);
                this.freezeGrenades.push(grenade);
                console.log(`Freeze grenade thrown! ${this.player.grenadeCount} grenades remaining.`);
            }
        }
    }

    private render(): void {
        // Apply screen shake
        this.ctx.save();
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake;
            const shakeY = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(shakeX, shakeY);
        }

        // Clear canvas
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);

        // Draw no man's land channel
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(this.channelLeft, 0, this.channelWidth, this.config.canvasHeight);
        
        // Draw channel borders
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.channelLeft, 0);
        this.ctx.lineTo(this.channelLeft, this.config.canvasHeight);
        this.ctx.moveTo(this.channelRight, 0);
        this.ctx.lineTo(this.channelRight, this.config.canvasHeight);
        this.ctx.stroke();

        // Render tanks
        for (const tank of this.tanks) {
            tank.render(this.ctx);
        }

        // Render bullets
        for (const bullet of this.bullets) {
            bullet.render(this.ctx);
        }

        // Render explosions
        for (const explosion of this.explosions) {
            explosion.render(this.ctx);
        }

        // Render freeze grenades
        for (const grenade of this.freezeGrenades) {
            grenade.render(this.ctx);
        }

        // Render player
        if (this.player) {
            this.player.render(this.ctx);
        }

        // Render injured soldier
        if (this.injuredSoldier) {
            this.injuredSoldier.render(this.ctx);
        }

        // Draw UI text
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        
        const tankCount = this.tanks.length;
        const leftTanks = this.getTanksByTeam('left').length;
        const rightTanks = this.getTanksByTeam('right').length;
        
        this.ctx.fillText(`Tanks: ${leftTanks} vs ${rightTanks} (Total: ${tankCount})`, 10, 25);
        this.ctx.fillText(`Next spawn: ${Math.max(0, Math.ceil((this.spawnInterval - (Date.now() - this.lastSpawnTime))/1000))}s`, 10, 45);

        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);
            
            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('MISSION FAILED', this.config.canvasWidth / 2, this.config.canvasHeight / 2);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Soldiers Rescued: ${this.rescuesCompleted}`, this.config.canvasWidth / 2, this.config.canvasHeight / 2 + 50);
            this.ctx.fillText('Click RESTART to try again', this.config.canvasWidth / 2, this.config.canvasHeight / 2 + 80);
        }

        this.ctx.restore();
    }

    private updateScore(): void {
        const player1ScoreElement = document.getElementById('player1Score');
        const player2ScoreElement = document.getElementById('player2Score');
        
        if (player1ScoreElement) {
            player1ScoreElement.textContent = `Lives: ${this.playerLives} | Rescues: ${this.rescuesCompleted}`;
        }
        
        if (player2ScoreElement) {
            if (this.gameOver) {
                player2ScoreElement.textContent = `MISSION FAILED | Freeze: ${(this.baseFreezeTime/1000).toFixed(1)}s`;
            } else if (!this.gameRunning) {
                player2ScoreElement.textContent = `Press START to begin | Freeze: ${(this.baseFreezeTime/1000).toFixed(1)}s`;
            } else {
                const tankCount = this.tanks.length;
                player2ScoreElement.textContent = `Tanks: ${tankCount} | Freeze: ${(this.baseFreezeTime/1000).toFixed(1)}s`;
            }
        }
    }

    private setupEventListeners(): void {
        window.addEventListener('keydown', (e) => {
            this.pressedKeys.add(e.key);
            
            // Handle grenade throwing
            if (e.key === ' ' && this.gameRunning) {
                e.preventDefault();
                this.throwFreezeGrenade();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.pressedKeys.delete(e.key);
        });

        // Restart button
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.restart();
            });
        }
    }
}
