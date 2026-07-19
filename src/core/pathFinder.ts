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
   * Rule 2 & 3: Checks if there is a valid path between two cells using BFS.
   * Empty cells (not active) are completely transparent and do not block.
   * Only active numbers block.
   */
  static canConnect(idxA: number, idxB: number, cells: Cell[], cols: number, showDebugLogs: boolean = false): boolean {
    if (idxA === idxB) return false;
    if (!cells[idxA] || !cells[idxB]) return false;

    // BFS to find a path from idxA to idxB through non-active/empty cells
    const visited = new Uint8Array(cells.length);
    const queue: number[] = [idxA];
    visited[idxA] = 1;

    let head = 0;
    while (head < queue.length) {
      const u = queue[head++];

      if (u === idxB) {
        if (showDebugLogs) {
          console.log(`[PathFinder] Path found between ${idxA} and ${idxB}`);
        }
        return true;
      }

      // Find neighbors
      const neighbors: number[] = [];

      // Grid position of u
      const r = Math.floor(u / cols);
      const c = u % cols;

      // 1. Orthogonal directions
      // Left
      if (c > 0) neighbors.push(u - 1);
      // Right
      if (c < cols - 1) neighbors.push(u + 1);
      // Up
      if (r > 0) neighbors.push(u - cols);
      // Down
      if (u + cols < cells.length) neighbors.push(u + cols);

      // 2. Diagonal directions
      // Up-Left
      if (r > 0 && c > 0) neighbors.push(u - cols - 1);
      // Up-Right
      if (r > 0 && c < cols - 1) neighbors.push(u - cols + 1);
      // Down-Left
      if (u + cols < cells.length && c > 0) neighbors.push(u + cols - 1);
      // Down-Right
      if (u + cols < cells.length && c < cols - 1) neighbors.push(u + cols + 1);

      // 3. 1D sequential reading order wrapping
      if (u > 0) neighbors.push(u - 1);
      if (u < cells.length - 1) neighbors.push(u + 1);

      for (let i = 0; i < neighbors.length; i++) {
        const v = neighbors[i];
        
        // Prevent out of bounds
        if (v < 0 || v >= cells.length) continue;
        if (visited[v]) continue;

        // Target cell can always be reached, regardless of whether it's active
        if (v === idxB) {
          return true;
        }

        // Only move to empty/inactive cells
        if (!this.isActive(cells[v])) {
          visited[v] = 1;
          queue.push(v);
        }
      }
    }

    if (showDebugLogs) {
      console.log(`[PathFinder] No path found between ${idxA} and ${idxB}`);
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
    return this.canConnect(idxA, idxB, cells, cols, showDebugLogs);
  }
}
