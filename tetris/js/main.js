import { createGame } from './game.js';
import { createRenderer } from './renderer.js';
import { bindInput } from './input.js';

// Initialize game and renderer
const game = createGame();
const renderer = createRenderer();

// Bind keyboard input
bindInput(game);

// Game loop
let lastTimestamp = 0;

function loop(timestamp) {
  const dt = lastTimestamp ? Math.min(timestamp - lastTimestamp, 100) : 0; // cap at 100ms
  lastTimestamp = timestamp;

  game.tick(dt);
  renderer.render(game.getState());

  requestAnimationFrame(loop);
}

// Start the loop
requestAnimationFrame(loop);
