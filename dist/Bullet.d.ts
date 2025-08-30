import { Vector2D } from './types.js';
export declare class Bullet {
    position: Vector2D;
    velocity: Vector2D;
    size: number;
    active: boolean;
    playerId: number;
    explosionRadius: number;
    startPosition: Vector2D;
    targetDistance: number;
    traveledDistance: number;
    whistleSound: {
        stop: () => void;
    } | null;
    constructor(position: Vector2D, velocity: Vector2D, size: number, playerId: number, explosionRadius?: number, targetDistance?: number);
    update(): void;
    render(ctx: CanvasRenderingContext2D): void;
    isOutOfBounds(width: number, height: number): boolean;
    checkCollision(other: {
        position: Vector2D;
        size: number;
    }): boolean;
    hasReachedTarget(): boolean;
    stopWhistle(): void;
    startWhistle(soundEngine: any): void;
}
