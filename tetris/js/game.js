import {
  PIECE_COLORS,
  LINE_SCORES, SOFT_DROP_SCORE, HARD_DROP_SCORE,
  LOCK_DELAY, DROP_INTERVALS, LINES_PER_LEVEL,
  STATE_MENU, STATE_PLAYING, STATE_PAUSED, STATE_GAME_OVER,
  CMD_LEFT, CMD_RIGHT, CMD_DOWN, CMD_ROTATE_CW,
  CMD_ROTATE_CCW, CMD_HARD_DROP, CMD_HOLD,
} from './constants.js';
import {
  PIECE_TYPES, getSpawnPosition, getWallKicks, getMatrix,
} from './tetrominoes.js';
import { createBoard, isValidPosition, lockPiece, clearLines } from './board.js';
import { getHighScore, setHighScore } from './storage.js';

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createGame() {
  // --- State ---
  let board = createBoard();
  let state = STATE_MENU;
  let activePiece = null;
  let ghostY = 0;
  let bag = [];
  let nextQueue = [];
  let holdPiece = null;
  let holdLocked = false;
  let score = 0;
  let lines = 0;
  let level = 1;
  let highScore = getHighScore();
  let dropTimer = 0;
  let lockTimer = 0;
  let commandBuffer = [];

  let clearingRows = null;  // array of row indices being animated
  let clearAnimTimer = 0;
  const CLEAR_ANIM_DURATION = 300; // ms

  let levelUpFlash = 0;
  const LEVEL_UP_FLASH_DURATION = 1200; // ms

  // --- Bag & Queue ---
  function refillBag() {
    if (bag.length === 0) {
      bag = shuffle(PIECE_TYPES);
    }
  }

  function pullFromBag() {
    refillBag();
    return bag.pop();
  }

  function fillNextQueue() {
    while (nextQueue.length < 3) {
      nextQueue.push(pullFromBag());
    }
  }

  // --- Spawn ---
  function spawnPiece() {
    fillNextQueue();
    const type = nextQueue.shift();
    fillNextQueue(); // keep queue full

    const spawn = getSpawnPosition(type);
    const matrix = getMatrix(type, 0);

    // Check if spawn position is valid
    if (!isValidPosition(board, matrix, spawn.x, spawn.y)) {
      // Game over
      activePiece = null;
      if (score > highScore) {
        highScore = score;
        setHighScore(highScore);
      }
      state = STATE_GAME_OVER;
      return;
    }

    activePiece = { type, x: spawn.x, y: spawn.y, rotation: 0 };
    dropTimer = 0;
    lockTimer = 0;
    holdLocked = false;
    ghostY = computeGhostY();
  }

  // --- Ghost Y ---
  function computeGhostY() {
    if (!activePiece) return 0;
    const matrix = getMatrix(activePiece.type, activePiece.rotation);
    let gy = activePiece.y;
    while (isValidPosition(board, matrix, activePiece.x, gy + 1)) {
      gy++;
    }
    return gy;
  }

  // --- Movement ---
  function tryMove(dx, dy) {
    if (!activePiece || state !== STATE_PLAYING) return false;
    const matrix = getMatrix(activePiece.type, activePiece.rotation);
    if (isValidPosition(board, matrix, activePiece.x + dx, activePiece.y + dy)) {
      activePiece.x += dx;
      activePiece.y += dy;
      ghostY = computeGhostY();
      // Reset lock delay on successful move
      if (dx !== 0 || dy > 0) {
        lockTimer = 0;
      }
      return true;
    }
    return false;
  }

  function moveDown() {
    if (!activePiece || state !== STATE_PLAYING) return false;
    const matrix = getMatrix(activePiece.type, activePiece.rotation);
    if (isValidPosition(board, matrix, activePiece.x, activePiece.y + 1)) {
      activePiece.y += 1;
      ghostY = computeGhostY();
      score += SOFT_DROP_SCORE;
      return true;
    }
    return false;
  }

  // --- Rotation ---
  function rotate(direction = 1) {
    if (!activePiece || state !== STATE_PLAYING) return false;
    const type = activePiece.type;
    if (type === 'O') return false; // O doesn't rotate
    const oldRot = activePiece.rotation;
    const newRot = (oldRot + direction + 4) % 4;
    const newMatrix = getMatrix(type, newRot);
    const kicks = getWallKicks(type);

    for (const [kx, ky] of kicks) {
      if (isValidPosition(board, newMatrix, activePiece.x + kx, activePiece.y - ky)) {
        activePiece.x += kx;
        activePiece.y -= ky;
        activePiece.rotation = newRot;
        ghostY = computeGhostY();
        lockTimer = 0; // reset lock delay on successful rotate
        return true;
      }
    }
    return false;
  }

  // --- Hard drop ---
  function hardDrop() {
    if (!activePiece || state !== STATE_PLAYING) return false;
    const matrix = getMatrix(activePiece.type, activePiece.rotation);
    let dy = 0;
    while (isValidPosition(board, matrix, activePiece.x, activePiece.y + dy + 1)) {
      dy++;
    }
    score += dy * HARD_DROP_SCORE;
    activePiece.y += dy;
    ghostY = computeGhostY();
    lockPieceNow();
    return true;
  }

  // --- Lock ---
  function lockPieceNow() {
    if (!activePiece) return;
    const matrix = getMatrix(activePiece.type, activePiece.rotation);
    const color = PIECE_COLORS[activePiece.type];
    lockPiece(board, matrix, activePiece.x, activePiece.y, color);

    const { count, rows } = clearLines(board);
    if (count > 0) {
      // Award score (multiplied by level)
      score += (LINE_SCORES[count] || 0) * level;
      lines += count;
      const newLevel = Math.floor(lines / LINES_PER_LEVEL) + 1;
      if (newLevel > level) {
        level = newLevel;
        levelUpFlash = LEVEL_UP_FLASH_DURATION;
      }

      // Start clear animation, then spawn after it finishes
      clearingRows = rows;
      clearAnimTimer = 0;
      activePiece = null;
      return;
    }

    activePiece = null;
    spawnPiece();
  }

  // --- Hold ---
  function doHold() {
    if (!activePiece || state !== STATE_PLAYING || holdLocked) return;
    const type = activePiece.type;

    if (holdPiece === null) {
      holdPiece = type;
      activePiece = null;
      spawnPiece();
    } else {
      const tmp = holdPiece;
      holdPiece = type;
      const spawn = getSpawnPosition(tmp);
      const matrix = getMatrix(tmp, 0);
      if (!isValidPosition(board, matrix, spawn.x, spawn.y)) {
        holdPiece = type; // revert
        return;
      }
      activePiece = { type: tmp, x: spawn.x, y: spawn.y, rotation: 0 };
      dropTimer = 0;
      lockTimer = 0;
      ghostY = computeGhostY();
    }
    holdLocked = true;
  }

  // --- Input buffering ---
  function queueCommand(cmd) {
    if (commandBuffer.length < 8) {
      commandBuffer.push(cmd);
    }
  }

  function processCommands() {
    while (commandBuffer.length > 0) {
      const cmd = commandBuffer.shift();
      switch (cmd) {
        case CMD_LEFT: tryMove(-1, 0); break;
        case CMD_RIGHT: tryMove(1, 0); break;
        case CMD_DOWN: moveDown(); break;
        case CMD_ROTATE_CW: rotate(1); break;
        case CMD_ROTATE_CCW: rotate(-1); break;
        case CMD_HARD_DROP: hardDrop(); break;
        case CMD_HOLD: doHold(); break;
      }
    }
  }

  // --- Tick ---
  function tick(dt) {
    if (state !== STATE_PLAYING) return;

    // Level-up flash countdown
    if (levelUpFlash > 0) {
      levelUpFlash = Math.max(0, levelUpFlash - dt);
    }

    // Handle clear animation
    if (clearingRows) {
      clearAnimTimer += dt;
      if (clearAnimTimer >= CLEAR_ANIM_DURATION) {
        clearingRows = null;
        clearAnimTimer = 0;
        // Spawn next piece after animation
        spawnPiece();
      }
      return; // pause gameplay during animation
    }

    processCommands();

    if (!activePiece) return;

    // Drop timer
    dropTimer += dt;
    const interval = DROP_INTERVALS[Math.min(level - 1, DROP_INTERVALS.length - 1)];
    if (dropTimer >= interval) {
      dropTimer = 0;
      const matrix = getMatrix(activePiece.type, activePiece.rotation);
      if (isValidPosition(board, matrix, activePiece.x, activePiece.y + 1)) {
        activePiece.y += 1;
        ghostY = computeGhostY();
      } else {
        lockTimer += interval;
        if (lockTimer >= LOCK_DELAY) {
          lockPieceNow();
        }
      }
    }
  }

  // --- State transitions ---
  function startGame() {
    board = createBoard();
    bag = [];
    nextQueue = [];
    holdPiece = null;
    holdLocked = false;
    score = 0;
    lines = 0;
    level = 1;
    dropTimer = 0;
    lockTimer = 0;
    clearingRows = null;
    clearAnimTimer = 0;
    levelUpFlash = 0;
    activePiece = null;
    state = STATE_PLAYING;
    spawnPiece();
  }

  function togglePause() {
    if (state === STATE_PLAYING) {
      state = STATE_PAUSED;
    } else if (state === STATE_PAUSED) {
      state = STATE_PLAYING;
    }
  }

  function goToMenu() {
    state = STATE_MENU;
    board = createBoard();
    activePiece = null;
    score = 0;
    lines = 0;
    level = 1;
    dropTimer = 0;
    lockTimer = 0;
  }

  // --- Public API ---
  function getState() {
    return {
      board,
      activePiece,
      ghostY,
      nextQueue: [...nextQueue],
      holdPiece,
      holdLocked,
      score,
      lines,
      level,
      state,
      highScore,
      clearingRows,
      levelUpFlash,
    };
  }

  return {
    getState,
    tick,
    startGame,
    togglePause,
    goToMenu,
    queueCommand,
  };
}
