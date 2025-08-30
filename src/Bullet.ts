import { Vector2D } from './types.js';

export class Bullet {
    public position: Vector2D;
    public velocity: Vector2D;
    public size: number;
    public active: boolean;
    public playerId: number;
    public explosionRadius: number;

    constructor(position: Vector2D, velocity: Vector2D, size: number, playerId: number, explosionRadius: number = 40) {
        this.position = { ...position };
        this.velocity = { ...velocity };
        this.size = size;
        this.active = true;
        this.playerId = playerId;
        this.explosionRadius = explosionRadius;
    }

    update(): void {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }

    render(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = this.playerId === 1 ? '#ffff00' : '#ff00ff';
        ctx.fillRect(
            this.position.x - this.size / 2,
            this.position.y - this.size / 2,
            this.size,
            this.size
        );
    }

    isOutOfBounds(width: number, height: number): boolean {
        return (
            this.position.x < 0 ||
            this.position.x > width ||
            this.position.y < 0 ||
            this.position.y > height
        );
    }

    checkCollision(other: { position: Vector2D; size: number }): boolean {
        const dx = this.position.x - other.position.x;
        const dy = this.position.y - other.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.size + other.size) / 2;
    }
}
