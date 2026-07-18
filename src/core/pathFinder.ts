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
    console.log(`🚨🚨🚨 [LOGIC-RUNNING-CONFIRMATION] PathFinder.canMatch() executado para idxA:${idxA}, idxB:${idxB}`);
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
   * 3. Diagonal adjacent (only when they are direct neighbor cells)
   * 4. 1D sequential wrapping (reading order from left-to-right, top-to-bottom)
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

    // --- 3. Diagonal Check (Any length, must have no active cells on the path) ---
    const rowDiff = Math.abs(r1 - r2);
    const colDiff = Math.abs(c1 - c2);
    if (rowDiff === colDiff) {
      let isBlocked = false;
      const dr = r2 > r1 ? 1 : -1;
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

    if (showDebugLogs) {
      console.log(`[PathFinder] Resultado: SEM CONEXÃO POSSÍVEL`);
    }
    return false;
  }

  /**
   * Complete validation function: checks both matchability and connectivity.
   */
  static findPath(idxA: number, idxB: number, cells: Cell[], cols: number, showDebugLogs: boolean = false): boolean {
    console.log(`🚨🚨🚨 [LOGIC-RUNNING-CONFIRMATION] PathFinder.findPath() chamado! idxA: ${idxA}, idxB: ${idxB}, valorA: ${cells[idxA]?.value}, valorB: ${cells[idxB]?.value}`);
    // 1. Math match check
    if (!this.canMatch(idxA, idxB, cells)) {
      console.log(`🚨🚨🚨 [LOGIC-RUNNING-CONFIRMATION] PathFinder.findPath() REJEITADO por canMatch`);
      return false;
    }
    // 2. Path check
    const connected = this.canConnect(idxA, idxB, cells, cols, showDebugLogs);
    console.log(`🚨🚨🚨 [LOGIC-RUNNING-CONFIRMATION] PathFinder.findPath() resultado da conexão: ${connected}`);
    return connected;
  }
}
