import { Cell } from '../types';

export class PathFinder {
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

    // Rule 1: Two numbers can be removed only if they are equal or sum to 10.
    const valA = cells[idxA].value;
    const valB = cells[idxB].value;
    const isMatchable = (valA === valB) || (valA + valB === 10);
    if (!isMatchable) return false;

    // Rule 2: Path check
    const r1 = Math.floor(idxA / cols);
    const c1 = idxA % cols;
    const r2 = Math.floor(idxB / cols);
    const c2 = idxB % cols;

    // 1. Same row check (horizontal) - empty/removed cells do not block
    if (r1 === r2) {
      const minCol = Math.min(c1, c2);
      const maxCol = Math.max(c1, c2);
      let blocked = false;
      for (let c = minCol + 1; c < maxCol; c++) {
        const idx = r1 * cols + c;
        if (cells[idx] && !cells[idx].removed) {
          blocked = true;
          break;
        }
      }
      if (!blocked) return true;
    }

    // 2. Same column check (vertical) - empty/removed cells do not block
    if (c1 === c2) {
      const minRow = Math.min(r1, r2);
      const maxRow = Math.max(r1, r2);
      let blocked = false;
      for (let r = minRow + 1; r < maxRow; r++) {
        const idx = r * cols + c1;
        if (cells[idx] && !cells[idx].removed) {
          blocked = true;
          break;
        }
      }
      if (!blocked) return true;
    }

    // 3. Diagonal adjacent check (directly adjacent diagonally - neighbor cells only)
    if (Math.abs(r1 - r2) === 1 && Math.abs(c1 - c2) === 1) {
      return true;
    }

    // 4. Linear 1D sequential check (allows wrapping across rows sequentially)
    const minIdx = Math.min(idxA, idxB);
    const maxIdx = Math.max(idxA, idxB);
    let blocked1D = false;
    for (let i = minIdx + 1; i < maxIdx; i++) {
      if (cells[i] && !cells[i].removed) {
        blocked1D = true;
        break;
      }
    }
    if (!blocked1D) return true;

    return false;
  }

  static findPath(idxA: number, idxB: number, cells: Cell[], cols: number): boolean {
    return this.canConnect(idxA, idxB, cells, cols);
  }
}


