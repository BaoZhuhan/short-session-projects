import { COLS, ROWS } from './constants.js';

// Create an empty board (2D array of null)
export function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

// Check if a piece matrix is valid at (offsetX, offsetY)
export function isValidPosition(board, matrix, offsetX, offsetY) {
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (!matrix[r][c]) continue;
      const bx = offsetX + c;
      const by = offsetY + r;
      // Out of horizontal bounds
      if (bx < 0 || bx >= COLS) return false;
      // Below the board
      if (by >= ROWS) return false;
      // Collision with locked piece (allow negative Y for spawning above)
      if (by >= 0 && board[by][bx] !== null) return false;
    }
  }
  return true;
}

// Lock a piece into the board
export function lockPiece(board, matrix, offsetX, offsetY, color) {
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (!matrix[r][c]) continue;
      const bx = offsetX + c;
      const by = offsetY + r;
      if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
        board[by][bx] = color;
      }
    }
  }
}

// Clear completed lines and return { count, rows (original indices) }
export function clearLines(board) {
  let cleared = 0;
  const clearedRows = [];
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(cell => cell !== null)) {
      clearedRows.push(r);
      // Remove the full line and add an empty one at top
      board.splice(r, 1);
      board.unshift(Array(COLS).fill(null));
      cleared++;
      r++; // Re-check the same row index (now contains shifted-down content)
    }
  }
  return { count: cleared, rows: clearedRows };
}
