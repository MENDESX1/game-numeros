import { Cell } from '../types';

export class PathFinder {
  /**
   * Helper to check if a cell is active (not removed and has non-zero value).
   */
  static isActive(cell: Cell | undefined): boolean {
    if (!cell) return false;
    return !cell.removed && cell.value !== 0;
  }

  /**
   * Main validation logic for Number Match.
   * Checks if two cells are matchable (equal or sum to 10)
   * and if there is a valid unblocked path between them.
   */
  static canConnect(idxA: number, idxB: number, cells: Cell[], cols: number): boolean {
    if (idxA === idxB) return false;
    if (!cells[idxA] || !cells[idxB]) return false;
    if (cells[idxA].removed || cells[idxB].removed) return false;
    if (cells[idxA].locked || cells[idxB].locked) return false;

    const valA = cells[idxA].value;
    const valB = cells[idxB].value;

    // Rule 1: Two numbers can be removed only if they are equal or sum to 10.
    const isMatchable = (valA === valB) || (valA + valB === 10);
    if (!isMatchable) return false;

    const r1 = Math.floor(idxA / cols);
    const c1 = idxA % cols;
    const r2 = Math.floor(idxB / cols);
    const c2 = idxB % cols;

    // We will track details of checks for debugging logs if everything fails
    const blocks: string[] = [];

    // 1. Same row check (horizontal) - empty/removed cells do not block
    if (r1 === r2) {
      const minCol = Math.min(c1, c2);
      const maxCol = Math.max(c1, c2);
      let blocked = false;
      const blockedCells: string[] = [];
      for (let c = minCol + 1; c < maxCol; c++) {
        const idx = r1 * cols + c;
        if (this.isActive(cells[idx])) {
          blocked = true;
          blockedCells.push(`Row ${r1} Col ${c} (val: ${cells[idx].value})`);
        }
      }
      if (!blocked) {
        return true;
      } else {
        blocks.push(`Horizontal path blocked by: [${blockedCells.join(', ')}]`);
      }
    }

    // 2. Same column check (vertical) - empty/removed cells do not block
    if (c1 === c2) {
      const minRow = Math.min(r1, r2);
      const maxRow = Math.max(r1, r2);
      let blocked = false;
      const blockedCells: string[] = [];
      for (let r = minRow + 1; r < maxRow; r++) {
        const idx = r * cols + c1;
        if (this.isActive(cells[idx])) {
          blocked = true;
          blockedCells.push(`Row ${r} Col ${c1} (val: ${cells[idx].value})`);
        }
      }
      if (!blocked) {
        return true;
      } else {
        blocks.push(`Vertical path blocked by: [${blockedCells.join(', ')}]`);
      }
    }

    // 3. Diagonal adjacent check (directly adjacent diagonally - neighbor cells only)
    const isDiagonalAdjacent = Math.abs(r1 - r2) === 1 && Math.abs(c1 - c2) === 1;
    if (isDiagonalAdjacent) {
      return true;
    } else if (Math.abs(r1 - r2) === Math.abs(c1 - c2)) {
      blocks.push(`Diagonal path checked but they are not adjacent neighbors (Row diff: ${Math.abs(r1 - r2)}, Col diff: ${Math.abs(c1 - c2)})`);
    }

    // 4. Linear 1D sequential check (allows wrapping across rows sequentially)
    const minIdx = Math.min(idxA, idxB);
    const maxIdx = Math.max(idxA, idxB);
    let blocked1D = false;
    const blockedCells1D: string[] = [];
    for (let i = minIdx + 1; i < maxIdx; i++) {
      if (this.isActive(cells[i])) {
        blocked1D = true;
        const row = Math.floor(i / cols);
        const col = i % cols;
        blockedCells1D.push(`Index ${i} [Row ${row} Col ${col}] (val: ${cells[i].value})`);
        break;
      }
    }
    if (!blocked1D) {
      return true;
    } else {
      blocks.push(`1D flat sequential path blocked by: ${blockedCells1D[0]}`);
    }

    // If we reached here, the matchable pair is blocked.
    // As requested: print detailed debugging logs whenever a pair is considered invalid/blocked.
    console.warn(`[LogicMatch Debug] Invalid Connection detected for matching values (${valA} and ${valB}):`);
    console.warn(`  - Pos 1: Index ${idxA} (Row ${r1}, Col ${c1})`);
    console.warn(`  - Pos 2: Index ${idxB} (Row ${r2}, Col ${c2})`);
    console.warn(`  - Checked paths result:`);
    blocks.forEach(b => console.warn(`    * ${b}`));
    console.warn(`  - Verdict: BLOCKED. Only active numbers block paths; empty cells never block.`);

    return false;
  }

  static findPath(idxA: number, idxB: number, cells: Cell[], cols: number): boolean {
    return this.canConnect(idxA, idxB, cells, cols);
  }
}


