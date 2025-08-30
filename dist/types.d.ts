export interface Vector2D {
    x: number;
    y: number;
}
export interface GameConfig {
    canvasWidth: number;
    canvasHeight: number;
    tankSpeed: number;
    bulletSpeed: number;
    tankSize: number;
    bulletSize: number;
}
export interface Controls {
    up: string;
    down: string;
    left: string;
    right: string;
    shoot: string;
}
