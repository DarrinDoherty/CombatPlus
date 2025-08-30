import { Bullet } from './Bullet.js';
// Warning System Configuration - Easy to modify
const WARNING_CONFIG = {
    TOTAL_WARNING_TIME: 500, // 0.5 second total warning time (faster combat)
    SLOW_FLASH_SPEED: 200, // Slow flash interval (ms) - start (higher = slower)
    FAST_FLASH_SPEED: 50, // Fast flash interval (ms) - end (lower = faster)
    ACCELERATION_CURVE: 2, // How quickly flashing accelerates (1=linear, 2=quadratic, 3=cubic)
};
export class Tank {
    constructor(position, size, speed, color, playerId, controls, isAI = true, personality, team = 'left') {
        this.position = { ...position };
        this.angle = 0;
        this.size = size;
        this.speed = speed;
        this.color = color;
        this.playerId = playerId;
        this.controls = controls;
        this.lastShotTime = 0;
        this.shootCooldown = isAI ? 1500 : 2000; // Faster - one shell every 1.5-2 seconds per tank
        this.hasActiveShell = false; // No active shell initially
        this.isAI = isAI;
        this.aiState = 'patrol';
        this.aiTarget = null;
        this.aiLastDirectionChange = 0;
        this.aiDirection = { x: 0, y: 1 }; // Start moving down
        // Set personality (default based on player ID if not specified)
        this.aiPersonality = personality || (playerId === 1 ? 'aggressive' : 'sniper');
        this.setPersonalityModifiers();
        // Initialize random decision making
        this.aiDecisionTimer = 0;
        this.aiCurrentDecision = 'assess';
        this.aiDecisionDuration = 1000 + Math.random() * 2000; // 1-3 seconds per decision
        this.aiRandomFactor = Math.random(); // Personal randomness factor 0-1
        // Initialize frozen state
        this.isFrozen = false;
        this.frozenUntil = 0;
        this.frozenDuration = 3000; // 3 seconds freeze duration
        // Initialize health system
        this.maxHealth = 2;
        this.health = this.maxHealth;
        this.isDisabled = false;
        this.disabledSince = 0;
        this.repairTime = 8000; // 8 seconds to repair from disabled state
        this.team = team;
        // Initialize shooting warning system
        this.isAboutToShoot = false;
        this.shootWarningStartTime = 0;
        this.shootWarningDuration = WARNING_CONFIG.TOTAL_WARNING_TIME;
        this.targetAngle = 0;
        // Initialize direction commitment system (prevent rapid direction changes)
        this.committedDirection = { x: 0, y: 1 }; // Start committed to moving down
        this.lastDirectionCommitTime = Date.now();
        this.directionCommitDuration = 2000; // Commit to a direction for 2 seconds
    }
    setPersonalityModifiers() {
        switch (this.aiPersonality) {
            case 'aggressive':
                this.aiPersonalityModifiers = {
                    shootingRange: 280, // Shorter range, gets up close
                    optimalDistance: 120, // Likes to fight close
                    movementSpeed: 0.8, // Slower movement - was 1.2
                    aimAccuracy: Math.PI / 10, // 18 degrees - less accurate but aggressive
                    aggressiveness: 0.8 // High aggression
                };
                this.shootCooldown = 1200; // Aggressive tanks shoot more frequently
                break;
            case 'sniper':
                this.aiPersonalityModifiers = {
                    shootingRange: 400, // Long range shooter
                    optimalDistance: 280, // Keeps distance
                    movementSpeed: 0.4, // Very slow, more deliberate - was 0.7
                    aimAccuracy: Math.PI / 20, // 9 degrees - very accurate
                    aggressiveness: 0.3 // Low aggression, waits for good shots
                };
                this.shootCooldown = 2200; // Snipers take more time to aim
                break;
            case 'defensive':
                this.aiPersonalityModifiers = {
                    shootingRange: 320, // Medium range
                    optimalDistance: 200, // Medium distance
                    movementSpeed: 0.5, // Cautious movement - was 0.8
                    aimAccuracy: Math.PI / 15, // 12 degrees - good accuracy
                    aggressiveness: 0.4 // Defensive, reactive
                };
                this.shootCooldown = 1800; // Defensive - moderate shooting rate
                break;
            case 'flanker':
                this.aiPersonalityModifiers = {
                    shootingRange: 350, // Good range
                    optimalDistance: 180, // Mobile fighter
                    movementSpeed: 0.6, // Slower but still mobile - was 1.0
                    aimAccuracy: Math.PI / 12, // 15 degrees - decent accuracy
                    aggressiveness: 0.6 // Moderate aggression
                };
                this.shootCooldown = 1400; // Flankers shoot fairly quickly
                break;
        }
    }
    update(pressedKeys, canvasWidth, canvasHeight, channelLeft, channelRight, enemyTank) {
        // Check if tank is frozen or disabled
        const currentTime = Date.now();
        if (this.isFrozen) {
            if (currentTime >= this.frozenUntil) {
                this.isFrozen = false;
                console.log(`Tank ${this.playerId} unfrozen!`);
            }
            else {
                // Tank is frozen, skip all movement and AI updates
                return false;
            }
        }
        // If tank is disabled (1 hit), check if it should be repaired
        if (this.isDisabled) {
            if (currentTime - this.disabledSince >= this.repairTime) {
                this.repair();
                console.log(`Tank ${this.playerId} (${this.team}) has been repaired and is back in action!`);
                return true; // Tank was repaired
            }
            else {
                // Tank is still disabled, skip all movement and AI updates
                return false;
            }
        }
        if (this.isAI && enemyTank) {
            this.updateAI(canvasWidth, canvasHeight, channelLeft, channelRight, enemyTank);
        }
        else {
            this.updateManual(pressedKeys, canvasWidth, canvasHeight, channelLeft, channelRight);
        }
        return false; // No repair happened
    }
    takeDamage() {
        this.health--;
        // Cancel shooting warning when hit - tank can move again
        this.resetShootingWarning();
        if (this.health <= 0) {
            return 'destroyed';
        }
        else if (this.health === 1) {
            this.isDisabled = true;
            this.disabledSince = Date.now(); // Track when tank became disabled
            return 'disabled';
        }
        return 'none';
    }
    repair() {
        this.health = this.maxHealth; // Fully repair the tank
        this.isDisabled = false;
        this.disabledSince = 0;
    }
    updateAI(canvasWidth, canvasHeight, channelLeft, channelRight, enemyTank) {
        if (!enemyTank)
            return;
        const currentTime = Date.now();
        // Random decision making system
        this.updateDecisionMaking(currentTime);
        // Check if we're in enemy's line of sight
        const inLineOfSight = this.isInLineOfSight(enemyTank, channelLeft, channelRight);
        // Calculate distance to enemy
        const dx = enemyTank.position.x - this.position.x;
        const dy = enemyTank.position.y - this.position.y;
        const distanceToEnemy = Math.sqrt(dx * dx + dy * dy);
        // AI Decision Making - use personality-based ranges but influenced by random decisions and line of sight
        const combatRange = this.aiPersonalityModifiers.shootingRange * 0.8;
        // If we're in line of sight and not in combat, prioritize getting to cover
        // BUT if we're close enough to fight, engage in combat instead of just hiding
        if (inLineOfSight && distanceToEnemy > combatRange * 1.2 && this.aiCurrentDecision !== 'overconfident') {
            this.aiState = 'seeking_cover';
        }
        else if (distanceToEnemy < combatRange) {
            this.aiState = 'combat';
        }
        else {
            this.aiState = 'patrol';
        }
        if (this.aiState === 'seeking_cover') {
            // Prioritize breaking line of sight
            this.seekCoverBehavior(enemyTank, canvasWidth, canvasHeight, channelLeft, channelRight);
        }
        else if (this.aiState === 'combat') {
            // Combat behavior: influenced by current decision
            this.combatBehavior(enemyTank, canvasWidth, canvasHeight);
        }
        else {
            // Patrol behavior: move to get line of sight
            this.patrolBehavior(currentTime, canvasWidth, canvasHeight, enemyTank);
        }
        // Execute movement
        this.executeAIMovement(canvasWidth, canvasHeight, channelLeft, channelRight);
    }
    seekCoverBehavior(enemyTank, canvasWidth, canvasHeight, channelLeft, channelRight) {
        const coverPosition = this.findCoverPosition(enemyTank, canvasWidth, canvasHeight, channelLeft, channelRight);
        // Move toward cover position
        const dx = coverPosition.x - this.position.x;
        const dy = coverPosition.y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 10) {
            // Move toward cover
            const speedMod = this.aiPersonalityModifiers.movementSpeed * 1.2; // Move faster when seeking cover
            this.aiDirection.x = (dx / distance) * speedMod;
            this.aiDirection.y = (dy / distance) * speedMod;
        }
        else {
            // At cover position, move slowly to avoid detection
            this.aiDirection.x *= 0.2;
            this.aiDirection.y *= 0.2;
        }
    }
    updateDecisionMaking(currentTime) {
        // Check if it's time for a new decision
        if (currentTime - this.aiDecisionTimer > this.aiDecisionDuration) {
            this.makeRandomDecision();
            this.aiDecisionTimer = currentTime;
            this.aiDecisionDuration = 1500 + Math.random() * 3000; // 1.5-4.5 seconds
        }
    }
    makeRandomDecision() {
        const randomRoll = Math.random();
        const personalityBias = this.aiPersonalityModifiers.aggressiveness;
        // Random decisions that affect behavior - more aggressive, less retreating
        if (randomRoll < 0.08) { // Reduced hesitation
            this.aiCurrentDecision = 'hesitate'; // Stop and think
        }
        else if (randomRoll < 0.15) { // Reduced panic
            this.aiCurrentDecision = 'panic'; // Move erratically
        }
        else if (randomRoll < 0.30) { // Increased overconfidence
            this.aiCurrentDecision = 'overconfident'; // Ignore distance rules
        }
        else if (randomRoll < 0.35) { // Greatly reduced cautious behavior
            this.aiCurrentDecision = 'cautious'; // Move away from enemy
        }
        else if (randomRoll < 0.38) { // Greatly reduced cover seeking
            this.aiCurrentDecision = 'seek_cover'; // Actively avoid line of sight
        }
        else if (randomRoll < 0.70 + personalityBias * 0.3) { // Much more aggressive
            this.aiCurrentDecision = 'aggressive'; // Move toward enemy
        }
        else if (randomRoll < 0.85) { // More repositioning
            this.aiCurrentDecision = 'reposition'; // Try to get better angle
        }
        else {
            this.aiCurrentDecision = 'normal'; // Follow normal behavior
        }
        // Update random factor for this decision period
        this.aiRandomFactor = Math.random();
    }
    isInLineOfSight(enemyTank, channelLeft, channelRight) {
        // Simple line of sight check - are we roughly aligned horizontally with enemy?
        const dx = Math.abs(enemyTank.position.x - this.position.x);
        const dy = Math.abs(enemyTank.position.y - this.position.y);
        // If we're roughly on the same horizontal level (within 80 pixels - reduced from 100)
        // and there's clear line across the channel, we're exposed
        if (dy < 80) {
            // Check if we can see across the channel
            if (channelLeft !== undefined && channelRight !== undefined) {
                // Left team can see right team if right team is visible
                if (this.team === 'left' && enemyTank.position.x > channelRight) {
                    return true;
                }
                // Right team can see left team if left team is visible
                if (this.team === 'right' && enemyTank.position.x < channelLeft) {
                    return true;
                }
            }
        }
        return false;
    }
    findCoverPosition(enemyTank, canvasWidth, canvasHeight, channelLeft, channelRight) {
        // Try to find a position that breaks line of sight
        const currentY = this.position.y;
        const enemyY = enemyTank.position.y;
        // Move away from enemy's Y position to break horizontal line of sight
        let targetY = currentY;
        if (Math.abs(currentY - enemyY) < 120) {
            // Too close to enemy's Y level, move up or down
            if (currentY < canvasHeight / 2) {
                targetY = Math.max(60, currentY - 100); // Move up
            }
            else {
                targetY = Math.min(canvasHeight - 60, currentY + 100); // Move down
            }
        }
        // Stay within our territory boundaries
        let targetX = this.position.x;
        if (this.playerId === 1 && channelLeft) {
            // Left army - can move within left territory
            targetX = Math.max(60, Math.min(channelLeft - 60, this.position.x));
        }
        else if (this.playerId === 2 && channelRight) {
            // Right army - can move within right territory
            targetX = Math.max(channelRight + 60, Math.min(canvasWidth - 60, this.position.x));
        }
        return { x: targetX, y: targetY };
    }
    combatBehavior(enemyTank, canvasWidth, canvasHeight) {
        const dx = enemyTank.position.x - this.position.x;
        const dy = enemyTank.position.y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        // Calculate the angle to the enemy
        const angleToEnemy = Math.atan2(dy, dx);
        // Use personality-based optimal distance
        let optimalDist = this.aiPersonalityModifiers.optimalDistance;
        let speedMod = this.aiPersonalityModifiers.movementSpeed;
        // Apply random decision modifications
        switch (this.aiCurrentDecision) {
            case 'hesitate':
                speedMod *= 0.2; // Move very slowly
                break;
            case 'panic':
                speedMod *= 1.5; // Move faster but randomly
                optimalDist *= 0.7; // Want to get away
                break;
            case 'overconfident':
                optimalDist *= 0.5; // Get much closer than normal
                speedMod *= 1.2;
                break;
            case 'cautious':
                optimalDist *= 1.5; // Stay further away
                speedMod *= 0.6;
                break;
            case 'seek_cover':
                // Try to break line of sight even during combat
                const coverPos = this.findCoverPosition(enemyTank, canvasWidth, canvasHeight);
                const coverDx = coverPos.x - this.position.x;
                const coverDy = coverPos.y - this.position.y;
                this.aiDirection.x = coverDx * 0.5;
                this.aiDirection.y = coverDy * 0.5;
                return; // Skip normal combat behavior
            case 'aggressive':
                optimalDist *= 0.8; // Get closer
                speedMod *= 1.1;
                break;
        }
        // Personality-specific combat behavior with random modifications
        switch (this.aiPersonality) {
            case 'aggressive':
                if (this.aiCurrentDecision === 'panic') {
                    // Panic - move randomly
                    this.aiDirection.x = (Math.random() - 0.5) * speedMod * 2;
                    this.aiDirection.y = (Math.random() - 0.5) * speedMod * 2;
                }
                else if (distance > optimalDist) {
                    this.aiDirection.x = Math.cos(angleToEnemy) * speedMod;
                    this.aiDirection.y = Math.sin(angleToEnemy) * speedMod;
                }
                else {
                    // Circle strafe when close
                    const perpAngle = angleToEnemy + Math.PI / 2;
                    this.aiDirection.x = Math.cos(perpAngle) * speedMod * 0.8;
                    this.aiDirection.y = Math.sin(perpAngle) * speedMod * 0.8;
                }
                break;
            case 'sniper':
                if (this.aiCurrentDecision === 'hesitate') {
                    // Stop and aim carefully
                    this.aiDirection.x = 0;
                    this.aiDirection.y = 0;
                }
                else if (distance < optimalDist || this.aiCurrentDecision === 'cautious') {
                    this.aiDirection.x = -Math.cos(angleToEnemy) * speedMod;
                    this.aiDirection.y = -Math.sin(angleToEnemy) * speedMod;
                }
                else {
                    // Small adjustments for better angle
                    const perpAngle = angleToEnemy + (this.aiRandomFactor > 0.5 ? Math.PI / 4 : -Math.PI / 4);
                    this.aiDirection.x = Math.cos(perpAngle) * speedMod * 0.3;
                    this.aiDirection.y = Math.sin(perpAngle) * speedMod * 0.3;
                }
                break;
            case 'defensive':
                // Make defensive tanks less cowardly - they should still fight
                if (this.aiCurrentDecision === 'panic' && distance < optimalDist * 0.8) {
                    // Only retreat when really close and panicking
                    this.aiDirection.x = -Math.cos(angleToEnemy) * speedMod * 0.5;
                    this.aiDirection.y = -Math.sin(angleToEnemy) * speedMod * 0.5;
                }
                else {
                    // Mostly stay and fight with small repositioning
                    const perpAngle = angleToEnemy + (this.aiRandomFactor > 0.5 ? Math.PI / 4 : -Math.PI / 4);
                    this.aiDirection.x = Math.cos(perpAngle) * speedMod * 0.6;
                    this.aiDirection.y = Math.sin(perpAngle) * speedMod * 0.6;
                }
                break;
            case 'flanker':
                const flankAngle = angleToEnemy + (this.team === 'left' ? Math.PI / 2 : -Math.PI / 2);
                if (this.aiCurrentDecision === 'reposition') {
                    // Deliberate flanking movement
                    this.aiDirection.x = Math.cos(flankAngle) * speedMod * 1.2;
                    this.aiDirection.y = Math.sin(flankAngle) * speedMod * 1.2;
                }
                else if (distance > optimalDist * 1.3) {
                    this.aiDirection.x = (Math.cos(angleToEnemy) + Math.cos(flankAngle)) * speedMod * 0.7;
                    this.aiDirection.y = (Math.sin(angleToEnemy) + Math.sin(flankAngle)) * speedMod * 0.7;
                }
                else if (distance < optimalDist * 0.8) {
                    this.aiDirection.x = -Math.cos(angleToEnemy) * speedMod * 0.6;
                    this.aiDirection.y = -Math.sin(angleToEnemy) * speedMod * 0.6;
                }
                else {
                    this.aiDirection.x = Math.cos(flankAngle) * speedMod;
                    this.aiDirection.y = Math.sin(flankAngle) * speedMod;
                }
                break;
        }
    }
    patrolBehavior(currentTime, canvasWidth, canvasHeight, enemyTank) {
        // If we have an enemy tank, try to move to get line of sight
        if (enemyTank) {
            const dx = enemyTank.position.x - this.position.x;
            const dy = enemyTank.position.y - this.position.y;
            // Move towards a position where we can see the enemy
            this.aiDirection.x = Math.sign(dx) * 0.4;
            this.aiDirection.y = Math.sign(dy) * 0.4;
        }
        else {
            // Change direction every 2-3 seconds when no enemy visible
            if (currentTime - this.aiLastDirectionChange > (2000 + Math.random() * 1000)) {
                this.aiDirection.x = (Math.random() - 0.5) * 1.5;
                this.aiDirection.y = (Math.random() - 0.5) * 1.5;
                this.aiLastDirectionChange = currentTime;
            }
        }
        // Prefer moving towards the center channel for better line of sight
        const channelCenter = canvasWidth / 2;
        if (Math.random() < 0.2) { // 20% chance to move towards channel
            if (this.playerId === 1 && this.position.x < channelCenter - 120) {
                this.aiDirection.x = Math.abs(this.aiDirection.x); // Move right
            }
            else if (this.playerId === 2 && this.position.x > channelCenter + 120) {
                this.aiDirection.x = -Math.abs(this.aiDirection.x); // Move left
            }
        }
        // Avoid walls by changing direction AND bias towards center
        const margin = 60;
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        if (this.position.x < margin) {
            this.aiDirection.x = Math.abs(this.aiDirection.x); // Force moving right (away from left wall)
        }
        else if (this.position.x > canvasWidth - margin) {
            this.aiDirection.x = -Math.abs(this.aiDirection.x); // Force moving left (away from right wall)
        }
        if (this.position.y < margin) {
            this.aiDirection.y = Math.abs(this.aiDirection.y); // Force moving down (away from top wall)
        }
        else if (this.position.y > canvasHeight - margin) {
            this.aiDirection.y = -Math.abs(this.aiDirection.y); // Force moving up (away from bottom wall)
        }
        // Additional bias towards battlefield center to prevent edge-hugging
        if (Math.random() < 0.3) { // 30% chance to move towards center
            if (this.position.x < centerX - 100) {
                this.aiDirection.x += 0.5; // Bias towards center
            }
            else if (this.position.x > centerX + 100) {
                this.aiDirection.x -= 0.5; // Bias towards center
            }
            if (this.position.y < centerY - 100) {
                this.aiDirection.y += 0.3; // Gentle bias towards vertical center
            }
            else if (this.position.y > centerY + 100) {
                this.aiDirection.y -= 0.3; // Gentle bias towards vertical center
            }
        }
    }
    normalizeToGridMovement() {
        const currentTime = Date.now();
        const timeSinceCommit = currentTime - this.lastDirectionCommitTime;
        // Check if we can change direction (commitment period expired)
        const canChangeDirection = timeSinceCommit > this.directionCommitDuration;
        // Convert any diagonal movement to pure horizontal or vertical (Atari Combat style)
        const absX = Math.abs(this.aiDirection.x);
        const absY = Math.abs(this.aiDirection.y);
        // If we're still in commitment period, stick to committed direction
        if (!canChangeDirection) {
            this.aiDirection.x = this.committedDirection.x;
            this.aiDirection.y = this.committedDirection.y;
            return;
        }
        // Time to potentially change direction
        let newDirection;
        if (absX > absY) {
            // Favor horizontal movement
            newDirection = {
                x: this.aiDirection.x > 0 ? 1 : -1,
                y: 0
            };
        }
        else if (absY > absX) {
            // Favor vertical movement
            newDirection = {
                x: 0,
                y: this.aiDirection.y > 0 ? 1 : -1
            };
        }
        else if (absX > 0) {
            // Equal movement - randomly choose horizontal or vertical
            if (Math.random() > 0.5) {
                newDirection = {
                    x: this.aiDirection.x > 0 ? 1 : -1,
                    y: 0
                };
            }
            else {
                newDirection = {
                    x: 0,
                    y: this.aiDirection.y > 0 ? 1 : -1
                };
            }
        }
        else {
            // No movement - keep current committed direction
            newDirection = this.committedDirection;
        }
        // Check if direction actually changed
        const directionChanged = (newDirection.x !== this.committedDirection.x ||
            newDirection.y !== this.committedDirection.y);
        if (directionChanged) {
            // Commit to new direction
            this.committedDirection = newDirection;
            this.lastDirectionCommitTime = currentTime;
        }
        // Apply the committed direction (scaled by movement magnitude)
        const magnitude = Math.sqrt(absX * absX + absY * absY);
        this.aiDirection.x = this.committedDirection.x * magnitude;
        this.aiDirection.y = this.committedDirection.y * magnitude;
    }
    executeAIMovement(canvasWidth, canvasHeight, channelLeft, channelRight) {
        // Convert diagonal movement to horizontal/vertical only (Atari Combat style)
        this.normalizeToGridMovement();
        // FREEZE MOVEMENT when about to shoot (flashing warning phase)
        if (this.isAboutToShoot) {
            // Tank stops moving completely during warning phase - commits to the shot
            this.aiDirection.x = 0;
            this.aiDirection.y = 0;
            return; // Exit early, no movement updates
        }
        // Normalize AI direction
        const length = Math.sqrt(this.aiDirection.x * this.aiDirection.x + this.aiDirection.y * this.aiDirection.y);
        if (length > 0) {
            this.aiDirection.x = (this.aiDirection.x / length) * this.speed;
            this.aiDirection.y = (this.aiDirection.y / length) * this.speed;
        }
        // Update angle based on movement direction (tank turret follows movement)
        if (Math.abs(this.aiDirection.x) > 0.1 || Math.abs(this.aiDirection.y) > 0.1) {
            this.angle = Math.atan2(this.aiDirection.y, this.aiDirection.x);
        }
        // Update position with boundary checking
        let newX = this.position.x + this.aiDirection.x;
        let newY = this.position.y + this.aiDirection.y;
        // Standard boundary checking
        newX = Math.max(this.size / 2, Math.min(canvasWidth - this.size / 2, newX));
        newY = Math.max(this.size / 2, Math.min(canvasHeight - this.size / 2, newY));
        // Channel boundary checking
        if (channelLeft !== undefined && channelRight !== undefined) {
            if (this.playerId === 1 && newX + this.size / 2 > channelLeft) {
                newX = channelLeft - this.size / 2;
                this.aiDirection.x = 0; // Stop horizontal movement at boundary
            }
            if (this.playerId === 2 && newX - this.size / 2 < channelRight) {
                newX = channelRight + this.size / 2;
                this.aiDirection.x = 0; // Stop horizontal movement at boundary
            }
        }
        this.position.x = newX;
        this.position.y = newY;
    }
    updateManual(pressedKeys, canvasWidth, canvasHeight, channelLeft, channelRight) {
        // Movement
        let dx = 0;
        let dy = 0;
        if (pressedKeys.has(this.controls.up)) {
            dy -= this.speed;
        }
        if (pressedKeys.has(this.controls.down)) {
            dy += this.speed;
        }
        if (pressedKeys.has(this.controls.left)) {
            dx -= this.speed;
        }
        if (pressedKeys.has(this.controls.right)) {
            dx += this.speed;
        }
        // Update angle based on movement
        if (dx !== 0 || dy !== 0) {
            this.angle = Math.atan2(dy, dx);
        }
        // Update position with boundary checking
        let newX = this.position.x + dx;
        let newY = this.position.y + dy;
        // Standard boundary checking
        newX = Math.max(this.size / 2, Math.min(canvasWidth - this.size / 2, newX));
        newY = Math.max(this.size / 2, Math.min(canvasHeight - this.size / 2, newY));
        // Channel boundary checking (if channel exists)
        if (channelLeft !== undefined && channelRight !== undefined) {
            // Player 1 (left side) cannot cross into the channel
            if (this.playerId === 1 && newX + this.size / 2 > channelLeft) {
                newX = channelLeft - this.size / 2;
            }
            // Player 2 (right side) cannot cross into the channel
            if (this.playerId === 2 && newX - this.size / 2 < channelRight) {
                newX = channelRight + this.size / 2;
            }
        }
        this.position.x = newX;
        this.position.y = newY;
    }
    shouldAIShoot(enemyTank) {
        if (!this.isAI || !this.canStartWarning())
            return false;
        const dx = enemyTank.position.x - this.position.x;
        const dy = enemyTank.position.y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        // Team-based shooting direction: Left team shoots RIGHT, Right team shoots LEFT
        const canSeeEnemy = (this.team === 'left' && dx > 0) || // Left team can only see enemies to the RIGHT
            (this.team === 'right' && dx < 0); // Right team can only see enemies to the LEFT
        if (!canSeeEnemy) {
            return false; // Enemy is not in our firing direction
        }
        // Debug logging for shooting decisions
        if (Math.random() < 0.01) { // Only log occasionally to avoid spam
            console.log(`${this.team} tank considering shot: enemy at dx=${dx.toFixed(0)}, dy=${dy.toFixed(0)}, dist=${distance.toFixed(0)}`);
        }
        // For horizontal-only shooting, check if enemy is roughly on same horizontal level
        const verticalTolerance = 100; // Increased tolerance for easier shooting
        const isHorizontallyAligned = Math.abs(dy) <= verticalTolerance;
        // Must be horizontally aligned and within reasonable range
        if (!isHorizontallyAligned || distance < 50 || distance > 600) { // Increased max range
            return false;
        }
        // Very simple and aggressive shooting logic
        if (this.aiCurrentDecision === 'hesitate' && Math.random() < 0.02) { // Almost never hesitate
            return false;
        }
        // If tank can see enemy in range, it should fire!
        return true; // Fire whenever conditions are met (range, alignment, etc.)
    }
    canShoot() {
        // Tank can't shoot if frozen, disabled, or has active shell
        const currentTime = Date.now();
        // Basic conditions for shooting
        const basicConditionsMet = !this.isFrozen &&
            !this.isDisabled &&
            !this.hasActiveShell;
        if (!basicConditionsMet) {
            this.isAboutToShoot = false; // Cancel warning if conditions not met
            return false;
        }
        // Check if enough time has passed since last shot
        const cooldownComplete = (currentTime - this.lastShotTime) > this.shootCooldown;
        if (!cooldownComplete) {
            return false;
        }
        // If we're in warning phase, check if warning period is complete
        if (this.isAboutToShoot) {
            return (currentTime - this.shootWarningStartTime) >= this.shootWarningDuration;
        }
        return false; // Need to start warning first
    }
    startShootingWarning(targetAngle) {
        if (!this.isAboutToShoot && this.canStartWarning()) {
            this.isAboutToShoot = true;
            this.shootWarningStartTime = Date.now();
            if (targetAngle !== undefined) {
                this.targetAngle = targetAngle;
                // When starting to shoot, orient the tank to face across the gorge
                this.angle = targetAngle;
            }
        }
    }
    resetShootingWarning() {
        this.isAboutToShoot = false;
        this.shootWarningStartTime = 0;
    }
    updateWarningState() {
        // Auto-reset warning if conditions are no longer met or warning has expired
        if (this.isAboutToShoot) {
            const currentTime = Date.now();
            const warningExpired = (currentTime - this.shootWarningStartTime) > (this.shootWarningDuration + 500); // 500ms grace period
            if (!this.canStartWarning() || warningExpired) {
                this.resetShootingWarning();
            }
        }
    }
    canStartWarning() {
        const currentTime = Date.now();
        return !this.isFrozen &&
            !this.isDisabled &&
            !this.hasActiveShell &&
            (currentTime - this.lastShotTime) > this.shootCooldown;
    }
    shoot(bulletSpeed, bulletSize, targetDistance) {
        if (!this.canShoot()) {
            return null;
        }
        this.lastShotTime = Date.now();
        this.hasActiveShell = true; // Mark that this tank has a shell in flight
        // Use stored target angle if available (for warning shots)
        const shootingAngle = this.isAboutToShoot ? this.targetAngle : this.angle;
        this.isAboutToShoot = false; // Reset warning state after shooting
        const bulletVelocity = {
            x: Math.cos(shootingAngle) * bulletSpeed,
            y: Math.sin(shootingAngle) * bulletSpeed
        };
        return new Bullet({ ...this.position }, bulletVelocity, bulletSize, this.playerId, 80, // Larger explosion radius - affects more tanks
        targetDistance // Artillery target distance
        );
    }
    // Mark that this tank's shell has exploded/been destroyed
    clearActiveShell() {
        this.hasActiveShell = false;
    }
    render(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle);
        // Tank body - color based on health and status
        let bodyColor = this.color;
        if (this.isAboutToShoot) {
            // Calculate escalating flash speed from slow to fast over warning period
            const currentTime = Date.now();
            const timeIntoWarning = currentTime - this.shootWarningStartTime;
            const warningProgress = Math.min(timeIntoWarning / this.shootWarningDuration, 1);
            // Use exponential curve for dramatic acceleration
            const progressCurved = Math.pow(warningProgress, WARNING_CONFIG.ACCELERATION_CURVE);
            // Interpolate flash speed from slow to fast
            const currentFlashSpeed = WARNING_CONFIG.SLOW_FLASH_SPEED +
                (WARNING_CONFIG.FAST_FLASH_SPEED - WARNING_CONFIG.SLOW_FLASH_SPEED) * progressCurved;
            // Calculate flash state based on current speed
            const flashCycle = (currentTime % (currentFlashSpeed * 2)) < currentFlashSpeed;
            bodyColor = flashCycle ? '#ff0000' : '#ffffff'; // Red/white flash
        }
        else if (this.isFrozen) {
            bodyColor = '#4444ff'; // Blue when frozen
        }
        else if (this.isDisabled) {
            bodyColor = '#666666'; // Gray when disabled
        }
        else if (this.health === 1) {
            bodyColor = '#ffaa00'; // Orange when damaged
        }
        ctx.fillStyle = bodyColor;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        // Tank barrel
        let barrelColor = '#888';
        if (this.isFrozen) {
            barrelColor = '#6666ff'; // Lighter blue when frozen
        }
        else if (this.isDisabled) {
            barrelColor = '#444444'; // Dark gray when disabled
        }
        ctx.fillStyle = barrelColor;
        ctx.fillRect(0, -2, this.size / 2, 4);
        // Tank outline
        let outlineColor = '#fff';
        let lineWidth = 1;
        if (this.isFrozen) {
            outlineColor = '#aaaaff'; // Light blue outline when frozen
            lineWidth = 2;
        }
        else if (this.isDisabled) {
            outlineColor = '#999999'; // Gray outline when disabled
            lineWidth = 2;
        }
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = lineWidth;
        ctx.strokeRect(-this.size / 2, -this.size / 2, this.size, this.size);
        // Status indicators
        if (this.isFrozen) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('❄', 0, -this.size / 2 - 10);
        }
        else if (this.isDisabled) {
            // Show repair progress
            const currentTime = Date.now();
            const repairProgress = Math.min((currentTime - this.disabledSince) / this.repairTime, 1);
            // Draw repair progress bar
            const barWidth = this.size;
            const barHeight = 4;
            const barY = -this.size / 2 - 15;
            // Background bar
            ctx.fillStyle = '#444444';
            ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);
            // Progress bar
            ctx.fillStyle = repairProgress < 1 ? '#ffaa00' : '#00ff00';
            ctx.fillRect(-barWidth / 2, barY, barWidth * repairProgress, barHeight);
            // Repair icon
            ctx.fillStyle = '#ffaa00';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🔧', 0, -this.size / 2 - 20);
        }
        ctx.restore();
    }
    freeze(duration) {
        this.isFrozen = true;
        const freezeTime = duration || this.frozenDuration;
        this.frozenUntil = Date.now() + freezeTime;
        console.log(`Tank ${this.playerId} frozen for ${freezeTime / 1000} seconds!`);
    }
    checkCollision(other) {
        const dx = this.position.x - other.position.x;
        const dy = this.position.y - other.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.size;
    }
}
//# sourceMappingURL=Tank.js.map