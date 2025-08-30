import { Tank } from './Tank.js';
import { Player } from './Player.js';
import { Explosion } from './Explosion.js';
import { InjuredSoldier } from './InjuredSoldier.js';
import { FreezeGrenade } from './FreezeGrenade.js';
import { PickupGrenade } from './PickupGrenade.js';
import { SoundEngine } from './SoundEngine.js';
import { getRandomSoldierProfile } from './SoldierProfiles.js';
export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get 2D context from canvas');
        }
        this.ctx = ctx;
        // Initialize sound engine
        this.soundEngine = new SoundEngine();
        // Resume audio context on first user interaction (required by browsers)
        const resumeAudio = () => {
            this.soundEngine.resumeAudioContext();
        };
        document.addEventListener('click', resumeAudio, { once: true });
        document.addEventListener('keydown', resumeAudio, { once: true });
        this.config = {
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            tankSpeed: 1.5, // Much slower movement - was 3
            bulletSpeed: 8, // Keep bullets fast for danger
            tankSize: 30,
            bulletSize: 6
        };
        this.bullets = [];
        this.explosions = [];
        this.freezeGrenades = [];
        this.pickupGrenades = [];
        this.tanks = [];
        this.player = null;
        this.injuredSoldier = null;
        this.carriedSoldier = null;
        this.missionComplete = false;
        this.rescuesCompleted = 0;
        this.baseFreezeTime = 5000; // Start with 5 seconds freeze time
        this.pressedKeys = new Set();
        this.pendingManualGrenades = new Map();
        this.gameRunning = false; // Start in not-running mode
        this.player1Score = 0;
        this.player2Score = 0;
        this.playerLives = 3;
        this.gameOver = false;
        this.screenShake = 0;
        this.screenShakeDecay = 0.9;
        // Setup no man's land channel
        this.channelWidth = 60; // Wide enough for a character to run through
        this.channelLeft = (this.config.canvasWidth / 2) - (this.channelWidth / 2);
        this.channelRight = (this.config.canvasWidth / 2) + (this.channelWidth / 2);
        // Tank spawning system
        this.lastSpawnTime = Date.now();
        this.spawnInterval = 15000; // Start with 15 seconds between spawns
        this.lastLeftSpawnTime = Date.now();
        this.lastRightSpawnTime = Date.now();
        this.celebrationStartTime = null;
        this.celebrationDuration = 2000; // 2 seconds celebration
        this.mourningStartTime = null;
        this.mourningDuration = 3000; // 3 seconds mourning
        this.currentSoldierProfile = null;
        this.lastSoldierProfile = null;
        this.animationFrameId = null;
        // Pickup grenade spawning system
        this.lastPickupGrenadeSpawnTime = Date.now();
        this.minPickupGrenadeInterval = 8000; // Minimum 8 seconds between spawns
        this.maxPickupGrenadeInterval = 20000; // Maximum 20 seconds between spawns
        this.pickupGrenadeSpawnInterval = this.getRandomSpawnInterval();
        // Initialize freeze zone effects
        this.freezeZoneEffects = [];
        this.initializeTanks();
        this.initializePlayer();
        this.initializeInjuredSoldier();
        this.setupEventListeners();
        this.updateScore();
    }
    initializeTanks() {
        // Clear existing tanks
        this.tanks = [];
        // Generate random starting positions within each army's territory
        const leftArmyBounds = {
            minX: 50,
            maxX: this.channelLeft - 50,
            minY: 50,
            maxY: this.config.canvasHeight - 50
        };
        const rightArmyBounds = {
            minX: this.channelRight + 50,
            maxX: this.config.canvasWidth - 50,
            minY: 50,
            maxY: this.config.canvasHeight - 50
        };
        // Personality types to cycle through
        const personalities = ['aggressive', 'sniper', 'defensive', 'flanker', 'aggressive'];
        // Create 5 tanks for left army (player 1)
        for (let i = 0; i < 5; i++) {
            let leftStartX, leftStartY;
            let attempts = 0;
            // Try to find a position that doesn't overlap with existing tanks
            do {
                leftStartX = leftArmyBounds.minX + Math.random() * (leftArmyBounds.maxX - leftArmyBounds.minX);
                leftStartY = leftArmyBounds.minY + Math.random() * (leftArmyBounds.maxY - leftArmyBounds.minY);
                attempts++;
            } while (attempts < 50 && this.isPositionOccupied(leftStartX, leftStartY, this.tanks, this.config.tankSize * 1.5));
            const tank = new Tank({ x: leftStartX, y: leftStartY }, this.config.tankSize, this.config.tankSpeed, '#00ff00', 1, {
                up: 'w',
                down: 's',
                left: 'a',
                right: 'd',
                shoot: ' ' // spacebar
            }, true, // AI enabled
            personalities[i], // Different personality for each tank
            'left');
            this.tanks.push(tank);
            console.log(`Created left tank ${i + 1} at (${leftStartX.toFixed(1)}, ${leftStartY.toFixed(1)}) after ${attempts} attempts`);
        }
        // Create 5 tanks for right army (player 2)
        for (let i = 0; i < 5; i++) {
            let rightStartX, rightStartY;
            let attempts = 0;
            // Try to find a position that doesn't overlap with existing tanks
            do {
                rightStartX = rightArmyBounds.minX + Math.random() * (rightArmyBounds.maxX - rightArmyBounds.minX);
                rightStartY = rightArmyBounds.minY + Math.random() * (rightArmyBounds.maxY - rightArmyBounds.minY);
                attempts++;
            } while (attempts < 50 && this.isPositionOccupied(rightStartX, rightStartY, this.tanks, this.config.tankSize * 1.5));
            const tank = new Tank({ x: rightStartX, y: rightStartY }, this.config.tankSize, this.config.tankSpeed, '#ff0000', 2, {
                up: 'ArrowUp',
                down: 'ArrowDown',
                left: 'ArrowLeft',
                right: 'ArrowRight',
                shoot: 'Enter'
            }, true, // AI enabled
            personalities[i], // Different personality for each tank
            'right');
            this.tanks.push(tank);
            console.log(`Created right tank ${i + 1} at (${rightStartX.toFixed(1)}, ${rightStartY.toFixed(1)}) after ${attempts} attempts`);
        }
        const leftCount = this.tanks.filter(t => t.team === 'left').length;
        const rightCount = this.tanks.filter(t => t.team === 'right').length;
        console.log(`Total tanks created: ${leftCount} left, ${rightCount} right`);
    }
    spawnNewTank() {
        const currentTime = Date.now();
        // Check and spawn for left side
        this.checkAndSpawnForSide('left', currentTime);
        // Check and spawn for right side
        this.checkAndSpawnForSide('right', currentTime);
    }
    checkAndSpawnForSide(team, currentTime) {
        const lastSpawnTime = team === 'left' ? this.lastLeftSpawnTime : this.lastRightSpawnTime;
        const teamTanks = this.getTanksByTeam(team);
        const activeTanks = teamTanks.filter(tank => tank.health > 0);
        // Calculate spawn interval based on tank count (fewer tanks = faster spawn)
        const baseInterval = 15000; // 15 seconds base
        const minInterval = 2000; // 2 seconds minimum
        const maxInterval = 20000; // 20 seconds maximum
        // Inverse relationship: 0 tanks = 2s, 1 tank = 6s, 2 tanks = 10s, 3+ tanks = 15s+
        let spawnInterval;
        if (activeTanks.length === 0) {
            spawnInterval = minInterval; // Emergency spawn - no tanks left!
        }
        else if (activeTanks.length === 1) {
            spawnInterval = 6000; // Fast spawn with only 1 tank
        }
        else if (activeTanks.length === 2) {
            spawnInterval = 10000; // Medium spawn with 2 tanks
        }
        else {
            spawnInterval = Math.min(maxInterval, baseInterval + (activeTanks.length - 3) * 3000);
        }
        // Additional speed boost based on rescue progress
        spawnInterval = Math.max(minInterval, spawnInterval - (this.rescuesCompleted * 1000));
        // Check if timer has expired - when it does, spawn exactly ONE tank
        if (currentTime - lastSpawnTime >= spawnInterval) {
            // Spawn exactly one tank for this side
            const spawnSuccess = this.spawnTankOnSide(team);
            if (spawnSuccess) {
                // Update the spawn time only if spawn was successful
                if (team === 'left') {
                    this.lastLeftSpawnTime = currentTime;
                }
                else {
                    this.lastRightSpawnTime = currentTime;
                }
                console.log(`Timer expired: Spawned 1 ${team} tank (${activeTanks.length} -> ${activeTanks.length + 1} tanks, next in ${spawnInterval / 1000}s)`);
            }
            else {
                // If spawn failed, retry in 1 second
                if (team === 'left') {
                    this.lastLeftSpawnTime = currentTime - spawnInterval + 1000;
                }
                else {
                    this.lastRightSpawnTime = currentTime - spawnInterval + 1000;
                }
                console.log(`Spawn failed for ${team} side, retrying in 1s`);
            }
        }
    }
    spawnTankOnSide(team) {
        // Define spawn areas on the outer edges - FULL HEIGHT except hospital safety zone
        const hospitalSafetyZone = 50; // Top 50px is hospital safety zone
        const spawnBounds = team === 'left' ? {
            minX: 10,
            maxX: 80,
            minY: hospitalSafetyZone, // Start below hospital zone
            maxY: this.config.canvasHeight
        } : {
            minX: this.config.canvasWidth - 80,
            maxX: this.config.canvasWidth - 10,
            minY: hospitalSafetyZone, // Start below hospital zone
            maxY: this.config.canvasHeight
        };
        // Find spawn position
        let spawnX, spawnY;
        let attempts = 0;
        do {
            spawnX = spawnBounds.minX + Math.random() * (spawnBounds.maxX - spawnBounds.minX);
            spawnY = spawnBounds.minY + Math.random() * (spawnBounds.maxY - spawnBounds.minY);
            attempts++;
        } while (attempts < 20 && this.isPositionOccupied(spawnX, spawnY, this.tanks, this.config.tankSize * 2));
        if (attempts >= 20) {
            console.log(`Could not find spawn position for new ${team} tank`);
            return false; // Spawn failed
        }
        // Random personality
        const personalities = ['aggressive', 'sniper', 'defensive', 'flanker'];
        const personality = personalities[Math.floor(Math.random() * personalities.length)];
        const tank = new Tank({ x: spawnX, y: spawnY }, this.config.tankSize, this.config.tankSpeed, team === 'left' ? '#00ff00' : '#ff0000', team === 'left' ? 1 : 2, team === 'left' ? {
            up: 'w',
            down: 's',
            left: 'a',
            right: 'd',
            shoot: ' '
        } : {
            up: 'ArrowUp',
            down: 'ArrowDown',
            left: 'ArrowLeft',
            right: 'ArrowRight',
            shoot: 'Enter'
        }, true, personality, team);
        this.tanks.push(tank);
        return true; // Spawn successful
    }
    getSpawnTimeForSide(team, currentTime) {
        const lastSpawnTime = team === 'left' ? this.lastLeftSpawnTime : this.lastRightSpawnTime;
        const teamTanks = this.getTanksByTeam(team);
        const activeTanks = teamTanks.filter(tank => tank.health > 0);
        // Calculate spawn interval (same logic as checkAndSpawnForSide)
        const baseInterval = 15000;
        const minInterval = 2000;
        const maxInterval = 20000;
        let spawnInterval;
        if (activeTanks.length === 0) {
            spawnInterval = minInterval;
        }
        else if (activeTanks.length === 1) {
            spawnInterval = 6000;
        }
        else if (activeTanks.length === 2) {
            spawnInterval = 10000;
        }
        else {
            spawnInterval = Math.min(maxInterval, baseInterval + (activeTanks.length - 3) * 3000);
        }
        spawnInterval = Math.max(minInterval, spawnInterval - (this.rescuesCompleted * 1000));
        return Math.max(0, Math.ceil((spawnInterval - (currentTime - lastSpawnTime)) / 1000));
    }
    wrapText(text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = this.ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            }
            else {
                currentLine = testLine;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }
        return lines;
    }
    getRandomSpawnInterval() {
        return this.minPickupGrenadeInterval +
            Math.random() * (this.maxPickupGrenadeInterval - this.minPickupGrenadeInterval);
    }
    getTanksByTeam(team) {
        return this.tanks.filter(tank => tank.team === team);
    }
    getEnemyTanks(tank) {
        return this.tanks.filter(t => t.team !== tank.team);
    }
    isPositionOccupied(x, y, tanks, minDistance) {
        for (const tank of tanks) {
            const dx = x - tank.position.x;
            const dy = y - tank.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < minDistance) {
                return true;
            }
        }
        return false;
    }
    initializePlayer() {
        // Start player at the top of the channel
        const startX = this.config.canvasWidth / 2;
        const startY = 30;
        this.player = new Player({ x: startX, y: startY }, 20, // Player size
        3 // Player speed (faster than tanks)
        );
    }
    initializeInjuredSoldier() {
        // Place injured soldier at the bottom of the channel
        const soldierX = this.config.canvasWidth / 2;
        const soldierY = this.config.canvasHeight - 50;
        this.injuredSoldier = new InjuredSoldier({ x: soldierX, y: soldierY }, 15);
        // Assign random soldier profile
        this.currentSoldierProfile = getRandomSoldierProfile();
        console.log(`New soldier needs rescue: ${this.currentSoldierProfile.rank} ${this.currentSoldierProfile.name} from ${this.currentSoldierProfile.hometown}`);
    }
    start() {
        if (!this.gameRunning && this.animationFrameId === null) {
            this.gameRunning = true;
            this.gameLoop();
        }
    }
    pause() {
        this.gameRunning = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    restart() {
        // Stop any existing game loop first
        this.gameRunning = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        // Reset all game state
        this.gameOver = false;
        this.missionComplete = false;
        this.rescuesCompleted = 0;
        this.playerLives = 3;
        this.bullets = [];
        this.explosions = [];
        this.freezeGrenades = [];
        this.pickupGrenades = [];
        this.screenShake = 0;
        this.lastSpawnTime = Date.now();
        this.spawnInterval = 15000; // Reset spawn interval
        this.lastLeftSpawnTime = Date.now();
        this.lastRightSpawnTime = Date.now();
        this.lastPickupGrenadeSpawnTime = Date.now();
        this.pickupGrenadeSpawnInterval = this.getRandomSpawnInterval();
        this.celebrationStartTime = null;
        this.mourningStartTime = null;
        this.carriedSoldier = null;
        // Reinitialize everything
        this.initializeTanks();
        this.initializePlayer();
        this.initializeInjuredSoldier();
        // Reset player grenades
        if (this.player) {
            this.player.refillGrenades();
        }
        this.updateScore();
        // Start the game with proper loop management
        this.gameRunning = true;
        this.gameLoop();
    }
    updateAI() {
        if (!this.gameRunning)
            return;
        // Create empty key set for AI tanks (they shouldn't respond to user input)
        const emptyKeys = new Set();
        // Update each tank's AI with nearest enemy
        for (let i = 0; i < this.tanks.length; i++) {
            const tank = this.tanks[i];
            if (tank.isAI) {
                const enemies = this.getEnemyTanks(tank);
                let nearestEnemy;
                let minDistance = Infinity;
                for (const enemy of enemies) {
                    const dx = enemy.position.x - tank.position.x;
                    const dy = enemy.position.y - tank.position.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestEnemy = enemy;
                    }
                }
                const tankWasRepaired = tank.update(emptyKeys, this.config.canvasWidth, this.config.canvasHeight, this.channelLeft, this.channelRight, nearestEnemy);
                // Handle tank-to-tank collisions
                this.handleTankCollisions(tank, i);
                // Update tank warning state (auto-reset if conditions not met)
                tank.updateWarningState();
                // Play repair sound if tank was repaired
                if (tankWasRepaired) {
                    this.soundEngine.playTankRepair();
                }
                // Handle AI shooting - make sure tank aims at enemy before shooting
                if (nearestEnemy && tank.shouldAIShoot(nearestEnemy)) {
                    // Calculate angle to enemy for shooting
                    const dx = nearestEnemy.position.x - tank.position.x;
                    const dy = nearestEnemy.position.y - tank.position.y;
                    const angleToEnemy = Math.atan2(dy, dx);
                    // Only shoot if enemy is on the opposite side of no man's land
                    const isValidTarget = (tank.team === 'left' && nearestEnemy.position.x > this.channelRight) ||
                        (tank.team === 'right' && nearestEnemy.position.x < this.channelLeft);
                    if (isValidTarget) {
                        // Calculate angle to enemy for shooting
                        const originalAngle = tank.angle;
                        // For classic Atari Combat style - teams shoot in fixed directions
                        let shootingAngle;
                        if (tank.team === 'left') {
                            shootingAngle = 0; // Left team ALWAYS shoots RIGHT (0 radians)
                        }
                        else {
                            shootingAngle = Math.PI; // Right team ALWAYS shoots LEFT (π radians)
                        }
                        // Start warning if not already warning, or shoot if warning period is complete
                        if (!tank.isAboutToShoot) {
                            tank.startShootingWarning(shootingAngle);
                        }
                        else if (tank.canShoot()) {
                            // Calculate distance to target for artillery shell
                            const targetDistance = Math.sqrt(dx * dx + dy * dy);
                            // Temporarily aim at enemy for shooting
                            tank.angle = shootingAngle;
                            const bullet = tank.shoot(this.config.bulletSpeed, this.config.bulletSize, targetDistance);
                            if (bullet) {
                                this.bullets.push(bullet);
                                // Start whistle sound for the shell
                                bullet.startWhistle(this.soundEngine);
                                // Play tank shoot sound
                                this.soundEngine.playTankShoot();
                            }
                            // Restore movement angle
                            tank.angle = originalAngle;
                        }
                    }
                }
            }
        }
    }
    handleTankCollisions(tank, tankIndex) {
        const TANK_COLLISION_RADIUS = tank.size * 0.8; // Increased to 80% to prevent overlap
        const REPULSION_FORCE = 0.5; // Reduced force to prevent oscillation
        // Check collision with all other tanks
        for (let j = 0; j < this.tanks.length; j++) {
            if (j === tankIndex)
                continue; // Don't check collision with self
            const otherTank = this.tanks[j];
            const dx = tank.position.x - otherTank.position.x;
            const dy = tank.position.y - otherTank.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            // If tanks are too close, push them apart gently
            if (distance < TANK_COLLISION_RADIUS && distance > 0.1) {
                // Calculate gentle repulsion direction (normalized)
                const repulsionX = (dx / distance) * REPULSION_FORCE;
                const repulsionY = (dy / distance) * REPULSION_FORCE;
                // Move current tank away from other tank (only this tank to avoid double-movement)
                let newX = tank.position.x + repulsionX;
                let newY = tank.position.y + repulsionY;
                // Keep tank within canvas bounds
                newX = Math.max(tank.size / 2, Math.min(this.config.canvasWidth - tank.size / 2, newX));
                newY = Math.max(tank.size / 2, Math.min(this.config.canvasHeight - tank.size / 2, newY));
                // Apply the movement only if tank index is lower (prevents double-processing)
                if (tankIndex < j) {
                    tank.position.x = newX;
                    tank.position.y = newY;
                }
            }
        }
    }
    handleCollisions() {
        // Check bullet collisions and boundary hits
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            let shouldExplode = false;
            let explosionPosition = { ...bullet.position };
            // Check if bullet hits boundary
            if (bullet.position.x < 0 || bullet.position.x > this.config.canvasWidth ||
                bullet.position.y < 0 || bullet.position.y > this.config.canvasHeight) {
                shouldExplode = true;
            }
            // Check collision with tanks
            for (let j = this.tanks.length - 1; j >= 0; j--) {
                const tank = this.tanks[j];
                // Skip if bullet is from same team
                if (bullet.playerId === tank.playerId)
                    continue;
                const dx = bullet.position.x - tank.position.x;
                const dy = bullet.position.y - tank.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < tank.size / 2 + bullet.size / 2) {
                    // Direct hit!
                    explosionPosition = { x: tank.position.x, y: tank.position.y };
                    shouldExplode = true;
                    break;
                }
            }
            // Check collision with player (only if player is outside hospital safety zone)
            if (!shouldExplode && this.player) {
                const hospitalSafetyZone = 50; // Top 50px is hospital safety zone
                const playerInHospital = this.player.position.y < hospitalSafetyZone;
                if (!playerInHospital) {
                    const dx = bullet.position.x - this.player.position.x;
                    const dy = bullet.position.y - this.player.position.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < this.player.size / 2 + bullet.size / 2) {
                        // Direct hit on player!
                        explosionPosition = { x: this.player.position.x, y: this.player.position.y };
                        shouldExplode = true;
                    }
                }
            }
            // If bullet should explode, handle explosive damage
            if (shouldExplode) {
                // Stop whistle sound before explosion
                bullet.stopWhistle();
                this.handleExplosiveDamage(bullet, explosionPosition);
                this.bullets.splice(i, 1);
            }
        }
    }
    handleExplosiveDamage(bullet, explosionPos) {
        // Find the tank that fired this bullet to clear its active shell
        const firingTank = this.tanks.find(tank => tank.playerId === bullet.playerId);
        if (firingTank) {
            firingTank.clearActiveShell();
        }
        // Create explosion visual effect
        this.explosions.push(new Explosion(explosionPos, bullet.explosionRadius));
        this.soundEngine.playExplosion();
        this.screenShake = 8;
        // Damage all entities within explosion radius
        let damageDealt = false;
        // Check tank damage in explosion radius
        for (let j = this.tanks.length - 1; j >= 0; j--) {
            const tank = this.tanks[j];
            // Skip tanks from same team (friendly fire prevention)
            if (bullet.playerId === tank.playerId)
                continue;
            const dx = tank.position.x - explosionPos.x;
            const dy = tank.position.y - explosionPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= bullet.explosionRadius) {
                const result = tank.takeDamage();
                damageDealt = true;
                // Reset warning state when tank takes damage
                tank.resetShootingWarning();
                if (result === 'destroyed') {
                    console.log(`Tank destroyed by explosion! Removing from battlefield.`);
                    this.tanks.splice(j, 1);
                }
                else if (result === 'disabled') {
                    console.log(`Tank disabled by explosion! Cannot move or shoot.`);
                }
            }
        }
        // Check player damage in explosion radius (only if outside hospital)
        if (this.player) {
            const hospitalSafetyZone = 50;
            const playerInHospital = this.player.position.y < hospitalSafetyZone;
            if (!playerInHospital) {
                const dx = this.player.position.x - explosionPos.x;
                const dy = this.player.position.y - explosionPos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= bullet.explosionRadius) {
                    this.playerLives--;
                    this.soundEngine.playPlayerHit();
                    damageDealt = true;
                    if (this.playerLives <= 0) {
                        this.gameOver = true;
                        this.gameRunning = false;
                    }
                    else {
                        // Check if player was carrying a soldier when hit by explosion
                        if (this.player.isCarryingSoldier && this.currentSoldierProfile) {
                            // Store soldier profile for mourning display
                            this.lastSoldierProfile = this.currentSoldierProfile;
                            // Start mourning period - soldier lost
                            this.mourningStartTime = Date.now();
                            // Show soldier death message
                            console.log(`💀 SOLDIER LOST 💀`);
                            console.log(`${this.currentSoldierProfile.rank} ${this.currentSoldierProfile.name} was killed in action.`);
                            console.log(`From: ${this.currentSoldierProfile.hometown}`);
                            console.log(`He was: ${this.currentSoldierProfile.backstory}`);
                            console.log(`Survived by: ${this.currentSoldierProfile.family}`);
                            console.log(`They will be remembered...`);
                            // Play soldier death sound
                            this.soundEngine.playSoldierDeath();
                            // Clear current soldier data
                            this.injuredSoldier = null;
                            this.currentSoldierProfile = null;
                        }
                        // Reset player position if they have lives left
                        this.player.position = { x: this.config.canvasWidth / 2, y: 30 };
                        this.player.isCarryingSoldier = false; // Drop soldier if carrying
                    }
                }
            }
        }
    }
    gameLoop() {
        if (!this.gameRunning) {
            this.animationFrameId = null;
            return;
        }
        this.update();
        this.render();
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }
    update() {
        // Update player
        if (this.player) {
            this.player.update(this.pressedKeys, this.config.canvasHeight, this.channelLeft, this.channelRight);
        }
        // Update AI
        this.updateAI();
        // Spawn new tanks
        this.spawnNewTank();
        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update();
            // Check if artillery shell has reached its target distance
            if (bullet.hasReachedTarget()) {
                // Stop whistle sound before explosion
                bullet.stopWhistle();
                // Explode the shell at target location
                this.handleExplosiveDamage(bullet, bullet.position);
                this.bullets.splice(i, 1);
            }
            // Note: Other boundary collision is handled in handleCollisions() with explosions
        }
        // Update explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            explosion.update();
            if (!explosion.active) {
                this.explosions.splice(i, 1);
            }
        }
        // Update freeze grenades
        this.updateFreezeGrenades();
        // Update pickup grenades and spawn new ones
        this.updatePickupGrenades();
        this.spawnPickupGrenades();
        // Update injured soldier bleeding out
        if (this.injuredSoldier) {
            this.injuredSoldier.update();
            // Check if soldier has died from bleeding out
            if (this.injuredSoldier.isDead) {
                console.log('Soldier has bled out! Mission failed for this soldier.');
                // Play soldier death sound
                this.soundEngine.playSoldierDeath();
                // Start mourning period and show soldier profile
                this.mourningStartTime = Date.now();
                this.lastSoldierProfile = this.currentSoldierProfile;
                // Remove dead soldier and prepare for next mission
                this.injuredSoldier = null;
                this.currentSoldierProfile = null;
            }
        }
        // Check player-soldier collision
        if (this.player && this.injuredSoldier && !this.player.isCarryingSoldier) {
            const dx = this.player.position.x - this.injuredSoldier.position.x;
            const dy = this.player.position.y - this.injuredSoldier.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const collisionDistance = this.player.size / 2 + this.injuredSoldier.size / 2;
            if (distance < collisionDistance) {
                this.player.isCarryingSoldier = true;
                this.carriedSoldier = this.injuredSoldier; // Transfer to carried state
                this.injuredSoldier = null; // Remove from bottom position
                console.log('Soldier picked up! Get them to the hospital quickly - they\'re still bleeding!');
                // Play soldier pickup sound
                this.soundEngine.playSoldierPickup();
            }
        }
        // Update carried soldier (continues bleeding out)
        if (this.carriedSoldier) {
            this.carriedSoldier.update();
            // Check if carried soldier dies while being carried
            if (this.carriedSoldier.isDead) {
                console.log('Soldier died while being carried! Mission failed.');
                // Play soldier death sound
                this.soundEngine.playSoldierDeath();
                // Start mourning period
                this.mourningStartTime = Date.now();
                this.lastSoldierProfile = this.currentSoldierProfile;
                // Drop the dead soldier and reset
                this.carriedSoldier = null;
                this.player.isCarryingSoldier = false;
                this.currentSoldierProfile = null;
                return; // Exit early to prevent checking safety
            }
        }
        // Check if player reached safety with soldier
        if (this.player && this.player.isCarryingSoldier && this.carriedSoldier && this.player.position.y < 50) {
            this.rescuesCompleted++;
            this.player.isCarryingSoldier = false;
            // Store soldier profile for celebration display
            this.lastSoldierProfile = this.currentSoldierProfile;
            // Successfully saved the soldier!
            this.carriedSoldier = null;
            // Start celebration - delay new soldier spawn
            this.celebrationStartTime = Date.now();
            // Update difficulty - tanks freeze for less time as more rescues are completed
            this.baseFreezeTime = Math.max(1000, 5000 - (this.rescuesCompleted * 800));
            this.updateScore();
            // Show rescue success message with soldier details
            if (this.currentSoldierProfile) {
                console.log(`🎉 SOLDIER RESCUED! 🎉`);
                console.log(`${this.currentSoldierProfile.rank} ${this.currentSoldierProfile.name} has been saved!`);
                console.log(`From: ${this.currentSoldierProfile.hometown}`);
                console.log(`Story: ${this.currentSoldierProfile.backstory}`);
                console.log(`Family: ${this.currentSoldierProfile.family}`);
                // Play mission success sound
                this.soundEngine.playMissionSuccess();
            }
        }
        // Check if celebration is over and spawn new soldier
        if (this.celebrationStartTime && !this.injuredSoldier) {
            if (Date.now() - this.celebrationStartTime >= this.celebrationDuration) {
                this.initializeInjuredSoldier();
                this.celebrationStartTime = null;
                console.log('New soldier needs rescue!');
            }
        }
        // Check if mourning period is over and spawn new soldier
        if (this.mourningStartTime && !this.injuredSoldier) {
            if (Date.now() - this.mourningStartTime >= this.mourningDuration) {
                this.initializeInjuredSoldier();
                this.mourningStartTime = null;
                console.log('Another soldier needs rescue...');
            }
        }
        // Handle collisions
        this.handleCollisions();
        // Update freeze zone effects
        this.updateFreezeZoneEffects();
        // Update screen shake
        if (this.screenShake > 0) {
            this.screenShake *= this.screenShakeDecay;
            if (this.screenShake < 0.1)
                this.screenShake = 0;
        }
    }
    updateFreezeGrenades() {
        for (let i = this.freezeGrenades.length - 1; i >= 0; i--) {
            const grenade = this.freezeGrenades[i];
            grenade.update();
            if (!grenade.active) {
                // Grenade has exploded, freeze all tanks in range
                this.freezeAllTanksInRange(grenade.position, grenade.explosionRadius);
                // Clean up from pending manual grenades map
                for (const [key, pendingGrenade] of this.pendingManualGrenades.entries()) {
                    if (pendingGrenade === grenade) {
                        this.pendingManualGrenades.delete(key);
                        break;
                    }
                }
                this.freezeGrenades.splice(i, 1);
                // Play freeze grenade explosion sound
                this.soundEngine.playFreezeGrenadeExplosion();
            }
        }
    }
    freezeAllTanksInRange(center, radius) {
        let tanksAffected = 0;
        for (const tank of this.tanks) {
            const dx = tank.position.x - center.x;
            const dy = tank.position.y - center.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= radius) {
                tank.freeze(this.baseFreezeTime);
                tanksAffected++;
            }
        }
        console.log(`Freeze grenade affected ${tanksAffected} tanks for ${this.baseFreezeTime / 1000}s`);
        // Create freeze explosion effect - bigger explosion with freeze particles
        this.explosions.push(new Explosion(center, 50)); // More particles for freeze effect
        this.screenShake = 3;
        // Add a temporary freeze zone visual effect
        this.addFreezeZoneEffect(center, radius);
    }
    addFreezeZoneEffect(center, radius) {
        // Create a temporary visual effect for the freeze zone
        const freezeEffect = {
            position: center,
            radius: radius,
            startTime: Date.now(),
            duration: 1000, // Show for 1 second
            active: true
        };
        // Store this effect for rendering
        if (!this.freezeZoneEffects) {
            this.freezeZoneEffects = [];
        }
        this.freezeZoneEffects.push(freezeEffect);
    }
    updateFreezeZoneEffects() {
        if (!this.freezeZoneEffects)
            return;
        const currentTime = Date.now();
        for (let i = this.freezeZoneEffects.length - 1; i >= 0; i--) {
            const effect = this.freezeZoneEffects[i];
            if (currentTime - effect.startTime > effect.duration) {
                this.freezeZoneEffects.splice(i, 1);
            }
        }
    }
    renderFreezeZoneEffects() {
        if (!this.freezeZoneEffects)
            return;
        const currentTime = Date.now();
        this.ctx.save();
        for (const effect of this.freezeZoneEffects) {
            if (effect.active) {
                const elapsed = currentTime - effect.startTime;
                const progress = elapsed / effect.duration;
                // Fade out over time
                const alpha = Math.max(0, 1 - progress);
                // Draw expanding blue circle
                this.ctx.globalAlpha = alpha * 0.3; // Semi-transparent
                this.ctx.strokeStyle = '#00ccff';
                this.ctx.lineWidth = 4;
                this.ctx.beginPath();
                this.ctx.arc(effect.position.x, effect.position.y, effect.radius, 0, 2 * Math.PI);
                this.ctx.stroke();
                // Inner fill
                this.ctx.globalAlpha = alpha * 0.1;
                this.ctx.fillStyle = '#00ccff';
                this.ctx.beginPath();
                this.ctx.arc(effect.position.x, effect.position.y, effect.radius, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        }
        this.ctx.restore();
    }
    renderCarriedSoldierHealthMeter() {
        if (!this.carriedSoldier || !this.player)
            return;
        const healthPercentage = this.carriedSoldier.getBleedOutPercentage();
        const meterWidth = 80;
        const meterHeight = 12;
        const meterX = this.player.position.x - meterWidth / 2;
        const meterY = this.player.position.y - this.player.size / 2 - 40;
        // Background bar
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
        // Health bar
        let healthColor = '#00ff00'; // Green
        if (healthPercentage < 0.6)
            healthColor = '#ffff00'; // Yellow
        if (healthPercentage < 0.3)
            healthColor = '#ff0000'; // Red
        this.ctx.fillStyle = healthColor;
        this.ctx.fillRect(meterX, meterY, meterWidth * healthPercentage, meterHeight);
        // Border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);
        // Time remaining text
        const timeLeft = Math.ceil(this.carriedSoldier.bleedOutTime / 1000);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`SOLDIER: ${timeLeft}s`, this.player.position.x, meterY - 8);
        // Critical warning
        if (healthPercentage < 0.3) {
            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText('CRITICAL!', this.player.position.x, meterY + meterHeight + 20);
        }
    }
    throwFreezeGrenade(direction) {
        if (this.player && this.player.canThrowGrenade()) {
            let throwDirection;
            let velocity;
            if (direction) {
                // Use specified direction for WASD directional throwing
                throwDirection = direction;
                const speed = 4;
                velocity = { x: direction.x * speed, y: direction.y * speed };
            }
            else {
                // Default behavior - direction depends on whether player is carrying soldier
                if (this.player.isCarryingSoldier) {
                    // Carrying soldier - throw grenades toward top of screen
                    throwDirection = { x: 0, y: -1 };
                    velocity = { x: 0, y: -4 }; // Move up at 4 pixels per frame
                }
                else {
                    // Not carrying soldier - throw grenades toward bottom of screen
                    throwDirection = { x: 0, y: 1 };
                    velocity = { x: 0, y: 4 }; // Move down at 4 pixels per frame
                }
            }
            const grenadeData = this.player.throwGrenade(throwDirection);
            if (grenadeData) {
                const grenade = new FreezeGrenade(grenadeData.position, velocity);
                this.freezeGrenades.push(grenade);
                if (direction) {
                    const directionName = this.getDirectionName(direction);
                    console.log(`Freeze grenade thrown ${directionName}! ${this.player.grenadeCount} grenades remaining.`);
                }
                else {
                    console.log(`Freeze grenade thrown ${this.player.isCarryingSoldier ? 'upward' : 'downward'}! ${this.player.grenadeCount} grenades remaining.`);
                }
            }
        }
    }
    handleGrenadeKey(key, direction) {
        // Check if there's already a pending manual grenade for this key
        const existingGrenade = this.pendingManualGrenades.get(key);
        if (existingGrenade && existingGrenade.readyToDetonate) {
            // Second click - detonate the grenade
            existingGrenade.manualExplode();
            this.pendingManualGrenades.delete(key);
            this.soundEngine.playFreezeGrenadeExplosion();
            console.log(`Manual grenade detonated with ${key.toUpperCase()} key!`);
        }
        else if (!existingGrenade && this.player && this.player.canThrowGrenade()) {
            // First click - throw a manual grenade
            const throwDirection = direction;
            const speed = 4;
            const velocity = { x: direction.x * speed, y: direction.y * speed };
            const grenadeData = this.player.throwGrenade(throwDirection);
            if (grenadeData) {
                const grenade = new FreezeGrenade(grenadeData.position, velocity, 8, true); // Manual detonation = true
                this.freezeGrenades.push(grenade);
                this.pendingManualGrenades.set(key, grenade);
                this.soundEngine.playGrenadeThrow();
                const directionName = this.getDirectionName(direction);
                console.log(`Manual grenade thrown ${directionName}! Press ${key.toUpperCase()} again to detonate. ${this.player.grenadeCount} grenades remaining.`);
            }
        }
    }
    getDirectionName(direction) {
        if (direction.x > 0)
            return 'right';
        if (direction.x < 0)
            return 'left';
        if (direction.y > 0)
            return 'down';
        if (direction.y < 0)
            return 'up';
        return 'center';
    }
    updatePickupGrenades() {
        for (let i = this.pickupGrenades.length - 1; i >= 0; i--) {
            const grenade = this.pickupGrenades[i];
            grenade.update();
            // Remove expired grenades
            if (grenade.isExpired()) {
                this.pickupGrenades.splice(i, 1);
                // Create small explosion when grenade explodes from not being picked up
                this.explosions.push(new Explosion(grenade.position, 15));
                continue;
            }
            // Check if player can pick up the grenade
            if (this.player && grenade.canBePickedUp() &&
                grenade.isInPickupRange(this.player.position, this.player.size)) {
                // Player picks up the grenade
                this.player.grenadeCount += 1;
                this.pickupGrenades.splice(i, 1);
                console.log(`Medic picked up freeze grenade! ${this.player.grenadeCount} grenades available.`);
                // Small visual effect for pickup and play pickup sound
                this.explosions.push(new Explosion(grenade.position, 5));
                this.soundEngine.playGrenadePickup();
            }
        }
    }
    spawnPickupGrenades() {
        const currentTime = Date.now();
        // Check if it's time to spawn a new pickup grenade
        if (currentTime - this.lastPickupGrenadeSpawnTime >= this.pickupGrenadeSpawnInterval) {
            // Only spawn if there aren't too many pickup grenades already
            if (this.pickupGrenades.length < 3) {
                // Spawn grenade randomly along the medic's channel
                const grenadeX = this.channelLeft + (this.channelWidth / 2); // Center of channel
                const grenadeY = 80 + Math.random() * (this.config.canvasHeight - 160); // Avoid top hospital zone and bottom
                const newGrenade = new PickupGrenade({ x: grenadeX, y: grenadeY });
                this.pickupGrenades.push(newGrenade);
                console.log(`Pickup grenade spawned at (${grenadeX}, ${grenadeY})`);
            }
            // Set next spawn time
            this.lastPickupGrenadeSpawnTime = currentTime;
            this.pickupGrenadeSpawnInterval = this.getRandomSpawnInterval();
        }
    }
    render() {
        // Apply screen shake
        this.ctx.save();
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake;
            const shakeY = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(shakeX, shakeY);
        }
        // Clear canvas
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);
        // Draw no man's land channel
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(this.channelLeft, 0, this.channelWidth, this.config.canvasHeight);
        // Draw channel borders
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.channelLeft, 0);
        this.ctx.lineTo(this.channelLeft, this.config.canvasHeight);
        this.ctx.moveTo(this.channelRight, 0);
        this.ctx.lineTo(this.channelRight, this.config.canvasHeight);
        this.ctx.stroke();
        // Draw hospital safety ribbon at top of channel
        const hospitalSafetyZone = 50;
        this.ctx.fillStyle = '#ff0000'; // Red safety ribbon
        this.ctx.fillRect(this.channelLeft, 0, this.channelWidth, hospitalSafetyZone);
        // Add white cross pattern on safety ribbon
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        // Horizontal line across ribbon
        this.ctx.moveTo(this.channelLeft + 20, hospitalSafetyZone / 2);
        this.ctx.lineTo(this.channelRight - 20, hospitalSafetyZone / 2);
        // Vertical crosses every 60px
        for (let x = this.channelLeft + 40; x < this.channelRight; x += 60) {
            this.ctx.moveTo(x, hospitalSafetyZone / 2 - 15);
            this.ctx.lineTo(x, hospitalSafetyZone / 2 + 15);
        }
        this.ctx.stroke();
        // Add "HOSPITAL SAFE ZONE" text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('HOSPITAL SAFE ZONE', this.config.canvasWidth / 2, hospitalSafetyZone / 2 + 4);
        this.ctx.textAlign = 'left'; // Reset text alignment
        // Render tanks
        for (const tank of this.tanks) {
            tank.render(this.ctx);
        }
        // Render bullets
        for (const bullet of this.bullets) {
            bullet.render(this.ctx);
        }
        // Render explosions
        for (const explosion of this.explosions) {
            explosion.render(this.ctx);
        }
        // Render freeze grenades
        for (const grenade of this.freezeGrenades) {
            grenade.render(this.ctx);
        }
        // Render pickup grenades
        for (const grenade of this.pickupGrenades) {
            grenade.render(this.ctx);
        }
        // Render freeze zone effects
        this.renderFreezeZoneEffects();
        // Render player
        if (this.player) {
            this.player.render(this.ctx);
            // Render carried soldier health meter
            if (this.carriedSoldier && this.player.isCarryingSoldier) {
                this.renderCarriedSoldierHealthMeter();
            }
            // Show safety indicator when medic is in hospital zone
            const hospitalSafetyZone = 50;
            if (this.player.position.y < hospitalSafetyZone) {
                this.ctx.fillStyle = '#00ff00';
                this.ctx.font = 'bold 14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('SAFE', this.player.position.x, this.player.position.y - 25);
                // Add protective shield visual effect
                this.ctx.strokeStyle = '#00ff00';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.arc(this.player.position.x, this.player.position.y, this.player.size / 2 + 8, 0, 2 * Math.PI);
                this.ctx.stroke();
                this.ctx.setLineDash([]); // Reset line dash
                this.ctx.textAlign = 'left'; // Reset text alignment
            }
        }
        // Render injured soldier (only if soldier exists)
        if (this.injuredSoldier) {
            this.injuredSoldier.render(this.ctx);
        }
        // Draw UI text
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        const tankCount = this.tanks.length;
        const leftTanks = this.getTanksByTeam('left').filter(tank => tank.health > 0).length;
        const rightTanks = this.getTanksByTeam('right').filter(tank => tank.health > 0).length;
        // Calculate next spawn times for each side
        const currentTime = Date.now();
        const leftSpawnIn = this.getSpawnTimeForSide('left', currentTime);
        const rightSpawnIn = this.getSpawnTimeForSide('right', currentTime);
        this.ctx.fillText(`Tanks: ${leftTanks} vs ${rightTanks} (Total: ${tankCount})`, 10, 25);
        this.ctx.fillText(`Next spawn: L${leftSpawnIn}s | R${rightSpawnIn}s`, 10, 45);
        // Show celebration text when soldier is rescued
        if (this.celebrationStartTime && this.lastSoldierProfile) {
            const timeLeft = Math.max(0, this.celebrationDuration - (currentTime - this.celebrationStartTime));
            // Semi-transparent background (more transparent)
            this.ctx.fillStyle = 'rgba(0, 100, 0, 0.4)';
            this.ctx.fillRect(100, 150, this.config.canvasWidth - 200, 300);
            // Border
            this.ctx.strokeStyle = '#00ff00';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(100, 150, this.config.canvasWidth - 200, 300);
            // Title
            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = 'bold 28px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🎉 SOLDIER RESCUED! 🎉', this.config.canvasWidth / 2, 190);
            // Soldier details
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.fillText(`${this.lastSoldierProfile.rank} ${this.lastSoldierProfile.name}`, this.config.canvasWidth / 2, 220);
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Age ${this.lastSoldierProfile.age} from ${this.lastSoldierProfile.hometown}`, this.config.canvasWidth / 2, 245);
            // Backstory (wrapped text)
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = '#cccccc';
            const backstoryLines = this.wrapText(this.lastSoldierProfile.backstory, this.config.canvasWidth - 220);
            let yPos = 270;
            for (const line of backstoryLines) {
                this.ctx.fillText(line, this.config.canvasWidth / 2, yPos);
                yPos += 18;
            }
            // Family
            this.ctx.fillStyle = '#ffff88';
            this.ctx.font = '14px Arial';
            this.ctx.fillText(`Family: ${this.lastSoldierProfile.family}`, this.config.canvasWidth / 2, yPos + 15);
            // Countdown
            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillText(`Next soldier in: ${Math.ceil(timeLeft / 1000)}s`, this.config.canvasWidth / 2, yPos + 40);
            this.ctx.textAlign = 'left'; // Reset alignment
            this.ctx.fillStyle = '#fff'; // Reset color
        }
        // Show mourning text when soldier is lost
        if (this.mourningStartTime && this.lastSoldierProfile) {
            const timeLeft = Math.max(0, this.mourningDuration - (currentTime - this.mourningStartTime));
            // Semi-transparent dark background (more transparent)
            this.ctx.fillStyle = 'rgba(50, 0, 0, 0.4)';
            this.ctx.fillRect(100, 150, this.config.canvasWidth - 200, 300);
            // Border
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(100, 150, this.config.canvasWidth - 200, 300);
            // Title
            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = 'bold 28px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('💀 SOLDIER LOST 💀', this.config.canvasWidth / 2, 190);
            // Soldier details
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.fillText(`${this.lastSoldierProfile.rank} ${this.lastSoldierProfile.name}`, this.config.canvasWidth / 2, 220);
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Age ${this.lastSoldierProfile.age} from ${this.lastSoldierProfile.hometown}`, this.config.canvasWidth / 2, 245);
            this.ctx.fillText('Killed in Action', this.config.canvasWidth / 2, 265);
            // Backstory (wrapped text)
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = '#cccccc';
            const backstoryLines = this.wrapText(this.lastSoldierProfile.backstory, this.config.canvasWidth - 220);
            let yPos = 290;
            for (const line of backstoryLines) {
                this.ctx.fillText(line, this.config.canvasWidth / 2, yPos);
                yPos += 18;
            }
            // Family
            this.ctx.fillStyle = '#ffaa88';
            this.ctx.font = '14px Arial';
            this.ctx.fillText(`Survived by: ${this.lastSoldierProfile.family}`, this.config.canvasWidth / 2, yPos + 10);
            // Memorial message
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'italic 14px Arial';
            this.ctx.fillText('They will be remembered...', this.config.canvasWidth / 2, yPos + 30);
            // Countdown
            this.ctx.fillStyle = '#ffff00';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillText(`Next soldier in: ${Math.ceil(timeLeft / 1000)}s`, this.config.canvasWidth / 2, yPos + 55);
            this.ctx.textAlign = 'left'; // Reset alignment
            this.ctx.fillStyle = '#fff'; // Reset color
        }
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; // More transparent game over overlay
            this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);
            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('MISSION FAILED', this.config.canvasWidth / 2, this.config.canvasHeight / 2);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Soldiers Rescued: ${this.rescuesCompleted}`, this.config.canvasWidth / 2, this.config.canvasHeight / 2 + 50);
            this.ctx.fillText('Click RESTART to try again', this.config.canvasWidth / 2, this.config.canvasHeight / 2 + 80);
        }
        this.ctx.restore();
    }
    updateScore() {
        const player1ScoreElement = document.getElementById('player1Score');
        const player2ScoreElement = document.getElementById('player2Score');
        if (player1ScoreElement) {
            player1ScoreElement.textContent = `Lives: ${this.playerLives} | Rescues: ${this.rescuesCompleted}`;
        }
        if (player2ScoreElement) {
            if (this.gameOver) {
                player2ScoreElement.textContent = `MISSION FAILED | Freeze: ${(this.baseFreezeTime / 1000).toFixed(1)}s`;
            }
            else if (!this.gameRunning) {
                player2ScoreElement.textContent = `Press START to begin | Freeze: ${(this.baseFreezeTime / 1000).toFixed(1)}s`;
            }
            else {
                const tankCount = this.tanks.length;
                player2ScoreElement.textContent = `Tanks: ${tankCount} | Freeze: ${(this.baseFreezeTime / 1000).toFixed(1)}s`;
            }
        }
    }
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.pressedKeys.add(e.key);
            // Prevent default scrolling for arrow keys and spacebar
            if (['ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
                e.preventDefault();
            }
            // Handle directional grenade throwing with WASD
            if (this.gameRunning) {
                switch (e.key.toLowerCase()) {
                    case 'w':
                        e.preventDefault();
                        this.handleGrenadeKey('w', { x: 0, y: -1 }); // Up
                        break;
                    case 'a':
                        e.preventDefault();
                        this.handleGrenadeKey('a', { x: -1, y: 0 }); // Left
                        break;
                    case 's':
                        e.preventDefault();
                        this.handleGrenadeKey('s', { x: 0, y: 1 }); // Down
                        break;
                    case 'd':
                        e.preventDefault();
                        this.handleGrenadeKey('d', { x: 1, y: 0 }); // Right
                        break;
                    case ' ':
                        this.throwFreezeGrenade(); // Default spacebar behavior
                        this.soundEngine.playGrenadeThrow();
                        break;
                }
            }
        });
        window.addEventListener('keyup', (e) => {
            this.pressedKeys.delete(e.key);
        });
        // Restart button
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.restart();
            });
        }
    }
}
//# sourceMappingURL=Game.js.map