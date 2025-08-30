# Audio Files for CombatPlus

Place your recorded audio files in this folder to replace the synthesized sounds.

## Supported Audio Files

- **explosion.mp3** - Tank explosion sound (replaces synthesized explosion)
- **tank_fire.wav** - Tank firing sound (replaces synthesized tank shoot)  
- **shell_whistle.wav** - Artillery shell whistle while in flight
- **mission_success.mp3** - Mission completion celebration sound
- **soldier_down.wav** - Soldier death/injury sound

### Multiple Medic Pickup Sounds (Random Selection)
- **medic_pickup_1.m4a** - "I got you!" 
- **medic_pickup_2.m4a** - "Stay with me!"
- **medic_pickup_3.m4a** - "You're safe now!"
- **medic_pickup_4.m4a** - "Hang in there!"
- **medic_pickup_5.m4a** - "Let's get you out of here!"
- **medic_pickup_6.m4a** - "I've got you, soldier!"

*The game will randomly select one of these medic sounds each time you pick up a soldier. If no recorded sounds are available, it uses 6 different synthesized variations.*

## Audio Format Requirements:

- Supported formats: MP3, WAV, OGG, M4A
- Recommended sample rate: 44.1kHz
- Recommended bit depth: 16-bit or 24-bit
- Keep file sizes reasonable for web loading

## How It Works:

The game will automatically detect if these files exist and use them instead of the synthesized 8-bit sounds. If a file is missing, it falls back to the original synthesized sound.

## Recording Tips:

- **Explosion**: Sharp, impactful sound with good low-end
- **Tank Fire**: Quick, punchy cannon shot
- **Shell Whistle**: Falling pitch whistle lasting 1-2 seconds
- **Mission Success**: Upbeat, celebratory sound
- **Soldier Down**: Dramatic, somber sound for casualties

Just drop your recorded files here with the exact names above and refresh the game!
