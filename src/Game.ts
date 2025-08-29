import { Tank } from './Tank.js';
import { Bullet } from './Bullet.js';
import { Explosion } from './Explosion.js';
import { GameConfig } from './types.js';

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private config: GameConfig;
    private tank1!: Tank;
    private tank2!: Tank;
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
            tankSpeed: 3,
            bulletSpeed: 5,
            tankSize: 30,
            bulletSize: 6
        };

        this.bullets = [];
        this.explosions = [];
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
        // Player 1 tank (starts on left side, away from channel)
        this.tank1 = new Tank(
            { x: this.channelLeft / 2, y: this.config.canvasHeight / 2 },
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
            }
        );

        // Player 2 tank (starts on right side, away from channel)
        this.tank2 = new Tank(
            { x: this.channelRight + (this.config.canvasWidth - this.channelRight) / 2, y: this.config.canvasHeight / 2 },
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
            }
        );
    }

    private setupEventListeners(): void {
        document.addEventListener('keydown', (e) => {
            this.pressedKeys.add(e.key);

            // Handle shooting
            if (e.key === this.tank1.controls.shoot) {
                const bullet = this.tank1.shoot(this.config.bulletSpeed, this.config.bulletSize);
                if (bullet) {
                    this.bullets.push(bullet);
                }
            }

            if (e.key === this.tank2.controls.shoot) {
                const bullet = this.tank2.shoot(this.config.bulletSpeed, this.config.bulletSize);
                if (bullet) {
                    this.bullets.push(bullet);
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
            
            // Check collision with tank1
            if (bullet.playerId !== 1 && bullet.checkCollision(this.tank1)) {
                // Create explosion at tank position
                this.explosions.push(new Explosion(this.tank1.position));
                // Add screen shake effect
                this.screenShake = 15;
                this.player2Score++;
                this.bullets.splice(i, 1);
                this.restart();
                this.updateScore();
                continue;
            }
            
            // Check collision with tank2
            if (bullet.playerId !== 2 && bullet.checkCollision(this.tank2)) {
                // Create explosion at tank position
                this.explosions.push(new Explosion(this.tank2.position));
                // Add screen shake effect
                this.screenShake = 15;
                this.player1Score++;
                this.bullets.splice(i, 1);
                this.restart();
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

        // Update tanks
        this.tank1.update(this.pressedKeys, this.config.canvasWidth, this.config.canvasHeight, this.channelLeft, this.channelRight);
        this.tank2.update(this.pressedKeys, this.config.canvasWidth, this.config.canvasHeight, this.channelLeft, this.channelRight);

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

        // Render tanks
        this.tank1.render(this.ctx);
        this.tank2.render(this.ctx);

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
