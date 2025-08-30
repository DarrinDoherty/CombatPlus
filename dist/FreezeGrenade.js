export class FreezeGrenade {
    constructor(position, velocity, size = 8) {
        this.position = { ...position };
        this.velocity = { ...velocity };
        this.size = size;
        this.active = true;
        this.explosionRadius = 150; // Radius of freeze effect
        this.timeToExplode = 1000; // 1 second until explosion
        this.createdAt = Date.now();
    }
    update() {
        if (!this.active)
            return;
        // Simple movement - no physics, just travel in the direction thrown
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        // Check if it's time to explode (after traveling for set time)
        const currentTime = Date.now();
        if (currentTime - this.createdAt >= this.timeToExplode) {
            this.explode();
        }
    }
    explode() {
        this.active = false;
        console.log(`Freeze grenade exploded at (${this.position.x}, ${this.position.y})`);
    }
    render(ctx) {
        if (!this.active)
            return;
        ctx.save();
        // Flash effect as it gets closer to explosion
        const timeLeft = this.timeToExplode - (Date.now() - this.createdAt);
        const flashIntensity = Math.max(0, 1 - (timeLeft / this.timeToExplode));
        // Draw grenade body
        ctx.fillStyle = flashIntensity > 0.5 ? '#ffffff' : '#00ccff'; // Flash white when about to explode
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size / 2, 0, 2 * Math.PI);
        ctx.fill();
        // Draw freeze symbol (snowflake-like)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Draw a simple cross pattern for freeze symbol
        const symbolSize = this.size / 3;
        ctx.moveTo(this.position.x - symbolSize, this.position.y);
        ctx.lineTo(this.position.x + symbolSize, this.position.y);
        ctx.moveTo(this.position.x, this.position.y - symbolSize);
        ctx.lineTo(this.position.x, this.position.y + symbolSize);
        ctx.stroke();
        // Add outline
        ctx.strokeStyle = '#004466';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size / 2, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.restore();
    }
    isInBounds(width, height) {
        return (this.position.x >= 0 &&
            this.position.x <= width &&
            this.position.y >= 0 &&
            this.position.y <= height);
    }
    // Check if a tank is within the explosion radius
    isInRange(target) {
        const dx = this.position.x - target.position.x;
        const dy = this.position.y - target.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= this.explosionRadius;
    }
}
//# sourceMappingURL=FreezeGrenade.js.map