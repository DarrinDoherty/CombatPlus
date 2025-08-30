export declare class SoundEngine {
    private audioContext;
    private masterVolume;
    constructor();
    resumeContext(): Promise<void>;
    private createOscillator;
    private createGain;
    playTankShoot(): void;
    playExplosion(): void;
    playGrenadeThrow(): void;
    playFreezeEffect(): void;
    playSoldierPickup(): void;
    playTankRepair(): void;
    playFreezeGrenadeExplosion(): void;
    playMissionSuccess(): void;
    playSoldierDeath(): void;
    playGrenadePickup(): void;
    playPlayerHit(): void;
    playCriticalBeep(): void;
    playTankRepaired(): void;
    startShellWhistle(): {
        stop: () => void;
    };
    resumeAudioContext(): void;
    setVolume(volume: number): void;
}
