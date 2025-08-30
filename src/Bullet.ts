import { Vector2D } from './types.js';

export class Bullet {
    public position: Vector2D;
    public velocity: Vector2D;
    public size: number;
    public active: boolean;
    public playerId: number;
    public explosionRadius: number;
    public startPosition: Vector2D;
    public targetDistance: number;
    public traveledDistance: number;
    public whistleSound: { stop: () => void } | null;

    constructor(position: Vector2D, velocity: Vector2D, size: number, playerId: number, explosionRadius: number = 40, targetDistance?: number) {
        this.position = { ...position };
        this.velocity = { ...velocity };
        this.size = size;
        this.active = true;
        this.playerId = playerId;
        this.explosionRadius = explosionRadius;
        this.startPosition = { ...position };
        this.targetDistance = targetDistance || 1000; // Default max distance if no target
        this.traveledDistance = 0;
        this.whistleSound = null;
    }

    update(): void {
        // Calculate distance we would travel this frame
        const frameDistance = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        
        // Check if we would exceed target distance
        if (this.traveledDistance + frameDistance >= this.targetDistance) {
            // Stop at target distance (artillery shell explodes at target)
            const remainingDistance = this.targetDistance - this.traveledDistance;
            const velocityMagnitude = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
            
            if (velocityMagnitude > 0) {
                const normalizedVelocity = {
                    x: this.velocity.x / velocityMagnitude,
                    y: this.velocity.y / velocityMagnitude
                };
                
                this.position.x += normalizedVelocity.x * remainingDistance;
                this.position.y += normalizedVelocity.y * remainingDistance;
            }
            
            this.traveledDistance = this.targetDistance;
            this.velocity.x = 0;
            this.velocity.y = 0;
            // Shell will explode on next frame when checked by game logic
        } else {
            // Normal movement
            this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;
            this.traveledDistance += frameDistance;
        }
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

    hasReachedTarget(): boolean {
        return this.traveledDistance >= this.targetDistance;
    }

    stopWhistle(): void {
        if (this.whistleSound) {
            this.whistleSound.stop();
            this.whistleSound = null;
        }
    }

    startWhistle(soundEngine: any): void {
        if (!this.whistleSound) {
            this.whistleSound = soundEngine.startShellWhistle();
        }
    }
}
