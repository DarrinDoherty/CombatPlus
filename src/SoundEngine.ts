export class SoundEngine {
    private audioContext: AudioContext;
    private masterVolume: number;
    private audioBuffers: Map<string, AudioBuffer>;

    constructor() {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterVolume = 0.3; // Keep sounds at reasonable volume
        this.audioBuffers = new Map();
    }

    // Load audio file and store in buffer
    async loadAudioFile(name: string, url: string): Promise<void> {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.audioBuffers.set(name, audioBuffer);
            console.log(`Loaded audio: ${name}`);
        } catch (error) {
            console.error(`Failed to load audio ${name}:`, error);
        }
    }

    // Play recorded audio file
    playRecordedAudio(name: string, volume: number = 1): void {
        const buffer = this.audioBuffers.get(name);
        if (!buffer) {
            console.warn(`Audio not loaded: ${name}`);
            return;
        }

        const source = this.audioContext.createBufferSource();
        const gain = this.createGain(volume);
        
        source.buffer = buffer;
        source.connect(gain);
        gain.connect(this.audioContext.destination);
        
        source.start();
    }

    // Play random medic pickup sound
    playRandomMedicPickup(): void {
        const medicSounds = [
            'medic_pickup_1',
            'medic_pickup_2', 
            'medic_pickup_3',
            'medic_pickup_4',
            'medic_pickup_5',
            'medic_pickup_6'
        ];
        
        // Filter to only sounds that are actually loaded
        const availableSounds = medicSounds.filter(sound => this.audioBuffers.has(sound));
        
        console.log('Available medic sounds:', availableSounds.length, 'out of', medicSounds.length);
        console.log('Loaded audio buffers:', Array.from(this.audioBuffers.keys()));
        
        if (availableSounds.length > 0) {
            // Randomly select one of the available medic sounds
            const randomSound = availableSounds[Math.floor(Math.random() * availableSounds.length)];
            console.log('Playing recorded medic sound:', randomSound);
            this.playRecordedAudio(randomSound, 0.8);
        } else {
            // Multiple synthesized medic pickup variations
            console.log('No recorded medic sounds available, using synthesized');
            this.playRandomSynthesizedMedicPickup();
        }
    }

    // Multiple synthesized medic pickup sound variations
    private playRandomSynthesizedMedicPickup(): void {
        const variation = Math.floor(Math.random() * 6) + 1; // Random 1-6
        
        switch (variation) {
            case 1:
                this.playSoldierPickup(); // Original sound
                break;
            case 2:
                // Higher pitched urgency
                this.playMedicPickupVariation(550, 880, 0.12);
                break;
            case 3:
                // Lower pitched determined
                this.playMedicPickupVariation(330, 660, 0.15);
                break;
            case 4:
                // Quick double beep
                this.playMedicPickupVariation(440, 880, 0.08);
                setTimeout(() => this.playMedicPickupVariation(440, 880, 0.08), 150);
                break;
            case 5:
                // Rising heroic tone
                this.playMedicPickupVariation(220, 880, 0.25);
                break;
            case 6:
                // Gentle reassuring tone
                this.playMedicPickupVariation(392, 523, 0.18);
                break;
        }
    }

    private playMedicPickupVariation(startFreq: number, endFreq: number, duration: number): void {
        const oscillator = this.createOscillator(startFreq, 'sine');
        const gain = this.createGain(0.1);
        
        oscillator.connect(gain);
        gain.connect(this.audioContext.destination);
        
        // Rising tone
        oscillator.frequency.exponentialRampToValueAtTime(endFreq, this.audioContext.currentTime + duration);
        gain.gain.setValueAtTime(0.1 * this.masterVolume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Play recorded audio with fallback to synthesized sound
    playWithFallback(recordedName: string, fallbackFunction: () => void, volume: number = 1): void {
        if (this.audioBuffers.has(recordedName)) {
            this.playRecordedAudio(recordedName, volume);
        } else {
            fallbackFunction();
        }
    }

    // Resume audio context (required for some browsers)
    async resumeContext(): Promise<void> {
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    // Create a simple oscillator-based sound
    private createOscillator(frequency: number, type: OscillatorType = 'square'): OscillatorNode {
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        return oscillator;
    }

    // Create gain node for volume control
    private createGain(volume: number = 1): GainNode {
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(volume * this.masterVolume, this.audioContext.currentTime);
        return gain;
    }

    // Tank shoot sound
    playTankShoot(): void {
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
    playExplosion(): void {
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
    playGrenadeThrow(): void {
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
    playFreezeEffect(): void {
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
    playSoldierPickup(): void {
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
    playTankRepair(): void {
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
    playFreezeGrenadeExplosion(): void {
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
    playMissionSuccess(): void {
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
    playSoldierDeath(): void {
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
    playGrenadePickup(): void {
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
    playPlayerHit(): void {
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
    playCriticalBeep(): void {
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
    playTankRepaired(): void {
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
    startShellWhistle(): { stop: () => void } {
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
    resumeAudioContext(): void {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Set master volume
    setVolume(volume: number): void {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
}
