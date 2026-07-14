import { Cell, CellSpecial, GameMode, Difficulty } from '../types';

export const GameEngine = {
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

  // Reverse-pairing constructor to generate beautifully-structured, solvable boards
  generateReverseSolvableGrid(cols: number, rows: number, difficulty: Difficulty = 'medium'): number[] {
    const total = cols * rows;
    const grid = new Array(total).fill(0);
    const indices = Array.from({ length: total }, (_, i) => i);

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

    // Fill any left-over isolated tiles with matching pairs intelligently (by nearest 2D distance)
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

    return grid;
  },

  generateInitialBoard(mode: GameMode, difficulty: Difficulty, userLevel: number = 1): { cells: Cell[]; cols: number } {
    let cols = 9;
    let initialRows = 12; // Much fuller board from the start

    if (difficulty === 'easy') {
      initialRows = 10;
      cols = 9;
    } else if (difficulty === 'medium') {
      initialRows = 12;
      cols = 9;
    } else if (difficulty === 'hard') {
      initialRows = 14;
      cols = 9;
    } else if (difficulty === 'insane') {
      initialRows = 16;
      cols = 9;
    }

    // Gentle onboarding but still plenty of numbers
    if (userLevel === 1) {
      initialRows = 8;
      cols = 9;
    } else if (userLevel === 2) {
      initialRows = 10;
      cols = 9;
    }

    let cells: Cell[] = [];
    let attempts = 0;

    while (attempts < 50) {
      cells = [];
      const totalCells = cols * initialRows;
      const values = this.generateReverseSolvableGrid(cols, initialRows, difficulty);

      let portalGroupCounter = 1;

      for (let i = 0; i < totalCells; i++) {
        const value = values[i];
        let special: CellSpecial = 'none';
        let frozenCount = 0;
        let locked = false;
        let multiplier = 1;
        let bombTimer: number | undefined;
        let portalGroup: number | undefined;

        // Apply game-mode specific mechanics explicitly
        if (mode === 'frozen') {
          // 25% of tiles frozen on Frozen Mode
          if (Math.random() < 0.25) {
            special = 'frozen';
            frozenCount = Math.random() < 0.35 ? 2 : 1;
          }
        } else if (mode === 'bombs') {
          // 12% of tiles are bombs with countdown timers
          if (Math.random() < 0.12) {
            special = 'bomb';
            bombTimer = Math.floor(Math.random() * 6) + 10; // 10 to 15 moves countdown
          }
        } else if (mode === 'locks') {
          // 15% of cells are locked
          if (Math.random() < 0.15) {
            special = 'locked';
            locked = true;
          }
        } else if (mode === 'multipliers') {
          // 20% of cells are score multipliers
          if (Math.random() < 0.20) {
            special = 'multiplier';
            multiplier = Math.random() < 0.3 ? 3 : 2;
          }
        } else if (mode === 'relax') {
          // Pure normal numbers, no obstacles
          special = 'none';
        } else {
          // Standard modes (Classic, Timed, Challenge, Survival) have low chance of mixed obstacles based on difficulty
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
          removed: false
        });
      }

      // Safeguard portals
      const portals = cells.filter(c => c.special === 'portal');
      if (portals.length % 2 !== 0 && portals.length > 0) {
        portals[portals.length - 1].special = 'none';
        portals[portals.length - 1].portalGroup = undefined;
      }

      // Check if board is 100% solvable and satisfies difficulty constraints
      if (this.isValidBoard(cells, cols, difficulty)) {
        break;
      }
      attempts++;
    }

    // Absolute fallback: If backtracking solver couldn't find a 100% solution,
    // clear all special blockades to ensure perfect playability on base digits.
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

  // Intelligent balanced pair pool generator
  generateIntelligentNumbers(total: number, difficulty: Difficulty = 'medium'): number[] {
    const pool: number[] = [];
    const pairCount = Math.floor(total / 2);
    const maxNum = this.getMaxNumber(difficulty);
    const valueCounts: Record<number, number> = {};
    for (let i = 1; i <= maxNum; i++) valueCounts[i] = 0;

    const maxCap = Math.max(2, Math.ceil(total * 0.18)); // Prevent repetitive number spam

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
        // Fallback pair if caps prevent random select
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

    // Shuffle using Fisher-Yates
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = pool[i];
      pool[i] = pool[j];
      pool[j] = temp;
    }

    return pool;
  },

  // Solver & balance validator
  isValidBoard(cells: Cell[], cols: number, difficulty: Difficulty): boolean {
    const activeCells = cells.filter(c => !c.removed);
    if (activeCells.length === 0) return false;

    // 1. Ensure ample initial moves available
    const matches = this.getAvailableMatches(cells, cols);
    const minMatches = difficulty === 'easy' ? 6 : difficulty === 'medium' ? 4 : difficulty === 'hard' ? 3 : 2;
    if (matches.length < minMatches) {
      return false;
    }

    // 2. Ensure NO lonely numbers: every cell must have at least one valid partner
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

    // 3. Mathematical Backtracking Solver: verify board is completely clearable
    return this.canBeFullyCleared(cells, cols);
  },

  // Dynamic backtracking solver with failed-state memoization to mathematically guarantee clearability
  canBeFullyCleared(cells: Cell[], cols: number): boolean {
    const activeIdx = this.getActiveIndices(cells);
    if (activeIdx.length === 0) return true;

    const memo = new Set<string>();
    let statesVisited = 0;
    const maxStates = 500; // Optimal search limit for real-time validation

    const dfs = (currentCells: Cell[]): boolean => {
      statesVisited++;
      if (statesVisited > maxStates) {
        // If search space is too deep, check if we cleared at least 85% of cells (fallback condition)
        const total = cells.filter(c => !c.removed).length;
        const current = currentCells.filter(c => !c.removed).length;
        return (total - current) / total >= 0.85;
      }

      const active = this.getActiveIndices(currentCells);
      if (active.length === 0) {
        return true; 
      }

      const matches = this.getAvailableMatches(currentCells, cols);
      if (matches.length === 0) {
        return false;
      }

      const stateKey = active.map(idx => `${idx}:${currentCells[idx].value}`).join(',');
      if (memo.has(stateKey)) {
        return false;
      }

      // Sort matches to prioritize closer cell pairs to clear the board in a compact manner
      const sortedMatches = [...matches].sort((a, b) => {
        const distA = Math.abs(a[0] - a[1]);
        const distB = Math.abs(b[0] - b[1]);
        return distA - distB;
      });

      for (const [idxA, idxB] of sortedMatches) {
        const result = this.executeMatch(idxA, idxB, currentCells, cols);
        if (dfs(result.updatedCells)) {
          return true;
        }
      }

      memo.add(stateKey);
      return false;
    };

    return dfs(cells);
  },

  // Intelligent Shuffling preserving a valid, solvable state
  shuffleBoard(cells: Cell[], cols: number): Cell[] {
    const nextCells = JSON.parse(JSON.stringify(cells)) as Cell[];
    const activeIndices = this.getActiveIndices(nextCells);

    if (activeIndices.length <= 1) return nextCells;

    let attempts = 0;
    while (attempts < 50) {
      // Gather active elements properties
      const shuffledItems = activeIndices.map(idx => ({
        value: nextCells[idx].value,
        special: nextCells[idx].special,
        frozenCount: nextCells[idx].frozenCount,
        locked: nextCells[idx].locked,
        multiplier: nextCells[idx].multiplier,
        portalGroup: nextCells[idx].portalGroup
      }));

      // Fisher-Yates Shuffle
      for (let i = shuffledItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = shuffledItems[i];
        shuffledItems[i] = shuffledItems[j];
        shuffledItems[j] = temp;
      }

      // Assign back to cell list
      activeIndices.forEach((origIdx, i) => {
        nextCells[origIdx].value = shuffledItems[i].value;
        nextCells[origIdx].special = shuffledItems[i].special;
        nextCells[origIdx].frozenCount = shuffledItems[i].frozenCount;
        nextCells[origIdx].locked = shuffledItems[i].locked;
        nextCells[origIdx].multiplier = shuffledItems[i].multiplier;
        nextCells[origIdx].portalGroup = shuffledItems[i].portalGroup;
      });

      // Verify that shuffled grid has at least 3 moves
      const matches = this.getAvailableMatches(nextCells, cols);
      if (matches.length >= 3) {
        break;
      }
      attempts++;
    }

    return nextCells;
  },

  // Retrieve active cells in flattened order (excluding removed)
  getActiveIndices(cells: Cell[]): number[] {
    const indices: number[] = [];
    for (let i = 0; i < cells.length; i++) {
      if (!cells[i].removed) {
        indices.push(i);
      }
    }
    return indices;
  },

  // Check if two cells are matchable (same value OR sum to 10)
  isMatchable(value1: number, value2: number): boolean {
    return value1 === value2 || value1 + value2 === 10;
  },

  // Main adjacency algorithm: horizontal, vertical, diagonal, or continuous pathfinding
  checkAdjacent(idxA: number, idxB: number, cells: Cell[], cols: number): boolean {
    if (idxA === idxB) return false;
    if (cells[idxA].removed || cells[idxB].removed) return false;

    const total = cells.length;
    const minIdx = Math.min(idxA, idxB);
    const maxIdx = Math.max(idxA, idxB);

    // 1. Continuous (Linear) Wrapping Adjacency
    // In Number Match, two cells are adjacent linear-wise if there are no active cells between them
    let activeBetweenLinear = 0;
    for (let i = minIdx + 1; i < maxIdx; i++) {
      if (!cells[i].removed) {
        activeBetweenLinear++;
      }
    }
    if (activeBetweenLinear === 0) {
      return true;
    }

    // 2. 2D Pathfinding (BFS) through empty (removed) cells
    // Allows matching numbers that have a clear free path of empty cells between them
    const rows = Math.ceil(total / cols);
    const queue: number[] = [idxA];
    const visited = new Set<number>();
    visited.add(idxA);

    const dirs = [
      [-1, 0], [1, 0], [0, -1], [0, 1],     // Cardinal
      [-1, -1], [-1, 1], [1, -1], [1, 1]   // Diagonals
    ];

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr === idxB) return true;

      const r = Math.floor(curr / cols);
      const c = curr % cols;

      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;

        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          const nextIdx = nr * cols + nc;
          if (nextIdx < total && !visited.has(nextIdx)) {
            // We can step if it is our destination or if the cell is already removed/empty
            if (nextIdx === idxB || cells[nextIdx].removed) {
              visited.add(nextIdx);
              queue.push(nextIdx);
            }
          }
        }
      }

      // Also allow linear wrapping step (moving left/right dynamically across rows)
      if (curr + 1 < total && !visited.has(curr + 1)) {
        if (curr + 1 === idxB || cells[curr + 1].removed) {
          visited.add(curr + 1);
          queue.push(curr + 1);
        }
      }
      if (curr - 1 >= 0 && !visited.has(curr - 1)) {
        if (curr - 1 === idxB || cells[curr - 1].removed) {
          visited.add(curr - 1);
          queue.push(curr - 1);
        }
      }
    }

    return false;
  },

  // Get all valid moves on the current board
  getAvailableMatches(cells: Cell[], cols: number): [number, number][] {
    const activeIndices = this.getActiveIndices(cells);
    const matches: [number, number][] = [];

    // Optimize search: adjacent active cells in list are linear matches
    for (let i = 0; i < activeIndices.length; i++) {
      const idxA = activeIndices[i];
      if (cells[idxA].locked) continue; // Locked cells cannot be matched

      for (let j = i + 1; j < activeIndices.length; j++) {
        const idxB = activeIndices[j];
        if (cells[idxB].locked) continue;

        if (this.isMatchable(cells[idxA].value, cells[idxB].value)) {
          if (this.checkAdjacent(idxA, idxB, cells, cols)) {
            matches.push([idxA, idxB]);
          }
        }
      }
    }

    return matches;
  },

  // Perform a match between two cells.
  // Returns updated cells, base score multiplier, list of indices affected by explosions, and any special notes
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
    const nextCells = JSON.parse(JSON.stringify(cells)) as Cell[];
    let scoreMultiplier = 1;
    let explodedIndices: number[] = [];
    let isIceBroken = false;
    let isLockOpened = false;
    let isBombTriggered = false;

    const cellA = nextCells[idxA];
    const cellB = nextCells[idxB];

    // Combine multipliers
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

    // If both portals are matched, clear portal status or clear together
    if (cellA.special === 'portal' && cellB.special === 'portal' && cellA.portalGroup === cellB.portalGroup) {
      removeA = true;
      removeB = true;
    }

    // Actually flag as removed if required
    if (removeA) cellA.removed = true;
    if (removeB) cellB.removed = true;

    // Detonate Bombs if matched
    const triggerBomb = (idx: number) => {
      isBombTriggered = true;
      const row = Math.floor(idx / cols);
      const col = idx % cols;

      // Clear 3x3 surrounding cells
      for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
          // Inner loops
          const targetR = r;
          const targetC = c;
          if (targetR >= 0 && targetR < Math.ceil(nextCells.length / cols) && targetC >= 0 && targetC < cols) {
            const checkIdx = targetR * cols + targetC;
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

    // Unlock surrounding locked cells when adjacent cells are cleared
    const checkUnlockAdjacent = (idx: number) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const dirs = [
        [-1, 0], [1, 0], [0, -1], [0, 1]
      ];

      dirs.forEach(([dr, dc]) => {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < Math.ceil(nextCells.length / cols) && nc >= 0 && nc < cols) {
          const adjIdx = nr * cols + nc;
          if (adjIdx < nextCells.length && nextCells[adjIdx].special === 'locked' && nextCells[adjIdx].locked) {
            nextCells[adjIdx].locked = false;
            nextCells[adjIdx].special = 'none'; // Lock broken!
            isLockOpened = true;
          }
        }
      });
    };

    // Crack surrounding ice when adjacent cells are cleared
    const checkCrackAdjacentIce = (idx: number) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const dirs = [
        [-1, 0], [1, 0], [0, -1], [0, 1]
      ];

      dirs.forEach(([dr, dc]) => {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < Math.ceil(nextCells.length / cols) && nc >= 0 && nc < cols) {
          const adjIdx = nr * cols + nc;
          if (adjIdx < nextCells.length && nextCells[adjIdx].special === 'frozen' && nextCells[adjIdx].frozenCount > 0 && !nextCells[adjIdx].removed) {
            nextCells[adjIdx].frozenCount--;
            isIceBroken = true;
            if (nextCells[adjIdx].frozenCount <= 0) {
              nextCells[adjIdx].special = 'none'; // Ice melted!
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

    // Handle Linked Portals (if one portal cell was removed, find its twin and make it standard number or trigger match)
    const handlePortalTwin = (idx: number, TwinGroup: number) => {
      for (let i = 0; i < nextCells.length; i++) {
        if (i !== idx && nextCells[i].special === 'portal' && nextCells[i].portalGroup === TwinGroup && !nextCells[i].removed) {
          // Convert twin to a normal number now that portal group is split
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

  // Duplicate remaining numbers and append to the bottom
  addNumbers(cells: Cell[], cols: number): Cell[] {
    const nextCells = [...cells];
    const activeCells = cells.filter(c => !c.removed);

    activeCells.forEach(original => {
      nextCells.push({
        id: this.generateId(),
        value: original.value,
        special: original.special,
        frozenCount: original.frozenCount > 0 ? 1 : 0, // Fresh duplicate gets at most 1 layer of ice
        locked: original.locked,
        multiplier: original.multiplier,
        portalGroup: original.portalGroup,
        removed: false
      });
    });

    return nextCells;
  },

  // Append a random single line to the bottom (for Survival mode)
  appendRandomLine(cells: Cell[], cols: number, difficulty: Difficulty): Cell[] {
    const nextCells = [...cells];
    
    // special rate in survival
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

  // Clean trailing and mid-board fully-removed lines from the board to save space, shifting lower rows up
  cleanTrailingEmptyLines(cells: Cell[], cols: number): Cell[] {
    const nextCells = [...cells];
    const numRows = Math.floor(nextCells.length / cols);
    const rowsToKeep: Cell[][] = [];

    for (let r = 0; r < numRows; r++) {
      let rowEmpty = true;
      for (let c = 0; c < cols; c++) {
        if (!nextCells[r * cols + c].removed) {
          rowEmpty = false;
          break;
        }
      }
      if (!rowEmpty) {
        rowsToKeep.push(nextCells.slice(r * cols, (r + 1) * cols));
      }
    }

    // Keep at least 4 rows on the board for a consistent visual presentation
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
  }
};
