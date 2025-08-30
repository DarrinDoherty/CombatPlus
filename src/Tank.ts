import { Vector2D, Controls } from './types.js';
import { Bullet } from './Bullet.js';

export class Tank {
    public position: Vector2D;
    public angle: number;
    public size: number;
    public speed: number;
    public color: string;
    public playerId: number;
    public controls: Controls;
    public lastShotTime: number;
    public shootCooldown: number;
    public isAI: boolean;
    public aiState: string;
    public aiTarget: Vector2D | null;
    public aiLastDirectionChange: number;
    public aiDirection: Vector2D;
    public aiPersonality: 'aggressive' | 'defensive' | 'sniper' | 'flanker';
    public aiPersonalityModifiers!: {
        shootingRange: number;
        optimalDistance: number;
        movementSpeed: number;
        aimAccuracy: number;
        aggressiveness: number;
    };
    public aiDecisionTimer: number;
    public aiCurrentDecision: string;
    public aiDecisionDuration: number;
    public aiRandomFactor: number;
    public isFrozen: boolean;
    public frozenUntil: number;
    public frozenDuration: number;

    constructor(
        position: Vector2D,
        size: number,
        speed: number,
        color: string,
        playerId: number,
        controls: Controls,
        isAI: boolean = true,
        personality?: 'aggressive' | 'defensive' | 'sniper' | 'flanker'
    ) {
        this.position = { ...position };
        this.angle = 0;
        this.size = size;
        this.speed = speed;
        this.color = color;
        this.playerId = playerId;
        this.controls = controls;
        this.lastShotTime = 0;
        this.shootCooldown = isAI ? 400 : 500; // AI shoots every 400ms (more controlled)
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
    }

    private setPersonalityModifiers(): void {
        switch (this.aiPersonality) {
            case 'aggressive':
                this.aiPersonalityModifiers = {
                    shootingRange: 280,     // Shorter range, gets up close
                    optimalDistance: 120,   // Likes to fight close
                    movementSpeed: 0.8,     // Slower movement - was 1.2
                    aimAccuracy: Math.PI / 10, // 18 degrees - less accurate but aggressive
                    aggressiveness: 0.8     // High aggression
                };
                this.shootCooldown = 500; // Slower shooting - was 300
                break;
                
            case 'sniper':
                this.aiPersonalityModifiers = {
                    shootingRange: 400,     // Long range shooter
                    optimalDistance: 280,   // Keeps distance
                    movementSpeed: 0.4,     // Very slow, more deliberate - was 0.7
                    aimAccuracy: Math.PI / 20, // 9 degrees - very accurate
                    aggressiveness: 0.3     // Low aggression, waits for good shots
                };
                this.shootCooldown = 800; // Much slower shooting - was 600
                break;
                
            case 'defensive':
                this.aiPersonalityModifiers = {
                    shootingRange: 320,     // Medium range
                    optimalDistance: 200,   // Medium distance
                    movementSpeed: 0.5,     // Cautious movement - was 0.8
                    aimAccuracy: Math.PI / 15, // 12 degrees - good accuracy
                    aggressiveness: 0.4     // Defensive, reactive
                };
                this.shootCooldown = 600; // Slower - was 500
                break;
                
            case 'flanker':
                this.aiPersonalityModifiers = {
                    shootingRange: 350,     // Good range
                    optimalDistance: 180,   // Mobile fighter
                    movementSpeed: 0.6,     // Slower but still mobile - was 1.0
                    aimAccuracy: Math.PI / 12, // 15 degrees - decent accuracy
                    aggressiveness: 0.6     // Moderate aggression
                };
                this.shootCooldown = 500; // Slower - was 400
                break;
        }
    }

    update(pressedKeys: Set<string>, canvasWidth: number, canvasHeight: number, channelLeft?: number, channelRight?: number, enemyTank?: Tank): void {
        // Check if tank is frozen
        const currentTime = Date.now();
        if (this.isFrozen) {
            if (currentTime >= this.frozenUntil) {
                this.isFrozen = false;
                console.log(`Tank ${this.playerId} unfrozen!`);
            } else {
                // Tank is frozen, skip all movement and AI updates
                return;
            }
        }
        
        if (this.isAI && enemyTank) {
            this.updateAI(canvasWidth, canvasHeight, channelLeft, channelRight, enemyTank);
        } else {
            this.updateManual(pressedKeys, canvasWidth, canvasHeight, channelLeft, channelRight);
        }
    }

    private updateAI(canvasWidth: number, canvasHeight: number, channelLeft?: number, channelRight?: number, enemyTank?: Tank): void {
        if (!enemyTank) return;

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
        } else if (distanceToEnemy < combatRange) {
            this.aiState = 'combat';
        } else {
            this.aiState = 'patrol';
        }

        if (this.aiState === 'seeking_cover') {
            // Prioritize breaking line of sight
            this.seekCoverBehavior(enemyTank, canvasWidth, canvasHeight, channelLeft, channelRight);
        } else if (this.aiState === 'combat') {
            // Combat behavior: influenced by current decision
            this.combatBehavior(enemyTank, canvasWidth, canvasHeight);
        } else {
            // Patrol behavior: move to get line of sight
            this.patrolBehavior(currentTime, canvasWidth, canvasHeight, enemyTank);
        }

        // Execute movement
        this.executeAIMovement(canvasWidth, canvasHeight, channelLeft, channelRight);
    }

    private seekCoverBehavior(enemyTank: Tank, canvasWidth: number, canvasHeight: number, channelLeft?: number, channelRight?: number): void {
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
        } else {
            // At cover position, move slowly to avoid detection
            this.aiDirection.x *= 0.2;
            this.aiDirection.y *= 0.2;
        }
    }

    private updateDecisionMaking(currentTime: number): void {
        // Check if it's time for a new decision
        if (currentTime - this.aiDecisionTimer > this.aiDecisionDuration) {
            this.makeRandomDecision();
            this.aiDecisionTimer = currentTime;
            this.aiDecisionDuration = 1500 + Math.random() * 3000; // 1.5-4.5 seconds
        }
    }

    private makeRandomDecision(): void {
        const randomRoll = Math.random();
        const personalityBias = this.aiPersonalityModifiers.aggressiveness;
        
        // Random decisions that affect behavior - adjusted for more combat
        if (randomRoll < 0.10) { // Reduced from 0.12
            this.aiCurrentDecision = 'hesitate'; // Stop and think
        } else if (randomRoll < 0.18) { // Reduced from 0.20
            this.aiCurrentDecision = 'panic'; // Move erratically
        } else if (randomRoll < 0.28) {
            this.aiCurrentDecision = 'overconfident'; // Ignore distance rules
        } else if (randomRoll < 0.36) { // Reduced from 0.38
            this.aiCurrentDecision = 'cautious'; // Move away from enemy
        } else if (randomRoll < 0.40) { // Reduced from 0.46 - much less cover seeking
            this.aiCurrentDecision = 'seek_cover'; // Actively avoid line of sight
        } else if (randomRoll < 0.60 + personalityBias * 0.3) { // Increased from 0.54 and 0.2
            this.aiCurrentDecision = 'aggressive'; // Move toward enemy
        } else if (randomRoll < 0.75) { // Increased from 0.68
            this.aiCurrentDecision = 'reposition'; // Try to get better angle
        } else {
            this.aiCurrentDecision = 'normal'; // Follow normal behavior
        }
        
        // Update random factor for this decision period
        this.aiRandomFactor = Math.random();
    }

    private isInLineOfSight(enemyTank: Tank, channelLeft?: number, channelRight?: number): boolean {
        // Simple line of sight check - are we roughly aligned horizontally with enemy?
        const dx = Math.abs(enemyTank.position.x - this.position.x);
        const dy = Math.abs(enemyTank.position.y - this.position.y);
        
        // If we're roughly on the same horizontal level (within 80 pixels - reduced from 100)
        // and there's clear line across the channel, we're exposed
        if (dy < 80) {
            // Check if we can see across the channel
            if (channelLeft !== undefined && channelRight !== undefined) {
                // Left tank can see right tank if right tank is visible
                if (this.playerId === 1 && enemyTank.position.x > channelRight) {
                    return true;
                }
                // Right tank can see left tank if left tank is visible
                if (this.playerId === 2 && enemyTank.position.x < channelLeft) {
                    return true;
                }
            }
        }
        
        return false;
    }

    private findCoverPosition(enemyTank: Tank, canvasWidth: number, canvasHeight: number, channelLeft?: number, channelRight?: number): Vector2D {
        // Try to find a position that breaks line of sight
        const currentY = this.position.y;
        const enemyY = enemyTank.position.y;
        
        // Move away from enemy's Y position to break horizontal line of sight
        let targetY = currentY;
        if (Math.abs(currentY - enemyY) < 120) {
            // Too close to enemy's Y level, move up or down
            if (currentY < canvasHeight / 2) {
                targetY = Math.max(60, currentY - 100); // Move up
            } else {
                targetY = Math.min(canvasHeight - 60, currentY + 100); // Move down
            }
        }
        
        // Stay within our territory boundaries
        let targetX = this.position.x;
        if (this.playerId === 1 && channelLeft) {
            // Left army - can move within left territory
            targetX = Math.max(60, Math.min(channelLeft - 60, this.position.x));
        } else if (this.playerId === 2 && channelRight) {
            // Right army - can move within right territory
            targetX = Math.max(channelRight + 60, Math.min(canvasWidth - 60, this.position.x));
        }
        
        return { x: targetX, y: targetY };
    }

    private combatBehavior(enemyTank: Tank, canvasWidth: number, canvasHeight: number): void {
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
                } else if (distance > optimalDist) {
                    this.aiDirection.x = Math.cos(angleToEnemy) * speedMod;
                    this.aiDirection.y = Math.sin(angleToEnemy) * speedMod;
                } else {
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
                } else if (distance < optimalDist || this.aiCurrentDecision === 'cautious') {
                    this.aiDirection.x = -Math.cos(angleToEnemy) * speedMod;
                    this.aiDirection.y = -Math.sin(angleToEnemy) * speedMod;
                } else {
                    // Small adjustments for better angle
                    const perpAngle = angleToEnemy + (this.aiRandomFactor > 0.5 ? Math.PI / 4 : -Math.PI / 4);
                    this.aiDirection.x = Math.cos(perpAngle) * speedMod * 0.3;
                    this.aiDirection.y = Math.sin(perpAngle) * speedMod * 0.3;
                }
                break;
                
            case 'defensive':
                if (this.aiCurrentDecision === 'panic' || distance < optimalDist * 1.2) {
                    this.aiDirection.x = -Math.cos(angleToEnemy) * speedMod * 0.7;
                    this.aiDirection.y = -Math.sin(angleToEnemy) * speedMod * 0.7;
                } else {
                    // Slow repositioning
                    this.aiDirection.x = Math.cos(angleToEnemy + Math.PI / 3) * speedMod * 0.4;
                    this.aiDirection.y = Math.sin(angleToEnemy + Math.PI / 3) * speedMod * 0.4;
                }
                break;
                
            case 'flanker':
                const flankAngle = angleToEnemy + (this.playerId === 1 ? Math.PI / 2 : -Math.PI / 2);
                if (this.aiCurrentDecision === 'reposition') {
                    // Deliberate flanking movement
                    this.aiDirection.x = Math.cos(flankAngle) * speedMod * 1.2;
                    this.aiDirection.y = Math.sin(flankAngle) * speedMod * 1.2;
                } else if (distance > optimalDist * 1.3) {
                    this.aiDirection.x = (Math.cos(angleToEnemy) + Math.cos(flankAngle)) * speedMod * 0.7;
                    this.aiDirection.y = (Math.sin(angleToEnemy) + Math.sin(flankAngle)) * speedMod * 0.7;
                } else if (distance < optimalDist * 0.8) {
                    this.aiDirection.x = -Math.cos(angleToEnemy) * speedMod * 0.6;
                    this.aiDirection.y = -Math.sin(angleToEnemy) * speedMod * 0.6;
                } else {
                    this.aiDirection.x = Math.cos(flankAngle) * speedMod;
                    this.aiDirection.y = Math.sin(flankAngle) * speedMod;
                }
                break;
        }
    }

    private patrolBehavior(currentTime: number, canvasWidth: number, canvasHeight: number, enemyTank?: Tank): void {
        // If we have an enemy tank, try to move to get line of sight
        if (enemyTank) {
            const dx = enemyTank.position.x - this.position.x;
            const dy = enemyTank.position.y - this.position.y;
            
            // Move towards a position where we can see the enemy
            this.aiDirection.x = Math.sign(dx) * 0.4;
            this.aiDirection.y = Math.sign(dy) * 0.4;
        } else {
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
            } else if (this.playerId === 2 && this.position.x > channelCenter + 120) {
                this.aiDirection.x = -Math.abs(this.aiDirection.x); // Move left
            }
        }

        // Avoid walls by changing direction
        const margin = 60;
        if (this.position.x < margin || this.position.x > canvasWidth - margin) {
            this.aiDirection.x *= -1;
        }
        if (this.position.y < margin || this.position.y > canvasHeight - margin) {
            this.aiDirection.y *= -1;
        }
    }

    private executeAIMovement(canvasWidth: number, canvasHeight: number, channelLeft?: number, channelRight?: number): void {
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

    private updateManual(pressedKeys: Set<string>, canvasWidth: number, canvasHeight: number, channelLeft?: number, channelRight?: number): void {
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

    public shouldAIShoot(enemyTank: Tank): boolean {
        if (!this.isAI || !this.canShoot()) return false;
        
        const dx = enemyTank.position.x - this.position.x;
        const dy = enemyTank.position.y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Random decision affects shooting behavior
        if (this.aiCurrentDecision === 'hesitate' && Math.random() < 0.5) { // Reduced from 0.7
            return false; // Don't shoot when hesitating
        }
        
        if (this.aiCurrentDecision === 'panic' && Math.random() < 0.4) { // Increased from 0.3
            return true; // Panic fire regardless of aim
        }
        
        if (this.aiCurrentDecision === 'overconfident' && distance < 450) { // Increased from 400
            return Math.random() < 0.9; // Increased from 0.8 - shoot more often when overconfident
        }
        
        // More aggressive shooting - increased range significantly
        const maxShootingRange = Math.max(this.aiPersonalityModifiers.shootingRange * 1.3, 350);
        
        if (distance < maxShootingRange && distance > 50) {
            const angleToEnemy = Math.atan2(dy, dx);
            const angleDiff = Math.abs(this.angle - angleToEnemy);
            
            // Normalize angle difference to 0-PI range
            const normalizedAngleDiff = Math.min(angleDiff, 2 * Math.PI - angleDiff);
            
            // Use personality-based aim accuracy, modified by decisions
            let aimAccuracy = this.aiPersonalityModifiers.aimAccuracy;
            
            if (this.aiCurrentDecision === 'cautious') {
                aimAccuracy *= 0.8; // Slightly increased from 0.7
            } else if (this.aiCurrentDecision === 'panic') {
                aimAccuracy *= 1.8; // Reduced from 2.0 - still less accurate but not completely wild
            }
            
            // More lenient aiming - multiply by 1.2 for more shots
            return normalizedAngleDiff < (aimAccuracy * 1.2);
        }
        
        return false;
    }

    canShoot(): boolean {
        return Date.now() - this.lastShotTime > this.shootCooldown;
    }

    shoot(bulletSpeed: number, bulletSize: number): Bullet | null {
        if (!this.canShoot()) {
            return null;
        }

        this.lastShotTime = Date.now();

        const bulletVelocity: Vector2D = {
            x: Math.cos(this.angle) * bulletSpeed,
            y: Math.sin(this.angle) * bulletSpeed
        };

        return new Bullet(
            { ...this.position },
            bulletVelocity,
            bulletSize,
            this.playerId
        );
    }

    render(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle);

        // Tank body
        ctx.fillStyle = this.isFrozen ? '#4444ff' : this.color; // Blue when frozen
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);

        // Tank barrel
        ctx.fillStyle = this.isFrozen ? '#6666ff' : '#888'; // Lighter blue when frozen
        ctx.fillRect(0, -2, this.size / 2, 4);

        // Tank outline
        ctx.strokeStyle = this.isFrozen ? '#aaaaff' : '#fff'; // Light blue outline when frozen
        ctx.lineWidth = this.isFrozen ? 2 : 1; // Thicker outline when frozen
        ctx.strokeRect(-this.size / 2, -this.size / 2, this.size, this.size);

        // Add freeze indicator
        if (this.isFrozen) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('❄', 0, -this.size/2 - 10);
        }

        ctx.restore();
    }

    freeze(): void {
        this.isFrozen = true;
        this.frozenUntil = Date.now() + this.frozenDuration;
        console.log(`Tank ${this.playerId} frozen for ${this.frozenDuration/1000} seconds!`);
    }

    checkCollision(other: Tank): boolean {
        const dx = this.position.x - other.position.x;
        const dy = this.position.y - other.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.size;
    }
}
