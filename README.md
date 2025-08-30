# Combat Plus - Tactical Rescue Mission Game

An advanced TypeScript implementation inspired by Atari Combat, evolved into a sophisticated tactical rescue mission game with AI tank warfare, dynamic spawning, and emotional soldier rescue mechanics.

## 🎮 Game Overview

Combat Plus is a single-player tactical rescue game where you play as a medic navigating through intense tank warfare to rescue injured soldiers. Each mission presents unique challenges with dynamic AI personalities, bleeding out timers, and strategic freeze grenade combat.

## ✨ Key Features

### 🚑 Rescue Mission System
- **Injured Soldiers**: Each with unique backstories, ranks, and family details
- **Bleeding Out Mechanic**: 30-second continuous timer creating urgent gameplay
- **Hospital Safety Zone**: Top 50px of screen provides sanctuary for healing
- **Emotional Storytelling**: Celebration for rescues, mourning for losses

### 🎯 Advanced Tank Combat
- **Health-Based System**: 2-hit destruction (healthy → damaged → disabled → destroyed)
- **Auto-Repair Mechanics**: Disabled tanks repair after 8 seconds with visual progress
- **AI Personalities**: 4 distinct behaviors (Aggressive, Sniper, Defensive, Flanker)
- **Smart Targeting**: Team-based AI that engages across no-man's land

### 💣 Tactical Grenade System
- **Directional Throwing**: WASD keys for precise 4-direction grenade deployment
- **Freeze Mechanics**: Temporarily disable tanks in explosion radius
- **Pickup System**: Random grenade spawns (8-20 second intervals)
- **Auto-Aim Option**: Spacebar for automatic targeting

### 🎵 Immersive Audio
- **8-bit Sound Engine**: Authentic retro game audio using Web Audio API
- **Dynamic Sound Effects**: Tank shots, explosions, repairs, soldier events
- **Procedural Audio**: Oscillator-based sound generation for authentic feel

### 🏭 Dynamic Warfare
- **Balanced Spawning**: Losing teams get faster reinforcements
- **No Empty Sides**: Always maintains active combat on both sides
- **Progressive Difficulty**: Freeze times decrease with more rescues completed

## 🎮 Controls

### Movement
- **Arrow Keys**: Move medic up/down in the central channel
- **WASD Alternative**: Also supported for movement

### Combat & Tactics
- **W/A/S/D**: Throw freeze grenades directionally (Up/Left/Down/Right)
- **Spacebar**: Auto-aim freeze grenade (direction depends on context)
- **Strategy**: Use grenades to create safe passages through tank fire

### Game Flow
- **R**: Restart game
- **First Click/Key**: Resumes audio context (browser requirement)

## 🏗️ Code Architecture

### Core Game Engine (`src/Game.ts`)
```typescript
class Game {
    // Main game loop with 60fps rendering
    // Manages all game systems and state
    // Handles collision detection and physics
    // Orchestrates sound engine integration
}
```

### Combat System
- **`Tank.ts`**: AI personalities, health system, repair mechanics
- **`Bullet.ts`**: Projectile physics and collision
- **`FreezeGrenade.ts`**: Tactical grenade mechanics
- **`PickupGrenade.ts`**: Random ammunition drops

### Rescue Mission System
- **`Player.ts`**: Medic character with carrying mechanics
- **`InjuredSoldier.ts`**: Bleeding out system and health meters
- **`SoldierProfiles.ts`**: 10+ unique soldier backstories

### Audio Engine
- **`SoundEngine.ts`**: Web Audio API-based 8-bit sound system
- **Procedural Generation**: Oscillator-based authentic retro sounds
- **Event-Driven**: Contextual audio for all game actions

### Visual Effects
- **`Explosion.ts`**: Particle effects for impacts and events
- **Canvas Rendering**: Smooth 2D graphics with visual feedback
- **UI Systems**: Health meters, progress bars, legend display

## 🎯 Gameplay Mechanics

### Mission Objectives
1. **Locate**: Find injured soldier in no-man's land
2. **Rescue**: Navigate through tank fire to reach them
3. **Transport**: Carry soldier back to hospital while bleeding continues
4. **Survive**: Use freeze grenades strategically to create safe passages

### AI Tank Behavior
- **Aggressive**: Fast movement, close combat, frequent shooting
- **Sniper**: Long-range, slower shots, defensive positioning  
- **Defensive**: Medium range, balanced approach
- **Flanker**: Mobile, good range, tactical movement

### Strategic Elements
- **Grenade Management**: Limited ammunition requires careful planning
- **Timing**: Bleeding out creates constant pressure
- **Risk/Reward**: Faster rescues vs. safer approaches
- **Resource Collection**: Pickup grenades provide tactical options

## 🛠️ Development Setup

### Prerequisites
- Node.js and npm
- TypeScript compiler

### Getting Started
```bash
# Install dependencies
npm install

# Build TypeScript files
npm run build
# or
npx tsc

# Serve locally
npm run serve
# or
python -m http.server 8000

# Development mode (auto-compile)
npm run dev
```

### Project Structure
```
src/
├── main.ts              # Entry point and game initialization
├── Game.ts              # Core game engine and systems
├── Player.ts            # Medic character with rescue mechanics
├── Tank.ts              # AI tank system with personalities
├── InjuredSoldier.ts    # Bleeding out and rescue system
├── SoldierProfiles.ts   # Soldier backstories and profiles
├── FreezeGrenade.ts     # Tactical grenade system
├── PickupGrenade.ts     # Ammunition pickup system
├── SoundEngine.ts       # 8-bit audio engine
├── Bullet.ts            # Projectile physics
└── Explosion.ts         # Visual effects

dist/                    # Compiled JavaScript
index.html              # Game HTML with comprehensive legend
```

## 🎨 Technical Implementation

### Performance Optimization
- **RequestAnimationFrame**: Smooth 60fps rendering
- **Efficient Collision Detection**: Optimized distance calculations
- **Memory Management**: Proper cleanup of game objects
- **Audio Context Management**: Browser-compatible sound initialization

### Modern TypeScript Features
- **ES2020 Modules**: Clean import/export system
- **Type Safety**: Comprehensive interface definitions
- **Class-Based Architecture**: Modular and maintainable code
- **Canvas 2D Rendering**: Hardware-accelerated graphics

### Browser Compatibility
- **Audio Context Resumption**: Handles browser audio restrictions
- **Cross-Platform**: Works on desktop and mobile browsers
- **Progressive Enhancement**: Graceful feature degradation

## 🎵 Audio System Details

The game features a custom 8-bit sound engine built with Web Audio API:

- **Tank Combat**: Shooting, explosions, repairs
- **Mission Audio**: Soldier pickup, rescue success, death
- **Tactical Sounds**: Grenade throws, pickups, freeze effects
- **Player Feedback**: Hit sounds, achievement audio

All sounds are procedurally generated using oscillators for authentic retro gaming experience.

## 🏆 Game Features Timeline

1. **Tank Combat Base**: Original Atari Combat mechanics
2. **Rescue Mission**: Added medic character and soldier rescue
3. **Health System**: 2-hit tank destruction with repair mechanics
4. **AI Personalities**: Diverse tank behaviors and smart targeting
5. **Tactical Grenades**: Directional throwing and freeze mechanics
6. **Bleeding System**: Continuous urgency with health meters
7. **Pickup System**: Dynamic grenade ammunition spawning
8. **Audio Engine**: Complete 8-bit sound implementation
9. **Emotional Depth**: Soldier profiles and storytelling

## 🚀 Why This Architecture?

### Canvas 2D Choice
- **Authentic Retro Feel**: Matches classic arcade aesthetics
- **Performance**: Efficient for 2D game mechanics
- **Simplicity**: Easier debugging and development
- **Compatibility**: Universal browser support

### TypeScript Benefits
- **Type Safety**: Prevents runtime errors
- **Modern Features**: ES6+ with compile-time checking
- **IDE Support**: Enhanced development experience
- **Maintainability**: Self-documenting code with interfaces

### Modular Design
- **Separation of Concerns**: Each class handles specific functionality
- **Extensibility**: Easy to add new features and mechanics
- **Testing**: Isolated components for better testing
- **Reusability**: Components can be modified independently

Experience intense tactical rescue missions with authentic retro gaming audio and sophisticated AI combat!
