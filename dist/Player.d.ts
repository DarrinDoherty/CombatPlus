import { Vector2D } from './types.js';
export declare class Player {
    position: Vector2D;
    size: number;
    speed: number;
    color: string;
    isCarryingSoldier: boolean;
    grenadeCount: number;
    grenadeCooldown: number;
    lastGrenadeTime: number;
    constructor(position: Vector2D, size: number, speed: number);
    update(pressedKeys: Set<string>, canvasHeight: number, channelLeft: number, channelRight: number): void;
    render(ctx: CanvasRenderingContext2D): void;
    checkCollision(bullet: {
        position: Vector2D;
        size: number;
    }): boolean;
    pickupSoldier(): void;
    dropOffSoldier(): void;
    canThrowGrenade(): boolean;
    throwGrenade(targetDirection: Vector2D): {
        position: Vector2D;
        velocity: Vector2D;
    } | null;
    private normalizeVector;
    refillGrenades(): void;
}
