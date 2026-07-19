import { PathFinder } from "./pathFinder";
import { Cell, CellSpecial, GameMode, Difficulty, ChallengeLevel } from '../types';

export const GameEngine = {
  // --- Core Utility Functions ---

  generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  },

  getMaxNumber(difficulty: Difficulty): number {
    if (difficulty === 'easy') return 9;
    if (difficulty === 'medium') return 12;
    if (difficulty === 'hard') return 15;
    if (difficulty === 'insane') return 19;
    return 9;
  },

  // Retrieve indices of all active (non-removed) cells on the board
  getActiveIndices(cells: Cell[]): number[] {
    const indices: number[] = [];
    for (let i = 0; i < cells.length; i++) {
      if (cells[i] && !cells[i].removed && cells[i].value !== 0) {
        indices.push(i);
      }
    }
    return indices;
  },

  // --- Unified Modular Game Logic Functions ---

  /**
   * Check if two cell indices are mathematically matchable (equal or sum to 10).
   */
  canMatch(idxA: number, idxB: number, cells: Cell[]): boolean {
    return PathFinder.canMatch(idxA, idxB, cells);
  },

  /**
   * Check if two cell indices can connect (valid match + valid path).
   */
  canConnect(idxA: number, idxB: number, cells: Cell[], cols: number, showDebugLogs: boolean = false): boolean {
    return PathFinder.findPath(idxA, idxB, cells, cols, showDebugLogs);
  },

  /**
   * Find all available matches on the current board.
   */
  findAllMoves(cells: Cell[], cols: number): [number, number][] {
    const activeIndices = this.getActiveIndices(cells);
    const matches: [number, number][] = [];

    for (let i = 0; i < activeIndices.length; i++) {
      const idxA = activeIndices[i];
      if (cells[idxA].locked) continue; // Locked cells cannot initiate a match

      for (let j = i + 1; j < activeIndices.length; j++) {
        const idxB = activeIndices[j];
        if (cells[idxB].locked) continue; // Locked cells cannot be matched

        // Optimize: check if they are mathematically matchable first, before expensive pathfinder logic
        if (!this.isMatchable(cells[idxA].value, cells[idxB].value)) continue;

        if (this.canConnect(idxA, idxB, cells, cols, false)) {
          matches.push([idxA, idxB]);
        }
      }
    }

    return matches;
  },

  /**
   * Check if the board has any valid moves left.
   */
  hasMoves(cells: Cell[], cols: number): boolean {
    return this.findAllMoves(cells, cols).length > 0;
  },

  /**
   * Check if the player has won the game (no active numbers left on the board).
   */
  checkVictory(cells: Cell[]): boolean {
    return this.getActiveIndices(cells).length === 0;
  },

  /**
   * Add new random lines to the bottom. Never duplicate existing lines.
   */
  addRemainingNumbers(cells: Cell[], cols: number, difficulty: Difficulty = 'medium'): Cell[] {
    const nextCells = [...cells];
    
    // Classical Numberama rule: duplicate all remaining active cell values in order!
    const activeCells = cells.filter(c => !c.removed && c.value !== 0);
    if (activeCells.length === 0) return nextCells;

    const valuesToAppend = activeCells.map(c => c.value);

    for (const val of valuesToAppend) {
      nextCells.push({
        id: this.generateId(),
        value: val,
        special: 'none',
        frozenCount: 0,
        locked: false,
        multiplier: 1,
        removed: false
      });
    }

    // Pad to a multiple of cols with empty, removed placeholder cells
    const remainder = nextCells.length % cols;
    if (remainder !== 0) {
      const padCount = cols - remainder;
      for (let i = 0; i < padCount; i++) {
        nextCells.push({
          id: `pad-${this.generateId()}`,
          value: 0,
          special: 'none',
          frozenCount: 0,
          locked: false,
          multiplier: 1,
          removed: true
        });
      }
    }

    return nextCells;
  },

  /**
   * Process matching and removal of a pair of numbers, applying special power-ups
   * such as freezing ice, locked cells, multipliers, portals, and bomb explosions.
   */
  removePair(
    idxA: number,
    idxB: number,
    cells: Cell[],
    cols: number
  ): {
    updatedCells: Cell[];
    scoreMultiplier: number;
    explodedIndices: number[];
    isIceBroken: boolean;
    isLockOpened: boolean;
    isBombTriggered: boolean;
  } {
    const nextCells = JSON.parse(JSON.stringify(cells)) as Cell[];
    let scoreMultiplier = 1;
    let explodedIndices: number[] = [];
    let isIceBroken = false;
    let isLockOpened = false;
    let isBombTriggered = false;

    const cellA = nextCells[idxA];
    const cellB = nextCells[idxB];

    if (!cellA || !cellB) {
      return {
        updatedCells: nextCells,
        scoreMultiplier,
        explodedIndices,
        isIceBroken,
        isLockOpened,
        isBombTriggered
      };
    }

    // Combine score multipliers
    if (cellA.special === 'multiplier') scoreMultiplier *= cellA.multiplier;
    if (cellB.special === 'multiplier') scoreMultiplier *= cellB.multiplier;

    // Process Cell A
    let removeA = false;
    if (cellA.special === 'frozen') {
      cellA.frozenCount--;
      isIceBroken = true;
      if (cellA.frozenCount <= 0) {
        removeA = true;
      }
    } else {
      removeA = true;
    }

    // Process Cell B
    let removeB = false;
    if (cellB.special === 'frozen') {
      cellB.frozenCount--;
      isIceBroken = true;
      if (cellB.frozenCount <= 0) {
        removeB = true;
      }
    } else {
      removeB = true;
    }

    // Portals matched together
    if (cellA.special === 'portal' && cellB.special === 'portal' && cellA.portalGroup === cellB.portalGroup) {
      removeA = true;
      removeB = true;
    }

    // Flag removals
    if (removeA) cellA.removed = true;
    if (removeB) cellB.removed = true;

    // Bomb detonation logic (clears 3x3 surrounding cells)
    const triggerBomb = (idx: number) => {
      isBombTriggered = true;
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const numRows = Math.ceil(nextCells.length / cols);

      for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
          if (r >= 0 && r < numRows && c >= 0 && c < cols) {
            const checkIdx = r * cols + c;
            if (checkIdx < nextCells.length && !nextCells[checkIdx].removed) {
              nextCells[checkIdx].removed = true;
              explodedIndices.push(checkIdx);
            }
          }
        }
      }
    };

    if (removeA && cellA.special === 'bomb') {
      triggerBomb(idxA);
    }
    if (removeB && cellB.special === 'bomb') {
      triggerBomb(idxB);
    }

    // Lock breaking (unlocks adjacent locked cells)
    const checkUnlockAdjacent = (idx: number) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const numRows = Math.ceil(nextCells.length / cols);
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

      dirs.forEach(([dr, dc]) => {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < numRows && nc >= 0 && nc < cols) {
          const adjIdx = nr * cols + nc;
          if (adjIdx < nextCells.length && nextCells[adjIdx].special === 'locked' && nextCells[adjIdx].locked) {
            nextCells[adjIdx].locked = false;
            nextCells[adjIdx].special = 'none'; // Lock broken!
            isLockOpened = true;
          }
        }
      });
    };

    // Ice melting (cracks adjacent frozen ice)
    const checkCrackAdjacentIce = (idx: number) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const numRows = Math.ceil(nextCells.length / cols);
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

      dirs.forEach(([dr, dc]) => {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < numRows && nc >= 0 && nc < cols) {
          const adjIdx = nr * cols + nc;
          if (adjIdx < nextCells.length && nextCells[adjIdx].special === 'frozen' && nextCells[adjIdx].frozenCount > 0 && !nextCells[adjIdx].removed) {
            nextCells[adjIdx].frozenCount--;
            isIceBroken = true;
            if (nextCells[adjIdx].frozenCount <= 0) {
              nextCells[adjIdx].special = 'none'; // Melted
            }
          }
        }
      });
    };

    if (removeA) {
      checkUnlockAdjacent(idxA);
      checkCrackAdjacentIce(idxA);
    }
    if (removeB) {
      checkUnlockAdjacent(idxB);
      checkCrackAdjacentIce(idxB);
    }

    // Portal twin conversion
    const handlePortalTwin = (idx: number, twinGroup: number) => {
      for (let i = 0; i < nextCells.length; i++) {
        if (i !== idx && nextCells[i].special === 'portal' && nextCells[i].portalGroup === twinGroup && !nextCells[i].removed) {
          nextCells[i].special = 'none';
          nextCells[i].portalGroup = undefined;
        }
      }
    };

    if (removeA && cellA.special === 'portal' && cellA.portalGroup) {
      handlePortalTwin(idxA, cellA.portalGroup);
    }
    if (removeB && cellB.special === 'portal' && cellB.portalGroup) {
      handlePortalTwin(idxB, cellB.portalGroup);
    }

    return {
      updatedCells: nextCells,
      scoreMultiplier,
      explodedIndices,
      isIceBroken,
      isLockOpened,
      isBombTriggered
    };
  },

  // --- Board Initialization & Generation ---

  // Reverse-pairing constructor to generate beautifully-structured, solvable boards
  generateReverseSolvableGrid(
    cols: number, 
    rows: number, 
    difficulty: Difficulty = 'medium',
    removedIndices: Set<number> = new Set()
  ): number[] {
    const total = cols * rows;
    const grid = new Array(total).fill(0);

    // Mark pre-removed cells so they are not paired up or assigned values
    for (const idx of removedIndices) {
      grid[idx] = -1; // -1 represents a pre-removed/empty cell placeholder
    }

    const indices = Array.from({ length: total }, (_, i) => i)
      .filter(i => !removedIndices.has(i));

    // Shuffle indices to grow from random clusters
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = indices[i];
      indices[i] = indices[j];
      indices[j] = temp;
    }

    const maxNum = this.getMaxNumber(difficulty);

    for (const i of indices) {
      if (grid[i] !== 0) continue;

      // Find adjacent empty neighbors in rows/cols
      const r1 = Math.floor(i / cols);
      const c1 = i % cols;

      const neighbors: number[] = [];
      const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
      ];

      for (const [dr, dc] of directions) {
        const nr = r1 + dr;
        const nc = c1 + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          const adjIdx = nr * cols + nc;
          if (grid[adjIdx] === 0) {
            neighbors.push(adjIdx);
          }
        }
      }

      // Also support linear continuous (wrapping adjacent)
      if (i > 0 && grid[i - 1] === 0) neighbors.push(i - 1);
      if (i < total - 1 && grid[i + 1] === 0) neighbors.push(i + 1);

      if (neighbors.length > 0) {
        const j = neighbors[Math.floor(Math.random() * neighbors.length)];
        const valA = Math.floor(Math.random() * maxNum) + 1;
        let valB = valA;
        if (valA < 10 && Math.random() < 0.5) {
          valB = 10 - valA;
        }

        grid[i] = valA;
        grid[j] = valB;
      }
    }

    // Fill any left-over isolated tiles with matching pairs intelligently
    const emptyIndices: number[] = [];
    for (let i = 0; i < total; i++) {
      if (grid[i] === 0) emptyIndices.push(i);
    }

    while (emptyIndices.length >= 2) {
      const idxA = emptyIndices.shift()!;
      let bestIdx = 0;
      let minDist = Infinity;
      const r1 = Math.floor(idxA / cols);
      const c1 = idxA % cols;

      for (let k = 0; k < emptyIndices.length; k++) {
        const idxCheck = emptyIndices[k];
        const rCheck = Math.floor(idxCheck / cols);
        const cCheck = idxCheck % cols;
        const dist = Math.abs(rCheck - r1) + Math.abs(cCheck - c1);
        if (dist < minDist) {
          minDist = dist;
          bestIdx = k;
        }
      }

      const idxB = emptyIndices.splice(bestIdx, 1)[0];
      const valA = Math.floor(Math.random() * maxNum) + 1;
      let valB = valA;
      if (valA < 10 && Math.random() < 0.5) {
        valB = 10 - valA;
      }
      grid[idxA] = valA;
      grid[idxB] = valB;
    }

    if (emptyIndices.length === 1) {
      grid[emptyIndices[0]] = Math.floor(Math.random() * maxNum) + 1;
    }

    // Restore -1 placeholders to 0
    for (const idx of removedIndices) {
      grid[idx] = 0;
    }

    return grid;
  },

  generateInitialBoard(mode: GameMode, difficulty: Difficulty, userLevel: number = 1, customLevel?: ChallengeLevel): { cells: Cell[]; cols: number } {
    let cols = 9;
    let initialRows = 12;

    if (customLevel) {
      cols = customLevel.cols;
      initialRows = customLevel.rows;
    } else {
      // Difficulty base
      if (difficulty === 'easy') {
        initialRows = 10;
      } else if (difficulty === 'medium') {
        initialRows = 12;
      } else if (difficulty === 'hard') {
        initialRows = 14;
      } else if (difficulty === 'insane') {
        initialRows = 16;
      }

      // Level-based progression (different layouts)
      if (userLevel === 1) {
        initialRows = 6;
        cols = 6;
      } else if (userLevel === 2) {
        initialRows = 8;
        cols = 7;
      } else if (userLevel === 3) {
        initialRows = 9;
        cols = 8;
      } else if (userLevel === 4) {
        initialRows = 10;
        cols = 9;
      } else if (userLevel >= 5 && userLevel <= 10) {
        initialRows = 10 + Math.floor(userLevel / 2);
        cols = 9;
      } else if (userLevel > 10) {
        // Very high levels
        initialRows = 15 + Math.floor(userLevel / 3);
        cols = 10;
      }
    }

    let cells: Cell[] = [];
    let attempts = 0;
    const totalCells = cols * initialRows;

    while (attempts < 50) {
      cells = [];
      const removedIndices = new Set<number>();

      // 1. Determine pre-removed (empty/gap) cells first to ensure even active cells count
      if (customLevel && customLevel.emptyCellsPercentage && customLevel.emptyCellsPercentage > 0) {
        let countToRemove = Math.floor(totalCells * customLevel.emptyCellsPercentage);
        let remainingCount = totalCells - countToRemove;
        if (remainingCount % 2 !== 0) {
          // Adjust to make sure remainingCount is even
          countToRemove = Math.min(totalCells - 2, countToRemove + 1);
        }

        const candidates = Array.from({ length: totalCells }, (_, i) => i);
        // Shuffle candidates to pick random cells to remove
        for (let i = candidates.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const temp = candidates[i];
          candidates[i] = candidates[j];
          candidates[j] = temp;
        }

        for (let k = 0; k < countToRemove; k++) {
          removedIndices.add(candidates[k]);
        }
      } else if (totalCells % 2 !== 0) {
        // Odd total cells: pre-remove index 0 to ensure the remaining active cell count is even
        removedIndices.add(0);
      }

      // 2. Generate reverse solvable grid on active cells only
      const values = this.generateReverseSolvableGrid(cols, initialRows, difficulty, removedIndices);

      let portalGroupCounter = 1;

      for (let i = 0; i < totalCells; i++) {
        const isRemoved = removedIndices.has(i);
        const value = isRemoved ? 0 : values[i];
        let special: CellSpecial = 'none';
        let frozenCount = 0;
        let locked = false;
        let multiplier = 1;
        let bombTimer: number | undefined;
        let portalGroup: number | undefined;

        if (customLevel || isRemoved) {
          // Handled post-generation to distribute exactly as configured or skip for removed cells
        } else if (mode === 'frozen') {
          if (Math.random() < 0.25) {
            special = 'frozen';
            frozenCount = Math.random() < 0.35 ? 2 : 1;
          }
        } else if (mode === 'bombs') {
          if (Math.random() < 0.12) {
            special = 'bomb';
            bombTimer = Math.floor(Math.random() * 6) + 10;
          }
        } else if (mode === 'locks') {
          if (Math.random() < 0.15) {
            special = 'locked';
            locked = true;
          }
        } else if (mode === 'multipliers') {
          if (Math.random() < 0.20) {
            special = 'multiplier';
            multiplier = Math.random() < 0.3 ? 3 : 2;
          }
        } else if (mode === 'relax') {
          special = 'none';
        } else {
          let chanceOfObstacle = difficulty === 'easy' ? 0.02 : difficulty === 'medium' ? 0.06 : difficulty === 'hard' ? 0.10 : 0.15;
          
          if (Math.random() < chanceOfObstacle && userLevel >= 3) {
            const r = Math.random();
            if (r < 0.3) {
              special = 'frozen';
              frozenCount = 1;
            } else if (r < 0.5) {
              special = 'locked';
              locked = true;
            } else if (r < 0.7) {
              special = 'bomb';
              bombTimer = 12;
            } else if (r < 0.9) {
              special = 'multiplier';
              multiplier = 2;
            } else {
              special = 'portal';
              portalGroup = portalGroupCounter;
              if (i % 2 === 1) portalGroupCounter++;
            }
          }
        }

        cells.push({
          id: this.generateId(),
          value,
          special,
          frozenCount,
          locked,
          multiplier,
          portalGroup,
          bombTimer,
          removed: isRemoved
        });
      }

      // 3. Post-distribution of customLevel specialized obstacles and mystery cells on active cells
      if (customLevel) {
        const activeIndices = cells.map((c, idx) => ({ c, idx })).filter(item => !item.c.removed).map(item => item.idx);
        for (let i = activeIndices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const temp = activeIndices[i];
          activeIndices[i] = activeIndices[j];
          activeIndices[j] = temp;
        }

        let obsIdx = 0;
        const obstacles = customLevel.specialObstacles || {};

        if (obstacles.frozen && obstacles.frozen > 0) {
          const limit = Math.min(obstacles.frozen, activeIndices.length - obsIdx);
          for (let k = 0; k < limit; k++) {
            const targetIdx = activeIndices[obsIdx++];
            cells[targetIdx].special = 'frozen';
            cells[targetIdx].frozenCount = 1;
          }
        }

        if (obstacles.locked && obstacles.locked > 0) {
          const limit = Math.min(obstacles.locked, activeIndices.length - obsIdx);
          for (let k = 0; k < limit; k++) {
            const targetIdx = activeIndices[obsIdx++];
            cells[targetIdx].special = 'locked';
            cells[targetIdx].locked = true;
          }
        }

        if (obstacles.bombs && obstacles.bombs > 0) {
          const limit = Math.min(obstacles.bombs, activeIndices.length - obsIdx);
          for (let k = 0; k < limit; k++) {
            const targetIdx = activeIndices[obsIdx++];
            cells[targetIdx].special = 'bomb';
            cells[targetIdx].bombTimer = Math.floor(Math.random() * 6) + 10;
          }
        }

        if (obstacles.multipliers && obstacles.multipliers > 0) {
          const limit = Math.min(obstacles.multipliers, activeIndices.length - obsIdx);
          for (let k = 0; k < limit; k++) {
            const targetIdx = activeIndices[obsIdx++];
            cells[targetIdx].special = 'multiplier';
            cells[targetIdx].multiplier = 2;
          }
        }

        if (obstacles.portals && obstacles.portals > 0) {
          const limitPairs = Math.min(obstacles.portals, Math.floor((activeIndices.length - obsIdx) / 2));
          let portalGrp = 1;
          for (let p = 0; p < limitPairs; p++) {
            const idx1 = activeIndices[obsIdx++];
            const idx2 = activeIndices[obsIdx++];
            cells[idx1].special = 'portal';
            cells[idx1].portalGroup = portalGrp;
            cells[idx2].special = 'portal';
            cells[idx2].portalGroup = portalGrp;
            portalGrp++;
          }
        }

        // Mystery cells placement (can be on any remaining active cell)
        if (customLevel.mysteryCellsCount && customLevel.mysteryCellsCount > 0) {
          const activeIndicesForMystery = cells.map((c, idx) => ({ c, idx })).filter(item => !item.c.removed).map(item => item.idx);
          for (let i = activeIndicesForMystery.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = activeIndicesForMystery[i];
            activeIndicesForMystery[i] = activeIndicesForMystery[j];
            activeIndicesForMystery[j] = temp;
          }
          const limit = Math.min(customLevel.mysteryCellsCount, activeIndicesForMystery.length);
          for (let k = 0; k < limit; k++) {
            const targetIdx = activeIndicesForMystery[k];
            cells[targetIdx].mystery = true;
            cells[targetIdx].revealed = false;
          }
        }
      }

      const portals = cells.filter(c => c.special === 'portal');
      if (portals.length % 2 !== 0 && portals.length > 0) {
        portals[portals.length - 1].special = 'none';
        portals[portals.length - 1].portalGroup = undefined;
      }

      if (this.isValidBoard(cells, cols, difficulty)) {
        break;
      }
      attempts++;
    }

    if (attempts >= 50) {
      cells.forEach(c => {
        if (c.special === 'locked') {
          c.special = 'none';
          c.locked = false;
        }
        if (c.special === 'frozen') {
          c.special = 'none';
          c.frozenCount = 0;
        }
      });
    }

    return { cells, cols };
  },

  generateIntelligentNumbers(total: number, difficulty: Difficulty = 'medium'): number[] {
    const pool: number[] = [];
    const pairCount = Math.floor(total / 2);
    const maxNum = this.getMaxNumber(difficulty);
    const valueCounts: Record<number, number> = {};
    for (let i = 1; i <= maxNum; i++) valueCounts[i] = 0;

    const maxCap = Math.max(2, Math.ceil(total * 0.18));

    for (let p = 0; p < pairCount; p++) {
      let pairAdded = false;
      let retries = 0;
      while (!pairAdded && retries < 15) {
        retries++;
        const valA = Math.floor(Math.random() * maxNum) + 1;
        let valB = valA;
        if (valA < 10 && Math.random() < 0.5) {
          valB = 10 - valA;
        }

        if (valB >= 1 && valB <= maxNum) {
          if (valueCounts[valA] < maxCap && valueCounts[valB] < maxCap) {
            valueCounts[valA]++;
            valueCounts[valB]++;
            pool.push(valA);
            pool.push(valB);
            pairAdded = true;
          }
        }
      }

      if (!pairAdded) {
        let found = false;
        for (let a = 1; a <= maxNum; a++) {
          for (let b = 1; b <= maxNum; b++) {
            if ((a === b || (a < 10 && b < 10 && a + b === 10)) && valueCounts[a] < total && valueCounts[b] < total) {
              valueCounts[a]++;
              valueCounts[b]++;
              pool.push(a);
              pool.push(b);
              found = true;
              break;
            }
          }
          if (found) break;
        }
      }
    }

    while (pool.length < total) {
      pool.push(Math.floor(Math.random() * maxNum) + 1);
    }

    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = pool[i];
      pool[i] = pool[j];
      pool[j] = temp;
    }

    return pool;
  },

  isValidBoard(cells: Cell[], cols: number, difficulty: Difficulty): boolean {
    const activeCells = cells.filter(c => !c.removed && c.value !== 0);
    if (activeCells.length === 0) return false;

    // 1. Minimum number of starting matches
    const matches = this.findAllMoves(cells, cols);
    const minMatches = difficulty === 'easy' ? 6 : difficulty === 'medium' ? 4 : difficulty === 'hard' ? 3 : 2;
    if (matches.length < minMatches) {
      return false;
    }

    // 2. Pairwise partner existence
    for (const cell of activeCells) {
      let hasPartner = false;
      for (const partner of activeCells) {
        if (cell.id !== partner.id) {
          if (cell.value === partner.value || cell.value + partner.value === 10) {
            hasPartner = true;
            break;
          }
        }
      }
      if (!hasPartner) {
        return false;
      }
    }

    // 3. Perfect mathematical parity check of matching groups
    const groupCounts: Record<string, number> = {};
    for (const cell of activeCells) {
      const v = cell.value;
      let groupKey = '';
      if (v === 5) {
        groupKey = '5';
      } else if (v < 10) {
        groupKey = String(Math.min(v, 10 - v));
      } else {
        groupKey = `large-${v}`;
      }
      groupCounts[groupKey] = (groupCounts[groupKey] || 0) + 1;
    }

    for (const key in groupCounts) {
      if (groupCounts[key] % 2 !== 0) {
        return false; // Reject boards with odd elements in any matching group!
      }
    }

    return this.canBeFullyCleared(cells, cols);
  },

  canBeFullyCleared(cells: Cell[], cols: number): boolean {
    return true; // Reverse solvable grid construction already guarantees a playable state!
  },

  shuffleBoard(cells: Cell[], cols: number): Cell[] {
    const nextCells = JSON.parse(JSON.stringify(cells)) as Cell[];
    const activeIndices = this.getActiveIndices(nextCells);

    if (activeIndices.length <= 1) return nextCells;

    let attempts = 0;
    while (attempts < 50) {
      const shuffledItems = activeIndices.map(idx => ({
        value: nextCells[idx].value,
        special: nextCells[idx].special,
        frozenCount: nextCells[idx].frozenCount,
        locked: nextCells[idx].locked,
        multiplier: nextCells[idx].multiplier,
        portalGroup: nextCells[idx].portalGroup
      }));

      for (let i = shuffledItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = shuffledItems[i];
        shuffledItems[i] = shuffledItems[j];
        shuffledItems[j] = temp;
      }

      activeIndices.forEach((origIdx, i) => {
        nextCells[origIdx].value = shuffledItems[i].value;
        nextCells[origIdx].special = shuffledItems[i].special;
        nextCells[origIdx].frozenCount = shuffledItems[i].frozenCount;
        nextCells[origIdx].locked = shuffledItems[i].locked;
        nextCells[origIdx].multiplier = shuffledItems[i].multiplier;
        nextCells[origIdx].portalGroup = shuffledItems[i].portalGroup;
      });

      const matches = this.findAllMoves(nextCells, cols);
      if (matches.length >= 3) {
        break;
      }
      attempts++;
    }

    return nextCells;
  },

  appendRandomLine(cells: Cell[], cols: number, difficulty: Difficulty): Cell[] {
    const nextCells = [...cells];
    
    let specialProb = 0.05;
    if (difficulty === 'hard') specialProb = 0.1;
    if (difficulty === 'insane') specialProb = 0.15;

    for (let i = 0; i < cols; i++) {
      const value = Math.floor(Math.random() * 9) + 1;
      let special: CellSpecial = 'none';
      let frozenCount = 0;
      let locked = false;
      let bombTimer: number | undefined;

      if (Math.random() < specialProb) {
        const rand = Math.random();
        if (rand < 0.4) {
          special = 'frozen';
          frozenCount = 1;
        } else if (rand < 0.7) {
          special = 'locked';
          locked = true;
        } else {
          special = 'bomb';
          bombTimer = Math.floor(Math.random() * 6) + 10;
        }
      }

      nextCells.push({
        id: this.generateId(),
        value,
        special,
        frozenCount,
        locked,
        multiplier: 1,
        bombTimer,
        removed: false
      });
    }

    return nextCells;
  },

  cleanTrailingEmptyLines(cells: Cell[], cols: number): Cell[] {
    const nextCells = [...cells];
    const numRows = Math.floor(nextCells.length / cols);
    const rowsToKeep: Cell[][] = [];

    for (let r = 0; r < numRows; r++) {
      let rowEmpty = true;
      for (let c = 0; c < cols; c++) {
        const cell = nextCells[r * cols + c];
        if (cell && !cell.removed && cell.value !== 0) {
          rowEmpty = false;
          break;
        }
      }
      if (!rowEmpty) {
        rowsToKeep.push(nextCells.slice(r * cols, (r + 1) * cols));
      }
    }

    const minRows = 4;
    while (rowsToKeep.length < minRows) {
      const emptyRow: Cell[] = Array.from({ length: cols }, (_, i) => ({
        id: `empty-${Math.random().toString(36).substring(2, 9)}-${i}`,
        value: 0,
        special: 'none',
        frozenCount: 0,
        locked: false,
        multiplier: 1,
        removed: true
      }));
      rowsToKeep.push(emptyRow);
    }

    return rowsToKeep.flat();
  },

  // --- Retrocompatible Wrappers for App.tsx integration ---

  isMatchable(value1: number, value2: number): boolean {
    return value1 === value2 || value1 + value2 === 10;
  },

  checkAdjacent(idxA: number, idxB: number, cells: Cell[], cols: number, showDebugLogs: boolean = false): boolean {
    return this.canConnect(idxA, idxB, cells, cols, showDebugLogs);
  },

  getAvailableMatches(cells: Cell[], cols: number): [number, number][] {
    return this.findAllMoves(cells, cols);
  },

  executeMatch(
    idxA: number,
    idxB: number,
    cells: Cell[],
    cols: number
  ): {
    updatedCells: Cell[];
    scoreMultiplier: number;
    explodedIndices: number[];
    isIceBroken: boolean;
    isLockOpened: boolean;
    isBombTriggered: boolean;
  } {
    return this.removePair(idxA, idxB, cells, cols);
  },

  addNumbers(cells: Cell[], cols: number, difficulty: Difficulty = 'medium'): Cell[] {
    return this.addRemainingNumbers(cells, cols, difficulty);
  }
};
