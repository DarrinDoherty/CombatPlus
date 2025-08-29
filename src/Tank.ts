import { Vector2D, Controls } from './types.js';
import { Bullet } from './Bullet.js';

export class Tank {
    public position: Vector2D;
    public angle: number;
    public size: number;
    public speed: number;
    public color: string;
    public playerId: number;
    public controls: Controls;
    public lastShotTime: number;
    public shootCooldown: number;

    constructor(
        position: Vector2D,
        size: number,
        speed: number,
        color: string,
        playerId: number,
        controls: Controls
    ) {
        this.position = { ...position };
        this.angle = 0;
        this.size = size;
        this.speed = speed;
        this.color = color;
        this.playerId = playerId;
        this.controls = controls;
        this.lastShotTime = 0;
        this.shootCooldown = 500; // milliseconds
    }

    update(pressedKeys: Set<string>, canvasWidth: number, canvasHeight: number, channelLeft?: number, channelRight?: number): void {
        // Movement
        let dx = 0;
        let dy = 0;

        if (pressedKeys.has(this.controls.up)) {
            dy -= this.speed;
        }
        if (pressedKeys.has(this.controls.down)) {
            dy += this.speed;
        }
        if (pressedKeys.has(this.controls.left)) {
            dx -= this.speed;
        }
        if (pressedKeys.has(this.controls.right)) {
            dx += this.speed;
        }

        // Update angle based on movement
        if (dx !== 0 || dy !== 0) {
            this.angle = Math.atan2(dy, dx);
        }

        // Update position with boundary checking
        let newX = this.position.x + dx;
        let newY = this.position.y + dy;

        // Standard boundary checking
        newX = Math.max(this.size / 2, Math.min(canvasWidth - this.size / 2, newX));
        newY = Math.max(this.size / 2, Math.min(canvasHeight - this.size / 2, newY));

        // Channel boundary checking (if channel exists)
        if (channelLeft !== undefined && channelRight !== undefined) {
            // Player 1 (left side) cannot cross into the channel
            if (this.playerId === 1 && newX + this.size / 2 > channelLeft) {
                newX = channelLeft - this.size / 2;
            }
            // Player 2 (right side) cannot cross into the channel
            if (this.playerId === 2 && newX - this.size / 2 < channelRight) {
                newX = channelRight + this.size / 2;
            }
        }

        this.position.x = newX;
        this.position.y = newY;
    }

    canShoot(): boolean {
        return Date.now() - this.lastShotTime > this.shootCooldown;
    }

    shoot(bulletSpeed: number, bulletSize: number): Bullet | null {
        if (!this.canShoot()) {
            return null;
        }

        this.lastShotTime = Date.now();

        const bulletVelocity: Vector2D = {
            x: Math.cos(this.angle) * bulletSpeed,
            y: Math.sin(this.angle) * bulletSpeed
        };

        return new Bullet(
            { ...this.position },
            bulletVelocity,
            bulletSize,
            this.playerId
        );
    }

    render(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle);

        // Tank body
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);

        // Tank barrel
        ctx.fillStyle = '#888';
        ctx.fillRect(0, -2, this.size / 2, 4);

        // Tank outline
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(-this.size / 2, -this.size / 2, this.size, this.size);

        ctx.restore();
    }

    checkCollision(other: Tank): boolean {
        const dx = this.position.x - other.position.x;
        const dy = this.position.y - other.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.size;
    }
}
