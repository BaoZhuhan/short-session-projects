// Piece types
export const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

// Base shape matrices (spawn orientation)
const SHAPES = {
  I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  O: [[1,1],[1,1]],
  T: [[0,1,0],[1,1,1],[0,0,0]],
  S: [[0,1,1],[1,1,0],[0,0,0]],
  Z: [[1,1,0],[0,1,1],[0,0,0]],
  J: [[1,0,0],[1,1,1],[0,0,0]],
  L: [[0,0,1],[1,1,1],[0,0,0]],
};

// Spawn column offsets (centered)
const SPAWN_X = {
  I: 3, O: 4, T: 3, S: 3, Z: 3, J: 3, L: 3,
};

// Rotate a matrix 90° clockwise
function rotateCW(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result = [];
  for (let c = 0; c < cols; c++) {
    result[c] = [];
    for (let r = rows - 1; r >= 0; r--) {
      result[c].push(matrix[r][c]);
    }
  }
  return result;
}

// Precompute all 4 rotation states for each piece
export const ROTATIONS = {};
for (const type of PIECE_TYPES) {
  ROTATIONS[type] = [SHAPES[type]];
  for (let i = 1; i < 4; i++) {
    ROTATIONS[type][i] = rotateCW(ROTATIONS[type][i - 1]);
  }
}

// Spawn position for a piece type
export function getSpawnPosition(type) {
  return { x: SPAWN_X[type], y: 0 };
}

// Wall kick offsets (SRS simplified)
// Tests each offset in order; first valid one wins
const WALL_KICKS_DEFAULT = [
  [0, 0], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1],
];

const WALL_KICKS_I = [
  [0, 0], [-2, 0], [2, 0], [-1, 0], [1, 0], [0, -1], [0, -2],
];

// Get wall kick table for a piece type
export function getWallKicks(type) {
  return type === 'I' ? WALL_KICKS_I : WALL_KICKS_DEFAULT;
}

// Get the shape matrix for a given rotation
export function getMatrix(type, rotation) {
  return ROTATIONS[type][rotation % 4];
}
