import { Vector2D } from './types.js';

export class PickupGrenade {
    public position: Vector2D;
    public spawnTime: number;
    public lifetime: number;
    public flashTime: number;
    public explodeTime: number;
    public size: number;
    public isFlashing: boolean;
    public isExploded: boolean;
    public flashToggle: boolean;
    public lastFlashTime: number;

    constructor(position: Vector2D) {
        this.position = { ...position };
        this.spawnTime = Date.now();
        this.lifetime = 10000; // 10 seconds total lifetime
        this.flashTime = 8000; // Start flashing at 8 seconds
        this.explodeTime = 10000; // Explode at 10 seconds
        this.size = 8;
        this.isFlashing = false;
        this.isExploded = false;
        this.flashToggle = true;
        this.lastFlashTime = 0;
    }

    update(): void {
        const currentTime = Date.now();
        const age = currentTime - this.spawnTime;

        // Start flashing when near expiration
        if (age >= this.flashTime && age < this.explodeTime) {
            this.isFlashing = true;
            // Toggle flash every 200ms
            if (currentTime - this.lastFlashTime > 200) {
                this.flashToggle = !this.flashToggle;
                this.lastFlashTime = currentTime;
            }
        }

        // Explode if time runs out
        if (age >= this.explodeTime) {
            this.isExploded = true;
        }
    }

    render(ctx: CanvasRenderingContext2D): void {
        if (this.isExploded) return;

        ctx.save();

        // If flashing, only render when flashToggle is true
        if (this.isFlashing && !this.flashToggle) {
            ctx.restore();
            return;
        }

        // Draw grenade body (dark green circle)
        ctx.fillStyle = this.isFlashing ? '#ff6600' : '#006600';
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size, 0, 2 * Math.PI);
        ctx.fill();

        // Draw pin/lever (small rectangle on top)
        ctx.fillStyle = '#888888';
        ctx.fillRect(
            this.position.x - 2,
            this.position.y - this.size - 3,
            4,
            3
        );

        // Draw highlight
        ctx.fillStyle = this.isFlashing ? '#ffaa44' : '#009900';
        ctx.beginPath();
        ctx.arc(this.position.x - 2, this.position.y - 2, this.size * 0.3, 0, 2 * Math.PI);
        ctx.fill();

        ctx.restore();
    }

    isExpired(): boolean {
        return this.isExploded;
    }

    canBePickedUp(): boolean {
        return !this.isExploded;
    }

    // Check if player is close enough to pick up
    isInPickupRange(playerPosition: Vector2D, playerSize: number): boolean {
        const distance = Math.sqrt(
            Math.pow(this.position.x - playerPosition.x, 2) +
            Math.pow(this.position.y - playerPosition.y, 2)
        );
        return distance < (this.size + playerSize / 2);
    }
}
