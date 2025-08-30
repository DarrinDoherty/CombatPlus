import { Vector2D } from './types.js';

export class Player {
    public position: Vector2D;
    public size: number;
    public speed: number;
    public color: string;
    public isCarryingSoldier: boolean;
    public grenadeCount: number;
    public grenadeCooldown: number;
    public lastGrenadeTime: number;

    constructor(position: Vector2D, size: number, speed: number) {
        this.position = { ...position };
        this.size = size;
        this.speed = speed;
        this.color = '#ffff00'; // Yellow color for medic
        this.isCarryingSoldier = false;
        this.grenadeCount = 3; // Start with 3 freeze grenades
        this.grenadeCooldown = 3000; // 3 seconds between grenades
        this.lastGrenadeTime = 0;
    }

    update(pressedKeys: Set<string>, canvasHeight: number, channelLeft: number, channelRight: number): void {
        // Vertical movement only - use arrow keys
        if (pressedKeys.has('ArrowUp')) {
            this.position.y -= this.speed;
        }
        if (pressedKeys.has('ArrowDown')) {
            this.position.y += this.speed;
        }

        // Keep player within bounds
        if (this.position.y < this.size) {
            this.position.y = this.size;
        }
        if (this.position.y > canvasHeight - this.size) {
            this.position.y = canvasHeight - this.size;
        }

        // Keep player in the channel (horizontal bounds)
        const channelCenter = (channelLeft + channelRight) / 2;
        this.position.x = channelCenter; // Lock to center of channel
    }

    render(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        
        // Draw player as a medic (yellow circle with red cross)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size / 2, 0, 2 * Math.PI);
        ctx.fill();
        
        // Add red cross symbol for medic
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Horizontal line
        ctx.moveTo(this.position.x - this.size / 4, this.position.y);
        ctx.lineTo(this.position.x + this.size / 4, this.position.y);
        // Vertical line
        ctx.moveTo(this.position.x, this.position.y - this.size / 4);
        ctx.lineTo(this.position.x, this.position.y + this.size / 4);
        ctx.stroke();
        
        // Add outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size / 2, 0, 2 * Math.PI);
        ctx.stroke();
        
        // If carrying soldier, show indicator
        if (this.isCarryingSoldier) {
            ctx.fillStyle = '#00ff00';
            ctx.font = '12px Arial';
            ctx.fillText('RESCUE', this.position.x - 20, this.position.y - 25);
        }

        // Show grenade count
        ctx.fillStyle = '#00ccff';
        ctx.font = '10px Arial';
        ctx.fillText(`Grenades: ${this.grenadeCount}`, this.position.x - 25, this.position.y + 20);
        
        ctx.restore();
    }

    checkCollision(bullet: { position: Vector2D; size: number }): boolean {
        const dx = this.position.x - bullet.position.x;
        const dy = this.position.y - bullet.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.size / 2 + bullet.size / 2);
    }

    pickupSoldier(): void {
        this.isCarryingSoldier = true;
    }

    dropOffSoldier(): void {
        this.isCarryingSoldier = false;
    }

    canThrowGrenade(): boolean {
        const currentTime = Date.now();
        return this.grenadeCount > 0 && (currentTime - this.lastGrenadeTime) >= this.grenadeCooldown;
    }

    throwGrenade(targetDirection: Vector2D): { position: Vector2D; velocity: Vector2D } | null {
        if (!this.canThrowGrenade()) {
            return null;
        }

        this.grenadeCount--;
        this.lastGrenadeTime = Date.now();

        // Calculate throw velocity (aim towards mouse or default direction)
        const throwSpeed = 8;
        const normalizedDirection = this.normalizeVector(targetDirection);
        
        return {
            position: { ...this.position },
            velocity: {
                x: normalizedDirection.x * throwSpeed,
                y: normalizedDirection.y * throwSpeed - 2 // Add upward arc
            }
        };
    }

    private normalizeVector(vector: Vector2D): Vector2D {
        const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        if (magnitude === 0) return { x: 0, y: 1 }; // Default downward
        return {
            x: vector.x / magnitude,
            y: vector.y / magnitude
        };
    }

    refillGrenades(): void {
        this.grenadeCount = 3;
    }
}
