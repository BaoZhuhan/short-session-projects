// Grid dimensions
export const COLS = 10;
export const ROWS = 20;
export const CELL_SIZE = 30;

// Board pixel dimensions
export const BOARD_WIDTH = COLS * CELL_SIZE;   // 300
export const BOARD_HEIGHT = ROWS * CELL_SIZE;  // 600

// Colors for each piece type
export const PIECE_COLORS = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000',
};

// Ghost piece opacity
export const GHOST_ALPHA = 0.25;

// Scoring: base points per lines cleared at once
export const LINE_SCORES = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
};

// Soft drop points per row
export const SOFT_DROP_SCORE = 1;
export const HARD_DROP_SCORE = 2;

// Lock delay in milliseconds
export const LOCK_DELAY = 500;

// Drop interval (ms) per level (NES-inspired curve)
export const DROP_INTERVALS = [
  800, 717, 633, 550, 467, 383, 300, 217, 133, 100,
  83, 67, 50, 33, 33, 33, 33, 33, 33, 33,
];

// Lines per level
export const LINES_PER_LEVEL = 10;

// Game states
export const STATE_MENU = 'MENU';
export const STATE_PLAYING = 'PLAYING';
export const STATE_PAUSED = 'PAUSED';
export const STATE_GAME_OVER = 'GAME_OVER';

// Input commands
export const CMD_LEFT = 'left';
export const CMD_RIGHT = 'right';
export const CMD_DOWN = 'down';
export const CMD_ROTATE_CW = 'rotate_cw';
export const CMD_ROTATE_CCW = 'rotate_ccw';
export const CMD_HARD_DROP = 'hard_drop';
export const CMD_HOLD = 'hold';
