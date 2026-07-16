import { Cell } from '../types';

export class PathFinder {
  static findPath(idxA: number, idxB: number, cells: Cell[], cols: number): boolean {
    if (idxA === idxB) return false;
    if (!cells[idxA] || !cells[idxB]) return false;
    if (cells[idxA].removed || cells[idxB].removed) return false;

    const minIdx = Math.min(idxA, idxB);
    const maxIdx = Math.max(idxA, idxB);

    const queue: number[] = [minIdx];
    const visited = new Set<number>([minIdx]);
    
    // We allow moving up, down, left, right through cells where removed === true or value === 0
    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr === maxIdx) return true;
      
      const cr = Math.floor(curr / cols);
      const cc = curr % cols;
      
      const neighbors = [];
      // Up
      if (cr > 0) neighbors.push(curr - cols);
      // Down
      if (cr < Math.floor((cells.length - 1) / cols)) neighbors.push(curr + cols);
      // Left
      if (cc > 0) neighbors.push(curr - 1);
      // Right
      if (cc < cols - 1) neighbors.push(curr + 1);
      
      for (const n of neighbors) {
        if (!visited.has(n)) {
          if (n === maxIdx || cells[n].removed || cells[n].value === 0) {
            visited.add(n);
            queue.push(n);
          }
        }
      }
    }
    
    return false;
  }
}
