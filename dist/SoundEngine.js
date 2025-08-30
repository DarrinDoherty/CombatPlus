export class SoundEngine {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterVolume = 0.3; // Keep sounds at reasonable volume
    }
    // Resume audio context (required for some browsers)
    async resumeContext() {
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }
    // Create a simple oscillator-based sound
    createOscillator(frequency, type = 'square') {
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        return oscillator;
    }
    // Create gain node for volume control
    createGain(volume = 1) {
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(volume * this.masterVolume, this.audioContext.currentTime);
        return gain;
    }
    // Tank shoot sound
    playTankShoot() {
        const oscillator = this.createOscillator(150, 'square');
        const gain = this.createGain(0.1);
        oscillator.connect(gain);
        gain.connect(this.audioContext.destination);
        // Quick attack and decay
        gain.gain.setValueAtTime(0.1 * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    // Tank explosion sound
    playExplosion() {
        // Create noise-like explosion
        const oscillator1 = this.createOscillator(60, 'sawtooth');
        const oscillator2 = this.createOscillator(80, 'square');
        const gain = this.createGain(0.2);
        oscillator1.connect(gain);
        oscillator2.connect(gain);
        gain.connect(this.audioContext.destination);
        // Explosion envelope
        gain.gain.setValueAtTime(0.2 * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
        oscillator1.start();
        oscillator2.start();
        oscillator1.stop(this.audioContext.currentTime + 0.3);
        oscillator2.stop(this.audioContext.currentTime + 0.3);
    }
    // Freeze grenade throw sound
    playGrenadeThrow() {
        const oscillator = this.createOscillator(200, 'triangle');
        const gain = this.createGain(0.15);
        oscillator.connect(gain);
        gain.connect(this.audioContext.destination);
        // Whoosh sound
        oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15 * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }
    // Freeze effect sound
    playFreezeEffect() {
        const oscillator = this.createOscillator(800, 'sine');
        const gain = this.createGain(0.12);
        oscillator.connect(gain);
        gain.connect(this.audioContext.destination);
        // Ice crackling effect
        oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.5);
        gain.gain.setValueAtTime(0.12 * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    // Soldier pickup sound
    playSoldierPickup() {
        const oscillator = this.createOscillator(440, 'sine');
        const gain = this.createGain(0.1);
        oscillator.connect(gain);
        gain.connect(this.audioContext.destination);
        // Rising tone
        oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1 * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.15);
    }
    // Tank repair sound
    playTankRepair() {
        // Mechanical repair sound with wrench-like clanks
        const oscillator1 = this.createOscillator(220, 'square');
        const oscillator2 = this.createOscillator(330, 'sawtooth');
        const gain = this.createGain(0.08);
        oscillator1.connect(gain);
        oscillator2.connect(gain);
        gain.connect(this.audioContext.destination);
        // Clanking repair sounds
        gain.gain.setValueAtTime(0.08 * this.masterVolume, this.audioContext.currentTime);
        gain.gain.setValueAtTime(0.03 * this.masterVolume, this.audioContext.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08 * this.masterVolume, this.audioContext.currentTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);
        oscillator1.start();
        oscillator2.start();
        oscillator1.stop(this.audioContext.currentTime + 0.4);
        oscillator2.stop(this.audioContext.currentTime + 0.4);
    }
    // Freeze grenade explosion sound
    playFreezeGrenadeExplosion() {
        // Create a unique freeze sound with high-pitch crystalline effect
        const oscillator1 = this.createOscillator(1200, 'triangle');
        const oscillator2 = this.createOscillator(1800, 'sine');
        const gain = this.createGain(0.12);
        oscillator1.connect(gain);
        oscillator2.connect(gain);
        gain.connect(this.audioContext.destination);
        // Quick crystalline freeze effect
        gain.gain.setValueAtTime(0.12 * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
        oscillator1.start();
        oscillator2.start();
        oscillator1.stop(this.audioContext.currentTime + 0.3);
        oscillator2.stop(this.audioContext.currentTime + 0.3);
    }
    // Mission success sound
    playMissionSuccess() {
        // Play a triumphant chord
        const frequencies = [523, 659, 784]; // C, E, G major chord
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = this.createOscillator(freq, 'triangle');
                const gain = this.createGain(0.08);
                oscillator.connect(gain);
                gain.connect(this.audioContext.destination);
                gain.gain.setValueAtTime(0.08 * this.masterVolume, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.6);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.6);
            }, index * 100);
        });
    }
    // Soldier death sound
    playSoldierDeath() {
        const oscillator = this.createOscillator(220, 'sine');
        const gain = this.createGain(0.1);
        oscillator.connect(gain);
        gain.connect(this.audioContext.destination);
        // Falling tone (sad)
        oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 0.8);
        gain.gain.setValueAtTime(0.1 * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.8);
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.8);
    }
    // Pickup grenade collect sound
    playGrenadePickup() {
        const oscillator = this.createOscillator(660, 'square');
        const gain = this.createGain(0.08);
        oscillator.connect(gain);
        gain.connect(this.audioContext.destination);
        // Quick blip
        gain.gain.setValueAtTime(0.08 * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    // Player hit sound
    playPlayerHit() {
        const oscillator = this.createOscillator(100, 'sawtooth');
        const gain = this.createGain(0.15);
        oscillator.connect(gain);
        gain.connect(this.audioContext.destination);
        // Harsh damage sound
        gain.gain.setValueAtTime(0.15 * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }
    // Critical health warning beep
    playCriticalBeep() {
        const oscillator = this.createOscillator(1000, 'square');
        const gain = this.createGain(0.05);
        oscillator.connect(gain);
        gain.connect(this.audioContext.destination);
        // Quick urgent beep
        gain.gain.setValueAtTime(0.05 * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05);
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.05);
    }
    // Tank repair complete sound
    playTankRepaired() {
        const oscillator = this.createOscillator(330, 'triangle');
        const gain = this.createGain(0.06);
        oscillator.connect(gain);
        gain.connect(this.audioContext.destination);
        // Mechanical repair sound
        oscillator.frequency.exponentialRampToValueAtTime(440, this.audioContext.currentTime + 0.2);
        gain.gain.setValueAtTime(0.06 * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }
    // Shell whistle sound - returns objects to control the sound
    startShellWhistle() {
        const oscillator = this.createOscillator(800, 'sine');
        const gain = this.createGain(0.04);
        oscillator.connect(gain);
        gain.connect(this.audioContext.destination);
        // Create a falling whistle effect
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 2.0); // 2 second fall
        // Gentle volume fade in and sustain
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.04 * this.masterVolume, this.audioContext.currentTime + 0.1);
        oscillator.start();
        let stopped = false;
        return {
            stop: () => {
                if (!stopped) {
                    stopped = true;
                    // Quick fade out when shell explodes
                    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05);
                    oscillator.stop(this.audioContext.currentTime + 0.05);
                }
            }
        };
    }
    // Resume audio context (required for browser compatibility)
    resumeAudioContext() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    // Set master volume
    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
}
//# sourceMappingURL=SoundEngine.js.map