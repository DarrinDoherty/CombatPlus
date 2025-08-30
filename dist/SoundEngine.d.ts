export declare class SoundEngine {
    private audioContext;
    private masterVolume;
    private audioBuffers;
    constructor();
    loadAudioFile(name: string, url: string): Promise<void>;
    playRecordedAudio(name: string, volume?: number): void;
    playRandomMedicPickup(): void;
    private playRandomSynthesizedMedicPickup;
    private playMedicPickupVariation;
    playWithFallback(recordedName: string, fallbackFunction: () => void, volume?: number): void;
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
