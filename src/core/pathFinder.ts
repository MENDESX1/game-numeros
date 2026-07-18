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

    if (showDebugLogs) {
      console.log(`[PathFinder] Verificando conexão: A(idx:${idxA}, v:${cells[idxA].value}, r:${Math.floor(idxA / cols)}, c:${idxA % cols}) -> B(idx:${idxB}, v:${cells[idxB].value}, r:${Math.floor(idxB / cols)}, c:${idxB % cols})`);
    }

    // --- 1. Same Row Check (Horizontal) ---
    if (r1 === r2) {
      let isBlocked = false;
      let blockerInfo = '';
      // Check all intermediate columns on the same row. Only active numbers block.
      for (let c = c1 + 1; c < c2; c++) {
        const checkIdx = r1 * cols + c;
        if (this.isActive(cells[checkIdx])) {
          isBlocked = true;
          blockerInfo = `idx:${checkIdx}, v:${cells[checkIdx].value}`;
          break;
        }
      }
      if (showDebugLogs) {
        console.log(`  - Caminho Horizontal: ${isBlocked ? `BLOQUEADO por ${blockerInfo}` : 'LIVRE'}`);
      }
      if (!isBlocked) return true;
    }

    // --- 2. Same Column Check (Vertical) ---
    if (c1 === c2) {
      let isBlocked = false;
      let blockerInfo = '';
      // Check all intermediate rows in the same column. Only active numbers block.
      for (let r = r1 + 1; r < r2; r++) {
        const checkIdx = r * cols + c1;
        if (this.isActive(cells[checkIdx])) {
          isBlocked = true;
          blockerInfo = `idx:${checkIdx}, v:${cells[checkIdx].value}`;
          break;
        }
      }
      if (showDebugLogs) {
        console.log(`  - Caminho Vertical: ${isBlocked ? `BLOQUEADO por ${blockerInfo}` : 'LIVRE'}`);
      }
      if (!isBlocked) return true;
    }

    // --- 3. Removed Diagonal, 1D, and BFS path logic due to user rules. ---

    if (showDebugLogs) {
      console.log(`[PathFinder] Resultado: SEM CONEXÃO POSSÍVEL`);
    }
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
