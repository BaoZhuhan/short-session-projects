import {
  COLS, ROWS, CELL_SIZE, BOARD_WIDTH, BOARD_HEIGHT,
  PIECE_COLORS, GHOST_ALPHA,
  STATE_MENU, STATE_PLAYING, STATE_PAUSED, STATE_GAME_OVER,
} from './constants.js';
import { getMatrix } from './tetrominoes.js';

// Colors
const BG_COLOR = '#1a1a1a';
const GRID_LINE_COLOR = '#222';
const BORDER_COLOR = '#333';
const GHOST_STROKE = '#555';

export function createRenderer() {
  // Main board canvas
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  // Hold mini canvas
  const holdCanvas = document.getElementById('hold-canvas');
  const holdCtx = holdCanvas.getContext('2d');

  // Next mini canvas
  const nextCanvas = document.getElementById('next-canvas');
  const nextCtx = nextCanvas.getContext('2d');

  // DOM elements
  const scoreEl = document.getElementById('score-display');
  const linesEl = document.getElementById('lines-display');
  const levelEl = document.getElementById('level-display');
  const highEl = document.getElementById('high-display');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayMsg = document.getElementById('overlay-message');
  const controlsHelp = document.getElementById('controls-help');

  // Draw a single cell (with 3D bevel effect)
  function drawCell(context, x, y, size, color) {
    // Main fill
    context.fillStyle = color;
    context.fillRect(x, y, size, size);

    // Top-left highlight
    context.fillStyle = 'rgba(255,255,255,0.2)';
    context.fillRect(x, y, size, 2);
    context.fillRect(x, y, 2, size);

    // Bottom-right shadow
    context.fillStyle = 'rgba(0,0,0,0.3)';
    context.fillRect(x, y + size - 2, size, 2);
    context.fillRect(x + size - 2, y, 2, size);
  }

  // Draw a piece matrix at a given pixel position
  function drawPiece(context, matrix, px, py, cellSize, color, alpha = 1) {
    context.globalAlpha = alpha;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (!matrix[r][c]) continue;
        const drawX = px + c * cellSize;
        const drawY = py + r * cellSize;
        drawCell(context, drawX, drawY, cellSize, color);
      }
    }
    context.globalAlpha = 1;
  }

  // Draw ghost piece
  function drawGhost(context, matrix, px, py, cellSize, color) {
    context.globalAlpha = GHOST_ALPHA;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (!matrix[r][c]) continue;
        const drawX = px + c * cellSize;
        const drawY = py + r * cellSize;
        context.strokeStyle = GHOST_STROKE;
        context.lineWidth = 1;
        context.strokeRect(drawX + 0.5, drawY + 0.5, cellSize - 1, cellSize - 1);
        context.fillStyle = color;
        context.globalAlpha = 0.08;
        context.fillRect(drawX, drawY, cellSize, cellSize);
        context.globalAlpha = GHOST_ALPHA;
      }
    }
    context.globalAlpha = 1;
  }

  // Render a mini piece preview (for hold/next panels)
  function renderMiniPiece(context, canvasEl, type) {
    const cw = canvasEl.width;
    const ch = canvasEl.height;
    context.clearRect(0, 0, cw, ch);

    if (!type) return;

    const matrix = getMatrix(type, 0);
    const color = PIECE_COLORS[type];

    // Calculate non-empty bounds
    let minR = matrix.length, maxR = 0, minC = matrix[0].length, maxC = 0;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          minR = Math.min(minR, r);
          maxR = Math.max(maxR, r);
          minC = Math.min(minC, c);
          maxC = Math.max(maxC, c);
        }
      }
    }
    const pieceW = (maxC - minC + 1);
    const pieceH = (maxR - minR + 1);
    const cellSize = 20;
    const totalW = pieceW * cellSize;
    const totalH = pieceH * cellSize;
    const offsetX = Math.floor((cw - totalW) / 2);
    const offsetY = Math.floor((ch - totalH) / 2);

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        if (!matrix[r][c]) continue;
        const drawX = offsetX + (c - minC) * cellSize;
        const drawY = offsetY + (r - minR) * cellSize;
        drawCell(context, drawX, drawY, cellSize, color);
      }
    }
  }

  // Render the main board
  function renderBoard(state) {
    const { board, activePiece, ghostY, clearingRows } = state;

    // Clear
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    // Grid lines
    ctx.strokeStyle = GRID_LINE_COLOR;
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL_SIZE);
      ctx.lineTo(BOARD_WIDTH, r * CELL_SIZE);
      ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL_SIZE, 0);
      ctx.lineTo(c * CELL_SIZE, BOARD_HEIGHT);
      ctx.stroke();
    }

    // Locked cells
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c] !== null) {
          const isClearing = clearingRows && clearingRows.includes(r);
          if (isClearing) {
            // Flash white during clear animation
            ctx.fillStyle = '#fff';
            ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          } else {
            drawCell(ctx, c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, board[r][c]);
          }
        }
      }
    }

    // Ghost piece (only when playing)
    if (activePiece && state.state === STATE_PLAYING) {
      const matrix = getMatrix(activePiece.type, activePiece.rotation);
      const color = PIECE_COLORS[activePiece.type];
      drawGhost(ctx, matrix, activePiece.x * CELL_SIZE, ghostY * CELL_SIZE, CELL_SIZE, color);
    }

    // Active piece
    if (activePiece) {
      const matrix = getMatrix(activePiece.type, activePiece.rotation);
      const color = PIECE_COLORS[activePiece.type];
      drawPiece(ctx, matrix, activePiece.x * CELL_SIZE, activePiece.y * CELL_SIZE, CELL_SIZE, color);
    }

    // Level-up flash
    if (state.levelUpFlash > 0) {
      const alpha = Math.min(1, state.levelUpFlash / 400);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#f0a000';
      ctx.font = 'bold 28px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LEVEL UP', BOARD_WIDTH / 2, BOARD_HEIGHT / 2 - 10);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillText(`Level ${state.level}`, BOARD_WIDTH / 2, BOARD_HEIGHT / 2 + 20);
      ctx.restore();
    }

    // Border
    ctx.strokeStyle = BORDER_COLOR;
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
  }

  // Render everything
  function render(state) {
    renderBoard(state);

    // Side panels
    scoreEl.textContent = state.score.toLocaleString();
    linesEl.textContent = state.lines;
    levelEl.textContent = state.level;
    highEl.textContent = state.highScore.toLocaleString();

    // Hold piece
    renderMiniPiece(holdCtx, holdCanvas, state.holdPiece);

    // Next pieces (draw all 3 in the next canvas)
    nextCtx.fillStyle = '#111';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    const queue = state.nextQueue;
    const slotHeight = 90; // 3 slots, canvas is 300px tall
    for (let i = 0; i < queue.length && i < 3; i++) {
      const type = queue[i];
      if (!type) continue;
      const matrix = getMatrix(type, 0);
      const color = PIECE_COLORS[type];

      // Calculate bounds
      let minR = matrix.length, maxR = 0, minC = matrix[0].length, maxC = 0;
      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c]) {
            minR = Math.min(minR, r);
            maxR = Math.max(maxR, r);
            minC = Math.min(minC, c);
            maxC = Math.max(maxC, c);
          }
        }
      }
      const pieceW = (maxC - minC + 1);
      const pieceH = (maxR - minR + 1);
      const cellSize = 20;
      const totalW = pieceW * cellSize;
      const totalH = pieceH * cellSize;
      const offsetX = Math.floor((nextCanvas.width - totalW) / 2);
      const offsetY = i * slotHeight + Math.floor((slotHeight - totalH) / 2);

      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          if (!matrix[r][c]) continue;
          const drawX = offsetX + (c - minC) * cellSize;
          const drawY = offsetY + (r - minR) * cellSize;
          drawCell(nextCtx, drawX, drawY, cellSize, color);
        }
      }
    }

    // Overlay
    renderOverlay(state);
  }

  // Overlay (menu / pause / game-over)
  function renderOverlay(state) {
    const s = state.state;
    if (s === STATE_PLAYING) {
      overlay.classList.remove('visible');
      return;
    }

    overlay.classList.add('visible');

    if (s === STATE_MENU) {
      overlayTitle.textContent = 'TETRIS';
      overlayMsg.textContent = '按 Enter 开始游戏';
      controlsHelp.style.display = 'block';
    } else if (s === STATE_PAUSED) {
      overlayTitle.textContent = '已暂停';
      overlayMsg.textContent = '按 P 继续';
      controlsHelp.style.display = 'none';
    } else if (s === STATE_GAME_OVER) {
      overlayTitle.textContent = 'GAME OVER';
      overlayMsg.innerHTML = `得分: ${state.score.toLocaleString()}<br>消除: ${state.lines} 行<br>关卡: ${state.level}<br><br>按 Enter 重新开始`;
      controlsHelp.style.display = 'none';
    }
  }

  return { render };
}
