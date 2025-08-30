import { Vector2D } from './types.js';
export declare class PickupGrenade {
    position: Vector2D;
    spawnTime: number;
    lifetime: number;
    flashTime: number;
    explodeTime: number;
    size: number;
    isFlashing: boolean;
    isExploded: boolean;
    flashToggle: boolean;
    lastFlashTime: number;
    constructor(position: Vector2D);
    update(): void;
    render(ctx: CanvasRenderingContext2D): void;
    isExpired(): boolean;
    canBePickedUp(): boolean;
    isInPickupRange(playerPosition: Vector2D, playerSize: number): boolean;
}
