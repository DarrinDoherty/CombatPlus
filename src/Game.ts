import { Tank } from './Tank.js';
import { Bullet } from './Bullet.js';
import { Explosion } from './Explosion.js';
import { GameConfig } from './types.js';

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private config: GameConfig;
    private leftArmyTanks: Tank[];
    private rightArmyTanks: Tank[];
    private bullets: Bullet[];
    private explosions: Explosion[];
    private pressedKeys: Set<string>;
    private gameRunning: boolean;
    private player1Score: number;
    private player2Score: number;
    private screenShake: number;
    private screenShakeDecay: number;
    private channelWidth: number;
    private channelLeft: number;
    private channelRight: number;

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
        this.leftArmyTanks = [];
        this.rightArmyTanks = [];
        this.pressedKeys = new Set();
        this.gameRunning = true;
        this.player1Score = 0;
        this.player2Score = 0;
        this.screenShake = 0;
        this.screenShakeDecay = 0.9;

        // Setup no man's land channel
        this.channelWidth = 60; // Wide enough for a character to run through
        this.channelLeft = (this.config.canvasWidth / 2) - (this.channelWidth / 2);
        this.channelRight = (this.config.canvasWidth / 2) + (this.channelWidth / 2);

        this.initializeTanks();
        this.setupEventListeners();
        this.updateScore();
    }

    private initializeTanks(): void {
        // Clear existing tanks
        this.leftArmyTanks = [];
        this.rightArmyTanks = [];
        
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
            } while (attempts < 50 && this.isPositionOccupied(leftStartX, leftStartY, this.leftArmyTanks, this.config.tankSize * 1.5));
            
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
                personalities[i] // Different personality for each tank
            );
            this.leftArmyTanks.push(tank);
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
            } while (attempts < 50 && this.isPositionOccupied(rightStartX, rightStartY, this.rightArmyTanks, this.config.tankSize * 1.5));
            
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
                personalities[i] // Different personality for each tank
            );
            this.rightArmyTanks.push(tank);
            console.log(`Created right tank ${i + 1} at (${rightStartX.toFixed(1)}, ${rightStartY.toFixed(1)}) after ${attempts} attempts`);
        }
        
        console.log(`Total tanks created: ${this.leftArmyTanks.length} left, ${this.rightArmyTanks.length} right`);
    }

    private isPositionOccupied(x: number, y: number, existingTanks: Tank[], minDistance: number): boolean {
        for (const tank of existingTanks) {
            const dx = tank.position.x - x;
            const dy = tank.position.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < minDistance) {
                return true;
            }
        }
        return false;
    }

    private checkTankCollision(tank1: Tank, tank2: Tank): boolean {
        const dx = tank1.position.x - tank2.position.x;
        const dy = tank1.position.y - tank2.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = tank1.size + tank2.size;
        
        return distance < minDistance;
    }

    private resolveAllTankCollisions(): void {
        const allTanks = [...this.leftArmyTanks, ...this.rightArmyTanks];
        
        // Multiple passes to ensure all overlaps are resolved
        for (let pass = 0; pass < 3; pass++) {
            for (let i = 0; i < allTanks.length; i++) {
                for (let j = i + 1; j < allTanks.length; j++) {
                    const tank1 = allTanks[i];
                    const tank2 = allTanks[j];
                    
                    if (tank1 && tank2 && this.checkTankCollision(tank1, tank2)) {
                        this.resolveTankCollision(tank1, tank2);
                    }
                }
            }
        }
    }

    private resolveTankCollision(tank1: Tank, tank2: Tank): void {
        // Calculate collision vector
        const dx = tank1.position.x - tank2.position.x;
        const dy = tank1.position.y - tank2.position.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        // Prevent division by zero
        if (distance === 0) {
            distance = 0.1;
            tank1.position.x += 0.1;
        }
        
        // Normalize collision vector
        const normalX = dx / distance;
        const normalY = dy / distance;
        
        // Calculate minimum separation distance
        const minDistance = tank1.size + tank2.size + 5; // Add 5 pixel buffer
        const overlap = minDistance - distance;
        
        if (overlap > 0) {
            // Push tanks apart equally
            const pushDistance = overlap / 2;
            
            tank1.position.x += normalX * pushDistance;
            tank1.position.y += normalY * pushDistance;
            tank2.position.x -= normalX * pushDistance;
            tank2.position.y -= normalY * pushDistance;
            
            // Reverse direction for both tanks when they collide
            const randomFactor1 = (Math.random() - 0.5) * 0.8;
            const randomFactor2 = (Math.random() - 0.5) * 0.8;
            
            tank1.angle += Math.PI + randomFactor1;
            tank2.angle += Math.PI + randomFactor2;
            
            // Normalize angles
            tank1.angle = tank1.angle % (2 * Math.PI);
            tank2.angle = tank2.angle % (2 * Math.PI);
            if (tank1.angle < 0) tank1.angle += 2 * Math.PI;
            if (tank2.angle < 0) tank2.angle += 2 * Math.PI;
        }
    }

    private setupEventListeners(): void {
        document.addEventListener('keydown', (e) => {
            this.pressedKeys.add(e.key);

            // Handle shooting for all tanks
            for (const tank of this.leftArmyTanks) {
                if (e.key === tank.controls.shoot) {
                    const bullet = tank.shoot(this.config.bulletSpeed, this.config.bulletSize);
                    if (bullet) {
                        this.bullets.push(bullet);
                    }
                }
            }

            for (const tank of this.rightArmyTanks) {
                if (e.key === tank.controls.shoot) {
                    const bullet = tank.shoot(this.config.bulletSpeed, this.config.bulletSize);
                    if (bullet) {
                        this.bullets.push(bullet);
                    }
                }
            }

            // Restart game
            if (e.key === 'r' || e.key === 'R') {
                this.restart();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.pressedKeys.delete(e.key);
        });
    }

    private updateScore(): void {
        const player1ScoreElement = document.getElementById('player1Score');
        const player2ScoreElement = document.getElementById('player2Score');
        
        if (player1ScoreElement) {
            player1ScoreElement.textContent = `Player 1: ${this.player1Score}`;
        }
        if (player2ScoreElement) {
            player2ScoreElement.textContent = `Player 2: ${this.player2Score}`;
        }
    }

    private restart(): void {
        this.bullets = [];
        this.explosions = [];
        this.initializeTanks();
        this.gameRunning = true;
    }

    private checkCollisions(): void {
        // Check bullet collisions with tanks
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            if (!bullet) continue;
            
            let hitDetected = false;
            
            // Check collision with left army tanks
            if (bullet.playerId !== 1) {
                for (let j = this.leftArmyTanks.length - 1; j >= 0; j--) {
                    const tank = this.leftArmyTanks[j];
                    if (tank && !tank.isFrozen && bullet.checkCollision(tank)) {
                        // Create explosion at tank position
                        this.explosions.push(new Explosion(tank.position));
                        // Add screen shake effect
                        this.screenShake = 10; // Reduced shake since tank isn't destroyed
                        this.player2Score++;
                        // Freeze the tank instead of destroying it
                        tank.freeze();
                        hitDetected = true;
                        break;
                    }
                }
            }
            
            // Check collision with right army tanks
            if (!hitDetected && bullet.playerId !== 2) {
                for (let j = this.rightArmyTanks.length - 1; j >= 0; j--) {
                    const tank = this.rightArmyTanks[j];
                    if (tank && !tank.isFrozen && bullet.checkCollision(tank)) {
                        // Create explosion at tank position
                        this.explosions.push(new Explosion(tank.position));
                        // Add screen shake effect
                        this.screenShake = 10; // Reduced shake since tank isn't destroyed
                        this.player1Score++;
                        // Freeze the tank instead of destroying it
                        tank.freeze();
                        hitDetected = true;
                        break;
                    }
                }
            }
            
            if (hitDetected) {
                this.bullets.splice(i, 1);
                this.updateScore();
                continue;
            }
        }

        // Remove bullets that are out of bounds
        this.bullets = this.bullets.filter(bullet => 
            bullet && !bullet.isOutOfBounds(this.config.canvasWidth, this.config.canvasHeight)
        );
    }

    public update(): void {
        if (!this.gameRunning) return;

        // Update all tanks with enemy army for AI
        for (const tank of this.leftArmyTanks) {
            // Find closest active (non-frozen) enemy tank for AI targeting
            let closestEnemy: Tank | null = null;
            let closestDistance = Infinity;
            
            for (const enemy of this.rightArmyTanks) {
                // Skip frozen enemies
                if (enemy.isFrozen) continue;
                
                const dx = enemy.position.x - tank.position.x;
                const dy = enemy.position.y - tank.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestEnemy = enemy;
                }
            }
            
            if (closestEnemy) {
                tank.update(this.pressedKeys, this.config.canvasWidth, this.config.canvasHeight, this.channelLeft, this.channelRight, closestEnemy);
                
                // Handle AI shooting
                if (tank.shouldAIShoot(closestEnemy)) {
                    const bullet = tank.shoot(this.config.bulletSpeed, this.config.bulletSize);
                    if (bullet) {
                        this.bullets.push(bullet);
                    }
                }
            } else {
                // No active enemies - patrol behavior or wait
                tank.update(this.pressedKeys, this.config.canvasWidth, this.config.canvasHeight, this.channelLeft, this.channelRight);
            }
        }

        for (const tank of this.rightArmyTanks) {
            // Find closest active (non-frozen) enemy tank for AI targeting
            let closestEnemy: Tank | null = null;
            let closestDistance = Infinity;
            
            for (const enemy of this.leftArmyTanks) {
                // Skip frozen enemies
                if (enemy.isFrozen) continue;
                
                const dx = enemy.position.x - tank.position.x;
                const dy = enemy.position.y - tank.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestEnemy = enemy;
                }
            }
            
            if (closestEnemy) {
                tank.update(this.pressedKeys, this.config.canvasWidth, this.config.canvasHeight, this.channelLeft, this.channelRight, closestEnemy);
                
                // Handle AI shooting
                if (tank.shouldAIShoot(closestEnemy)) {
                    const bullet = tank.shoot(this.config.bulletSpeed, this.config.bulletSize);
                    if (bullet) {
                        this.bullets.push(bullet);
                    }
                }
            } else {
                // No active enemies - patrol behavior or wait
                tank.update(this.pressedKeys, this.config.canvasWidth, this.config.canvasHeight, this.channelLeft, this.channelRight);
            }
        }

        // Handle tank-to-tank collisions for all tanks after movement
        this.resolveAllTankCollisions();

        // Update bullets
        this.bullets.forEach(bullet => bullet.update());

        // Update explosions
        this.explosions.forEach(explosion => explosion.update());
        
        // Remove inactive explosions
        this.explosions = this.explosions.filter(explosion => explosion.active);

        // Update screen shake
        if (this.screenShake > 0) {
            this.screenShake *= this.screenShakeDecay;
            if (this.screenShake < 0.1) {
                this.screenShake = 0;
            }
        }

        // Check collisions
        this.checkCollisions();
    }

    public render(): void {
        // Apply screen shake
        this.ctx.save();
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake;
            const shakeY = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(shakeX, shakeY);
        }

        // Clear canvas
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);

        // Draw background grid (optional visual enhancement)
        this.drawGrid();

        // Draw no man's land channel
        this.drawChannel();

        // Render all tanks
        for (let i = 0; i < this.leftArmyTanks.length; i++) {
            const tank = this.leftArmyTanks[i];
            if (tank) {
                tank.render(this.ctx);
                
                // Debug: Draw tank number
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '14px Arial';
                this.ctx.fillText(`L${i+1}`, tank.position.x - 10, tank.position.y - 20);
            }
        }
        for (let i = 0; i < this.rightArmyTanks.length; i++) {
            const tank = this.rightArmyTanks[i];
            if (tank) {
                tank.render(this.ctx);
                
                // Debug: Draw tank number
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '14px Arial';
                this.ctx.fillText(`R${i+1}`, tank.position.x - 10, tank.position.y - 20);
            }
        }
        
        // Debug: Show tank count in top corner
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Left: ${this.leftArmyTanks.length} | Right: ${this.rightArmyTanks.length}`, 10, 30);

        // Render bullets
        this.bullets.forEach(bullet => bullet.render(this.ctx));

        // Render explosions
        this.explosions.forEach(explosion => explosion.render(this.ctx));

        this.ctx.restore();
    }

    private drawGrid(): void {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x < this.config.canvasWidth; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.config.canvasHeight);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y < this.config.canvasHeight; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.config.canvasWidth, y);
            this.ctx.stroke();
        }
    }

    private drawChannel(): void {
        // Draw the no man's land channel
        this.ctx.fillStyle = '#111'; // Darker color for the ditch
        this.ctx.fillRect(this.channelLeft, 0, this.channelWidth, this.config.canvasHeight);

        // Add some visual texture to make it look like a trench/ditch
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 2;

        // Left edge of channel
        this.ctx.beginPath();
        this.ctx.moveTo(this.channelLeft, 0);
        this.ctx.lineTo(this.channelLeft, this.config.canvasHeight);
        this.ctx.stroke();

        // Right edge of channel
        this.ctx.beginPath();
        this.ctx.moveTo(this.channelRight, 0);
        this.ctx.lineTo(this.channelRight, this.config.canvasHeight);
        this.ctx.stroke();

        // Add some horizontal lines to show depth
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 1;
        for (let y = 0; y < this.config.canvasHeight; y += 30) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.channelLeft + 5, y);
            this.ctx.lineTo(this.channelRight - 5, y);
            this.ctx.stroke();
        }

        // Add warning stripes at the edges
        this.ctx.fillStyle = '#ffff00';
        const stripeWidth = 3;
        for (let y = 0; y < this.config.canvasHeight; y += 20) {
            // Left warning stripe
            this.ctx.fillRect(this.channelLeft - stripeWidth, y, stripeWidth, 10);
            // Right warning stripe
            this.ctx.fillRect(this.channelRight, y, stripeWidth, 10);
        }
    }

    public start(): void {
        const gameLoop = () => {
            this.update();
            this.render();
            requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }
}
