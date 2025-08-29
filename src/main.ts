import { Game } from './Game.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }

    try {
        const game = new Game(canvas);
        game.start();
        console.log('Combat Plus game started!');
    } catch (error) {
        console.error('Failed to start game:', error);
    }
});
