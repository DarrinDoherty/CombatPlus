# Combat Plus - Atari Combat Clone

A simple TypeScript implementation of the classic Atari Combat tank game using HTML5 Canvas.

## Features

- Two-player local multiplayer
- Tank movement and rotation
- Bullet shooting mechanics
- Collision detection
- Score tracking
- Classic retro styling

## Controls

### Player 1 (Green Tank)
- **W/A/S/D**: Move up/left/down/right
- **Spacebar**: Shoot

### Player 2 (Red Tank)
- **Arrow Keys**: Move up/left/down/right
- **Enter**: Shoot

### General
- **R**: Restart game

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the TypeScript files:
   ```bash
   npm run build
   ```

3. Serve the game locally:
   ```bash
   npm run serve
   ```

4. Open your browser and go to `http://localhost:8000`

## Development

- `npm run dev` - Watch for TypeScript changes and auto-compile
- `npm run build` - Compile TypeScript to JavaScript

## Game Mechanics

- Tanks can move in 8 directions
- Bullets travel in the direction the tank was moving when fired
- Hitting an opponent scores a point and resets the round
- Tanks cannot move through each other
- Bullets are destroyed when they hit a tank or leave the screen

## Technical Details

- Built with TypeScript for type safety
- Uses HTML5 Canvas for 2D rendering
- Modular class-based architecture
- Smooth 60fps game loop using requestAnimationFrame

## Why Canvas over 3D?

This implementation uses 2D Canvas instead of 3D (WebGL/Three.js) because:

1. **Authentic Feel**: Matches the original 2D Atari Combat aesthetic
2. **Simplicity**: Easier to implement and maintain
3. **Performance**: Lower overhead for simple 2D graphics
4. **Compatibility**: Works on more devices and browsers
5. **Development Speed**: Faster prototyping and iteration

The original Atari Combat was a 2D game, so 2D Canvas is the perfect choice for this clone!
