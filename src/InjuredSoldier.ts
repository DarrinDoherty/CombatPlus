import { Vector2D } from './types.js';

export class InjuredSoldier {
    public position: Vector2D;
    public size: number;
    public isRescued: boolean;
    public color: string;
    public spawnTime: number;
    public bleedOutTime: number;
    public maxBleedOutTime: number;
    public isDead: boolean;
    public pulseTimer: number;

    constructor(position: Vector2D, size: number) {
        this.position = { ...position };
        this.size = size;
        this.isRescued = false;
        this.color = '#ff0000'; // Red color for injured soldier
        this.spawnTime = Date.now();
        this.maxBleedOutTime = 30000; // 30 seconds to bleed out
        this.bleedOutTime = this.maxBleedOutTime;
        this.isDead = false;
        this.pulseTimer = 0;
    }

    update(): void {
        if (this.isRescued || this.isDead) return;

        const currentTime = Date.now();
        const elapsed = currentTime - this.spawnTime;
        this.bleedOutTime = Math.max(0, this.maxBleedOutTime - elapsed);
        this.pulseTimer += 16; // Assuming ~60fps

        // Check if soldier has bled out
        if (this.bleedOutTime <= 0) {
            this.isDead = true;
        }
    }

    getBleedOutPercentage(): number {
        return this.bleedOutTime / this.maxBleedOutTime;
    }

    render(ctx: CanvasRenderingContext2D): void {
        if (this.isRescued) return; // Don't render if already rescued

        ctx.save();
        
        // Calculate health percentage for visual effects
        const healthPercentage = this.getBleedOutPercentage();
        
        // Color gets darker red as health decreases
        let soldierColor = this.color;
        if (this.isDead) {
            soldierColor = '#330000'; // Very dark red when dead
        } else if (healthPercentage < 0.3) {
            // Pulse effect when critically low
            const pulse = Math.sin(this.pulseTimer * 0.2) * 0.3 + 0.7;
            const redIntensity = Math.floor(255 * pulse);
            soldierColor = `rgb(${redIntensity}, 0, 0)`;
        } else if (healthPercentage < 0.6) {
            soldierColor = '#cc0000'; // Darker red when wounded
        }
        
        // Draw injured soldier as a red circle
        ctx.fillStyle = soldierColor;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size / 2, 0, 2 * Math.PI);
        ctx.fill();
        
        // Add white cross symbol (if not dead)
        if (!this.isDead) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            // Horizontal line
            ctx.moveTo(this.position.x - this.size / 3, this.position.y);
            ctx.lineTo(this.position.x + this.size / 3, this.position.y);
            // Vertical line
            ctx.moveTo(this.position.x, this.position.y - this.size / 3);
            ctx.lineTo(this.position.x, this.position.y + this.size / 3);
            ctx.stroke();
        } else {
            // Draw X for dead soldier
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            // \ line
            ctx.moveTo(this.position.x - this.size / 3, this.position.y - this.size / 3);
            ctx.lineTo(this.position.x + this.size / 3, this.position.y + this.size / 3);
            // / line
            ctx.moveTo(this.position.x + this.size / 3, this.position.y - this.size / 3);
            ctx.lineTo(this.position.x - this.size / 3, this.position.y + this.size / 3);
            ctx.stroke();
        }
        
        // Add outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size / 2, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Draw bleeding out meter if not dead
        if (!this.isDead) {
            this.renderBleedOutMeter(ctx, healthPercentage);
        }
        
        ctx.restore();
    }

    private renderBleedOutMeter(ctx: CanvasRenderingContext2D, healthPercentage: number): void {
        const meterWidth = 60;
        const meterHeight = 8;
        const meterX = this.position.x - meterWidth / 2;
        const meterY = this.position.y - this.size / 2 - 20;
        
        // Background bar
        ctx.fillStyle = '#333333';
        ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
        
        // Health bar
        let healthColor = '#00ff00'; // Green
        if (healthPercentage < 0.6) healthColor = '#ffff00'; // Yellow
        if (healthPercentage < 0.3) healthColor = '#ff0000'; // Red
        
        ctx.fillStyle = healthColor;
        ctx.fillRect(meterX, meterY, meterWidth * healthPercentage, meterHeight);
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);
        
        // Time remaining text
        const timeLeft = Math.ceil(this.bleedOutTime / 1000);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${timeLeft}s`, this.position.x, meterY - 5);
        
        // Critical warning
        if (healthPercentage < 0.3) {
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 10px Arial';
            ctx.fillText('CRITICAL!', this.position.x, meterY + meterHeight + 15);
        }
    }

    checkCollision(other: { position: Vector2D; size: number }): boolean {
        const dx = this.position.x - other.position.x;
        const dy = this.position.y - other.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.size + other.size) / 2;
    }

    rescue(): void {
        this.isRescued = true;
    }
}
