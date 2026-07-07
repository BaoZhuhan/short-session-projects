import {
  CMD_LEFT, CMD_RIGHT, CMD_DOWN,
  CMD_ROTATE_CW, CMD_ROTATE_CCW,
  CMD_HARD_DROP, CMD_HOLD,
} from './constants.js';

// Key mapping
const KEY_MAP = {
  'ArrowLeft': CMD_LEFT,
  'ArrowRight': CMD_RIGHT,
  'ArrowDown': CMD_DOWN,
  'ArrowUp': CMD_ROTATE_CW,
  'KeyX': CMD_ROTATE_CW,
  'KeyZ': CMD_ROTATE_CCW,
  'Space': CMD_HARD_DROP,
  'KeyC': CMD_HOLD,
  'KeyP': 'pause',
  'Enter': 'start',
};

export function bindInput(game) {
  function handleKey(e) {
    const cmd = KEY_MAP[e.code];
    if (!cmd) return;

    e.preventDefault();

    const state = game.getState().state;

    if (cmd === 'start') {
      if (state === 'MENU' || state === 'GAME_OVER') {
        game.startGame();
      }
      return;
    }

    if (cmd === 'pause') {
      if (state === 'PLAYING' || state === 'PAUSED') {
        game.togglePause();
      }
      return;
    }

    // Game commands only during PLAYING
    if (state !== 'PLAYING') return;

    game.queueCommand(cmd);
  }

  window.addEventListener('keydown', handleKey);

  // Return cleanup function
  return () => {
    window.removeEventListener('keydown', handleKey);
  };
}
