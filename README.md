# Combat Plus - Tactical Rescue Mission Game

An advanced TypeScript implementation inspired by Atari Combat, evolved into a sophisticated tactical rescue mission game with AI tank warfare, dynamic spawning, and emotional soldier rescue mechanics.

## 🚀 Quick Start

### Prerequisites

- Python 3.x (for local web server)
- Node.js and npm (for development)

### Running the Game

1. **Clone the repository:**

   ```bash
   git clone https://github.com/DarrinDoherty/CombatPlus.git
   cd CombatPlus
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Build the TypeScript:**

   ```bash
   npm run build
   ```

4. **Start the web server:**

   ```bash
   npm start
   ```

5. **Open your browser and navigate to:**

   ```url
   http://localhost:8000
   ```

6. **Wait for loading to complete, then click "START MISSION" to begin!**

### Development Mode

For development with auto-compilation:

```bash
npm run dev    # Starts TypeScript watch mode
npm start      # Start web server (in another terminal)
```

## 🎮 Game Overview

Combat Plus is a single-player tactical rescue game where you play as a medic navigating through intense tank warfare to rescue injured soldiers. Each mission presents unique challenges with dynamic AI personalities, bleeding out timers, and strategic freeze grenade combat.

## ✨ Key Features

### 🚑 Rescue Mission System
- **Injured Soldiers**: Each with unique backstories, ranks, and family details
- **Bleeding Out Mechanic**: 30-second continuous timer creating urgent gameplay
- **Hospital Safety Zone**: Top 50px of screen provides sanctuary for healing
- **Emotional Storytelling**: Celebration for rescues, mourning for losses

### 🎯 Advanced Tank Combat
- **Explosive Shell System**: Each tank fires one shell at a time with radius damage
- **Artillery-Style Combat**: Shells explode on impact or boundary hit, damaging all units in blast radius
- **Health-Based System**: 2-hit destruction (healthy → damaged → disabled → destroyed)
- **Auto-Repair Mechanics**: Disabled tanks repair after 8 seconds with visual progress
- **AI Personalities**: 4 distinct behaviors with different firing rates and strategies
  - **Aggressive**: Fast firing (1.2s cooldown), close combat tactics
  - **Sniper**: Slow but accurate (2.2s cooldown), long-range engagement
  - **Defensive**: Moderate firing (1.8s cooldown), balanced approach
  - **Flanker**: Quick firing (1.4s cooldown), mobile tactics
- **Smart Targeting**: Team-based AI that engages across no-man's land
- **One Shell Per Tank**: Each tank must wait for their shell to explode before firing again

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
- **Aggressive**: Fast movement, close combat, rapid firing (1.2s cooldown)
- **Sniper**: Long-range, precise shots, slower firing (2.2s cooldown)
- **Defensive**: Medium range, balanced approach (1.8s cooldown)
- **Flanker**: Mobile, tactical movement, quick firing (1.4s cooldown)

### Combat Mechanics
- **Explosive Shells**: Each tank shell creates a blast radius dealing area damage
- **One Shell Rule**: Tanks must wait for their shell to explode before firing again
- **Artillery Strategy**: Shells explode on impact or when hitting boundaries
- **Area Damage**: Multiple units can be damaged by a single shell explosion
- **Friendly Fire Prevention**: Shells only damage enemy units, not same-team tanks

### Strategic Elements
- **Shell Management**: Timing and positioning critical with one-shell-per-tank limit
- **Explosive Positioning**: Use tank explosions to clear multiple enemies
- **Grenade Management**: Limited ammunition requires careful planning
- **Timing**: Bleeding out creates constant pressure
- **Risk/Reward**: Faster rescues vs. safer approaches through explosive combat zones
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
10. **Explosive Shell System**: Artillery-style combat with area damage and one-shell-per-tank mechanics

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
