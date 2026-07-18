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
   * 3. Diagonal adjacent (only when they are direct neighbor cells)
   * 4. 1D sequential wrapping (reading order from left-to-right, top-to-bottom)
   */
  static canConnect(idxA: number, idxB: number, cells: Cell[], cols: number): boolean {
    if (idxA === idxB) return false;
    if (!cells[idxA] || !cells[idxB]) return false;

    const r1 = Math.floor(idxA / cols);
    const c1 = idxA % cols;
    const r2 = Math.floor(idxB / cols);
    const c2 = idxB % cols;

    const valA = cells[idxA].value;
    const valB = cells[idxB].value;

    // Detailed debug trackers
    const debugInfo: {
      pathType: string;
      blockedBy?: { idx: number; row: number; col: number; val: number }[];
      status: 'unblocked' | 'blocked' | 'not-applicable';
      details?: string;
    }[] = [];

    // --- 1. Same Row Check (Horizontal) ---
    if (r1 === r2) {
      const minCol = Math.min(c1, c2);
      const maxCol = Math.max(c1, c2);
      const blocks: { idx: number; row: number; col: number; val: number }[] = [];

      for (let c = minCol + 1; c < maxCol; c++) {
        const checkIdx = r1 * cols + c;
        const cell = cells[checkIdx];
        if (this.isActive(cell)) {
          blocks.push({ idx: checkIdx, row: r1, col: c, val: cell.value });
        }
      }

      if (blocks.length === 0) {
        return true; // Path is completely clear!
      } else {
        debugInfo.push({
          pathType: 'Horizontal (Same Row)',
          blockedBy: blocks,
          status: 'blocked',
          details: `Blocked by active numbers between col ${minCol} and ${maxCol} on Row ${r1}`
        });
      }
    } else {
      debugInfo.push({
        pathType: 'Horizontal (Same Row)',
        status: 'not-applicable',
        details: `Cells are in different rows (Row ${r1} vs Row ${r2})`
      });
    }

    // --- 2. Same Column Check (Vertical) ---
    if (c1 === c2) {
      const minRow = Math.min(r1, r2);
      const maxRow = Math.max(r1, r2);
      const blocks: { idx: number; row: number; col: number; val: number }[] = [];

      for (let r = minRow + 1; r < maxRow; r++) {
        const checkIdx = r * cols + c1;
        const cell = cells[checkIdx];
        if (this.isActive(cell)) {
          blocks.push({ idx: checkIdx, row: r, col: c1, val: cell.value });
        }
      }

      if (blocks.length === 0) {
        return true; // Path is completely clear!
      } else {
        debugInfo.push({
          pathType: 'Vertical (Same Column)',
          blockedBy: blocks,
          status: 'blocked',
          details: `Blocked by active numbers between row ${minRow} and ${maxRow} on Col ${c1}`
        });
      }
    } else {
      debugInfo.push({
        pathType: 'Vertical (Same Column)',
        status: 'not-applicable',
        details: `Cells are in different columns (Col ${c1} vs Col ${c2})`
      });
    }

    // --- 3. Diagonal Adjacent Check (Only direct neighbors) ---
    const rowDiff = Math.abs(r1 - r2);
    const colDiff = Math.abs(c1 - c2);
    const isDiagonalAdjacent = (rowDiff === 1 && colDiff === 1);

    if (isDiagonalAdjacent) {
      return true; // Direct diagonal neighbors are always unblocked
    } else if (rowDiff === colDiff) {
      debugInfo.push({
        pathType: 'Diagonal Adjacent',
        status: 'blocked',
        details: `Cells are diagonal but not adjacent neighbors (Row diff: ${rowDiff}, Col diff: ${colDiff})`
      });
    } else {
      debugInfo.push({
        pathType: 'Diagonal Adjacent',
        status: 'not-applicable',
        details: `Cells are not on a diagonal line (Row diff: ${rowDiff}, Col diff: ${colDiff})`
      });
    }

    // --- 4. 1D Sequential / Wrapping Check ---
    const minIdx = Math.min(idxA, idxB);
    const maxIdx = Math.max(idxA, idxB);
    const blocks1D: { idx: number; row: number; col: number; val: number }[] = [];

    for (let i = minIdx + 1; i < maxIdx; i++) {
      const cell = cells[i];
      if (this.isActive(cell)) {
        blocks1D.push({
          idx: i,
          row: Math.floor(i / cols),
          col: i % cols,
          val: cell.value
        });
      }
    }

    if (blocks1D.length === 0) {
      return true; // 1D flat path is completely clear (all cells between them are empty)
    } else {
      debugInfo.push({
        pathType: '1D Sequential Wrapping',
        blockedBy: blocks1D,
        status: 'blocked',
        details: `Blocked by active cells in 1D reading order: ${blocks1D.map(b => `${b.val} at [Row ${b.row}, Col ${b.col}]`).join(', ')}`
      });
    }

    // If we reached here, no valid path was found.
    // Log the details to the console as requested for debugging:
    console.groupCollapsed(`[NumberMatch Debug] Connection BLOCKED for pair: (${valA} and ${valB})`);
    console.log(`- Primeiro número: Valor ${valA} no Índice ${idxA} [Row ${r1}, Col ${c1}]`);
    console.log(`- Segundo número: Valor ${valB} no Índice ${idxB} [Row ${r2}, Col ${c2}]`);
    console.log(`- Caminhos analisados:`);
    debugInfo.forEach(info => {
      console.log(`  * [${info.pathType}]: ${info.status.toUpperCase()}`);
      if (info.details) console.log(`    Detalhe: ${info.details}`);
      if (info.blockedBy && info.blockedBy.length > 0) {
        console.log(`    Célula(s) de bloqueio:`, info.blockedBy);
      }
    });
    console.groupEnd();

    return false;
  }

  /**
   * Complete validation function: checks both matchability and connectivity.
   */
  static findPath(idxA: number, idxB: number, cells: Cell[], cols: number): boolean {
    // 1. Math match check
    if (!this.canMatch(idxA, idxB, cells)) {
      return false;
    }
    // 2. Path check
    return this.canConnect(idxA, idxB, cells, cols);
  }
}
