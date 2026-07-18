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

    // --- 3. Diagonal Check (Any length, must have no active cells on the diagonal path) ---
    const rowDiff = Math.abs(r1 - r2);
    const colDiff = Math.abs(c1 - c2);
    if (rowDiff === colDiff) {
      let isBlocked = false;
      // Since minIdx < maxIdx, r1 is always <= r2. For a true diagonal rowDiff is > 0, so r1 < r2.
      const dr = 1;
      const dc = c2 > c1 ? 1 : -1;
      let blockerInfo = '';
      
      for (let step = 1; step < rowDiff; step++) {
        const r = r1 + step * dr;
        const c = c1 + step * dc;
        const checkIdx = r * cols + c;
        if (this.isActive(cells[checkIdx])) {
          isBlocked = true;
          blockerInfo = `idx:${checkIdx}, v:${cells[checkIdx].value}`;
          break;
        }
      }
      
      if (showDebugLogs) {
        console.log(`  - Caminho Diagonal (comprimento ${rowDiff}): ${isBlocked ? `BLOQUEADO por ${blockerInfo}` : 'LIVRE'}`);
      }
      if (!isBlocked) return true;
    }

    // --- 4. 1D Sequential / Wrapping Check ---
    let isBlocked1D = false;
    let blockerInfo1D = '';
    // Check all cells between the two indices in 1D reading order. Only active numbers block.
    for (let i = minIdx + 1; i < maxIdx; i++) {
      if (this.isActive(cells[i])) {
        isBlocked1D = true;
        blockerInfo1D = `idx:${i}, v:${cells[i].value}`;
        break;
      }
    }
    if (showDebugLogs) {
      console.log(`  - Caminho 1D Sequencial: ${isBlocked1D ? `BLOQUEADO por ${blockerInfo1D}` : 'LIVRE'}`);
    }
    if (!isBlocked1D) return true;

    // --- 5. 2D BFS Path Finder (Any multi-step path through empty/inactive cells) ---
    // If there is ANY connected path of empty/removed/inactive cells between idxA and idxB,
    // they are allowed to connect. Check all 8 directions (orthogonal + diagonal).
    const numRows = Math.ceil(cells.length / cols);
    const queue: number[] = [idxA];
    const visited = new Set<number>([idxA]);
    let foundPath = false;

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === idxB) {
        foundPath = true;
        break;
      }

      const r = Math.floor(current / cols);
      const c = current % cols;

      const directions = [
        [-1, 0], [1, 0], [0, -1], [0, 1],       // Orthogonal
        [-1, -1], [-1, 1], [1, -1], [1, 1]      // Diagonal
      ];

      for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < numRows && nc >= 0 && nc < cols) {
          const neighborIdx = nr * cols + nc;
          if (neighborIdx < cells.length && !visited.has(neighborIdx)) {
            // Can traverse if it is the target B OR if it is an empty/removed/inactive cell
            if (neighborIdx === idxB || !this.isActive(cells[neighborIdx])) {
              visited.add(neighborIdx);
              queue.push(neighborIdx);
            }
          }
        }
      }
    }

    if (showDebugLogs) {
      console.log(`  - Caminho Livre por Espaços Vazios (BFS): ${foundPath ? 'LIVRE' : 'BLOQUEADO'}`);
    }
    if (foundPath) return true;

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
