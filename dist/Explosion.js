export class Explosion {
    constructor(position, particleCount = 20) {
        this.position = { ...position };
        this.particles = [];
        this.duration = 1500; // 1.5 seconds
        this.flashDuration = 100; // 100ms bright flash
        this.startTime = Date.now();
        this.active = true;
        // Create particles
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(new Particle({ ...position }, this.getRandomVelocity(), this.getRandomColor(), Math.random() * 800 + 400 // lifetime between 400-1200ms
            ));
        }
    }
    getRandomVelocity() {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 150 + 50; // speed between 50-200
        return {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };
    }
    getRandomColor() {
        const colors = ['#ff4500', '#ff6600', '#ff8800', '#ffaa00', '#ffcc00', '#ffff00', '#ff0000'];
        return colors[Math.floor(Math.random() * colors.length)] || '#ff4500';
    }
    update() {
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.startTime;
        if (elapsedTime >= this.duration) {
            this.active = false;
            return;
        }
        // Update particles
        this.particles.forEach(particle => particle.update());
        // Remove dead particles
        this.particles = this.particles.filter(particle => particle.active);
        // If no particles left, deactivate explosion
        if (this.particles.length === 0) {
            this.active = false;
        }
    }
    render(ctx) {
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.startTime;
        // Draw initial bright flash
        if (elapsedTime < this.flashDuration) {
            const flashAlpha = 1 - (elapsedTime / this.flashDuration);
            ctx.save();
            ctx.globalAlpha = flashAlpha * 0.8;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, 50 * flashAlpha, 0, Math.PI * 2);
            ctx.fill();
            // Outer glow
            ctx.globalAlpha = flashAlpha * 0.4;
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, 80 * flashAlpha, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        // Render particles
        this.particles.forEach(particle => particle.render(ctx));
    }
}
class Particle {
    constructor(position, velocity, color, lifetime) {
        this.position = { ...position };
        this.velocity = { ...velocity };
        this.color = color;
        this.lifetime = lifetime;
        this.startTime = Date.now();
        this.active = true;
        this.size = Math.random() * 4 + 2; // size between 2-6
    }
    update() {
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.startTime;
        if (elapsedTime >= this.lifetime) {
            this.active = false;
            return;
        }
        // Update position
        this.position.x += this.velocity.x * 0.016; // assuming 60fps
        this.position.y += this.velocity.y * 0.016;
        // Apply gravity and friction
        this.velocity.y += 200 * 0.016; // gravity
        this.velocity.x *= 0.98; // friction
        this.velocity.y *= 0.98;
    }
    render(ctx) {
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.startTime;
        const lifeRatio = elapsedTime / this.lifetime;
        // Fade out over time
        const alpha = 1 - lifeRatio;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size * (1 - lifeRatio * 0.5), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
//# sourceMappingURL=Explosion.js.map