import { Vector2D } from './types.js';
export declare class FreezeGrenade {
    position: Vector2D;
    velocity: Vector2D;
    size: number;
    active: boolean;
    explosionRadius: number;
    timeToExplode: number;
    createdAt: number;
    manualDetonation: boolean;
    readyToDetonate: boolean;
    constructor(position: Vector2D, velocity: Vector2D, size?: number, manualDetonation?: boolean);
    update(): void;
    explode(): void;
    manualExplode(): void;
    render(ctx: CanvasRenderingContext2D): void;
    isInBounds(width: number, height: number): boolean;
    isInRange(target: {
        position: Vector2D;
    }): boolean;
}
