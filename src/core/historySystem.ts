import { Cell } from '../types';

export interface HistorySnapshot {
  cells: Cell[];
  score: number;
  combo: number;
  linesAddedCount: number;
  shufflesLeft: number;
  hintsLeft: number;
}

export class HistorySystem {
  private history: HistorySnapshot[] = [];
  
  saveState(state: HistorySnapshot) {
    this.history.push(JSON.parse(JSON.stringify(state)));
  }
  
  undo(): HistorySnapshot | null {
    if (this.history.length === 0) return null;
    return this.history.pop() || null;
  }
  
  canUndo(): boolean {
    return this.history.length > 0;
  }
  
  clear() {
    this.history = [];
  }
}
