import { Cell } from '../types';

export class PathFinder {
  /**
   * Checks if a cell is active (is present, not removed, and has a non-zero value).
   */
  static isActive(cell: Cell | undefined): boolean {
    if (!cell) return false;
    return !cell.removed && cell.value !== 0;
  }

  /**
   * Rule 1: Checks if two numbers are matchable (equal OR sum to 10).
   * Also ensures neither cell is removed or locked.
   */
  static canMatch(idxA: number, idxB: number, cells: Cell[]): boolean {
    if (idxA === idxB) {
      return false;
    }

    const cellA = cells[idxA];
    const cellB = cells[idxB];

    if (!cellA || !cellB) {
      return false;
    }

    // A cell that is removed or has value 0 is not matchable.
    if (cellA.removed || cellB.removed || cellA.value === 0 || cellB.value === 0) {
      return false;
    }

    // Locked cells cannot be matched.
    if (cellA.locked || cellB.locked) {
      return false;
    }

    const valA = cellA.value;
    const valB = cellB.value;

    return (valA === valB) || (valA + valB === 10);
  }

  /**
   * Rule 2: Checks if there is a valid unblocked path between two cells.
   * Path types allowed:
   * 1. Same row (horizontal)
   * 2. Same column (vertical)
   * 3. Diagonal (any length, must have no active cells on the straight diagonal path)
   * 4. 1D sequential wrapping (reading order from left-to-right, top-to-bottom, treating removed cells as transparent)
   */
  static canConnect(idxA: number, idxB: number, cells: Cell[], cols: number, showDebugLogs: boolean = false): boolean {
    if (idxA === idxB) return false;
    if (!cells[idxA] || !cells[idxB]) return false;

    const minIdx = Math.min(idxA, idxB);
    const maxIdx = Math.max(idxA, idxB);

    const r1 = Math.floor(minIdx / cols);
    const c1 = minIdx % cols;
    const r2 = Math.floor(maxIdx / cols);
    const c2 = maxIdx % cols;

    // --- 1. Same Row Check (Horizontal) ---
    if (r1 === r2) {
      let isBlocked = false;
      // Check all intermediate columns on the same row. Only active numbers block.
      for (let c = c1 + 1; c < c2; c++) {
        const checkIdx = r1 * cols + c;
        if (this.isActive(cells[checkIdx])) {
          isBlocked = true;
          break;
        }
      }
      if (!isBlocked) return true;
    }

    // --- 2. Same Column Check (Vertical) ---
    if (c1 === c2) {
      let isBlocked = false;
      // Check all intermediate rows in the same column. Only active numbers block.
      for (let r = r1 + 1; r < r2; r++) {
        const checkIdx = r * cols + c1;
        if (this.isActive(cells[checkIdx])) {
          isBlocked = true;
          break;
        }
      }
      if (!isBlocked) return true;
    }

    // --- 3. Straight Diagonal Check ---
    if (Math.abs(r1 - r2) === Math.abs(c1 - c2)) {
      const stepRow = 1; // Since minIdx has lower row than maxIdx, r1 < r2 is guaranteed
      const stepCol = c1 < c2 ? 1 : -1;
      let currRow = r1 + stepRow;
      let currCol = c1 + stepCol;
      let isBlocked = false;
      while (currRow !== r2) {
        const checkIdx = currRow * cols + currCol;
        if (this.isActive(cells[checkIdx])) {
          isBlocked = true;
          break;
        }
        currRow += stepRow;
        currCol += stepCol;
      }
      if (!isBlocked) return true;
    }

    // --- 4. 1D Sequential / Reading Order Check ---
    // If all cells between minIdx and maxIdx are inactive, they are consecutive in 1D reading order.
    let is1DBlocked = false;
    for (let idx = minIdx + 1; idx < maxIdx; idx++) {
      if (this.isActive(cells[idx])) {
        is1DBlocked = true;
        break;
      }
    }
    if (!is1DBlocked) return true;

    return false;
  }

  /**
   * Complete validation function: checks both matchability and connectivity.
   */
  static findPath(idxA: number, idxB: number, cells: Cell[], cols: number, showDebugLogs: boolean = false): boolean {
    // 1. Math match check
    if (!this.canMatch(idxA, idxB, cells)) {
      return false;
    }
    // 2. Path check
    const connected = this.canConnect(idxA, idxB, cells, cols, showDebugLogs);
    return connected;
  }
}
