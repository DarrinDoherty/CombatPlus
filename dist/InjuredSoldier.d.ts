import { Vector2D } from './types.js';
export declare class InjuredSoldier {
    position: Vector2D;
    size: number;
    isRescued: boolean;
    color: string;
    spawnTime: number;
    bleedOutTime: number;
    maxBleedOutTime: number;
    isDead: boolean;
    pulseTimer: number;
    constructor(position: Vector2D, size: number);
    update(): void;
    getBleedOutPercentage(): number;
    render(ctx: CanvasRenderingContext2D): void;
    private renderBleedOutMeter;
    checkCollision(other: {
        position: Vector2D;
        size: number;
    }): boolean;
    rescue(): void;
}
