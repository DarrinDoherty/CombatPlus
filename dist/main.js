import { Game } from './Game.js';
// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('gameCanvas');
    const startBtn = document.getElementById('startBtn');
    const loadingStatus = document.getElementById('loadingStatus');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    if (!startBtn) {
        console.error('Start button not found!');
        return;
    }
    let game = null;
    // Show loading state immediately
    startBtn.disabled = true;
    startBtn.textContent = 'LOADING...';
    loadingStatus.style.display = 'block';
    try {
        // Create the game instance (this loads audio in background)
        console.log('Creating game instance and loading audio...');
        game = new Game(canvas);
        // Wait 5 seconds for everything to load
        console.log('Waiting 5 seconds for all systems to load...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        // Enable the start button once everything is loaded
        loadingStatus.style.display = 'none';
        startBtn.textContent = 'START MISSION';
        startBtn.disabled = false;
        console.log('Game ready! Click START MISSION to begin.');
    }
    catch (error) {
        console.error('Failed to initialize game:', error);
        startBtn.disabled = false;
        startBtn.textContent = 'ERROR - RETRY';
        loadingStatus.style.display = 'none';
    }
    // Set up the start button click handler
    startBtn.addEventListener('click', () => {
        if (game && startBtn.textContent === 'START MISSION') {
            game.start();
            startBtn.textContent = 'RESTART MISSION';
            console.log('Combat Plus game started!');
        }
        else if (game && startBtn.textContent === 'RESTART MISSION') {
            game.restart();
            console.log('Game restarted!');
        }
    });
});
//# sourceMappingURL=main.js.map