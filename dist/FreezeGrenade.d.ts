import { Vector2D } from './types.js';
export declare class FreezeGrenade {
    position: Vector2D;
    velocity: Vector2D;
    size: number;
    active: boolean;
    explosionRadius: number;
    timeToExplode: number;
    createdAt: number;
    constructor(position: Vector2D, velocity: Vector2D, size?: number);
    update(): void;
    explode(): void;
    render(ctx: CanvasRenderingContext2D): void;
    isInBounds(width: number, height: number): boolean;
    isInRange(target: {
        position: Vector2D;
    }): boolean;
}
