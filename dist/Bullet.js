export class Bullet {
    constructor(position, velocity, size, playerId, explosionRadius = 40) {
        this.position = { ...position };
        this.velocity = { ...velocity };
        this.size = size;
        this.active = true;
        this.playerId = playerId;
        this.explosionRadius = explosionRadius;
    }
    update() {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
    render(ctx) {
        ctx.fillStyle = this.playerId === 1 ? '#ffff00' : '#ff00ff';
        ctx.fillRect(this.position.x - this.size / 2, this.position.y - this.size / 2, this.size, this.size);
    }
    isOutOfBounds(width, height) {
        return (this.position.x < 0 ||
            this.position.x > width ||
            this.position.y < 0 ||
            this.position.y > height);
    }
    checkCollision(other) {
        const dx = this.position.x - other.position.x;
        const dy = this.position.y - other.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.size + other.size) / 2;
    }
}
//# sourceMappingURL=Bullet.js.map