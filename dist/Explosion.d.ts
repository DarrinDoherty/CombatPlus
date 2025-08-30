import { Vector2D } from './types.js';
export declare class Explosion {
    position: Vector2D;
    particles: Particle[];
    duration: number;
    startTime: number;
    active: boolean;
    flashDuration: number;
    constructor(position: Vector2D, particleCount?: number);
    private getRandomVelocity;
    private getRandomColor;
    update(): void;
    render(ctx: CanvasRenderingContext2D): void;
}
declare class Particle {
    position: Vector2D;
    velocity: Vector2D;
    color: string;
    lifetime: number;
    startTime: number;
    active: boolean;
    size: number;
    constructor(position: Vector2D, velocity: Vector2D, color: string, lifetime: number);
    update(): void;
    render(ctx: CanvasRenderingContext2D): void;
}
export {};
