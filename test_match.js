const cols = 9;
const cells = Array.from({ length: 18 }, (_, idx) => ({
  id: String(idx),
  value: idx === 3 ? 9 : (idx === 11 ? 9 : (idx === 0 ? 1 : (idx === 10 ? 1 : 2))),
  removed: false
}));

function checkAdjacent(idxA, idxB, cells, cols) {
  if (idxA === idxB) return false;
  if (cells[idxA].removed || cells[idxB].removed) return false;

  const minIdx = Math.min(idxA, idxB);
  const maxIdx = Math.max(idxA, idxB);

  const r1 = Math.floor(idxA / cols);
  const c1 = idxA % cols;
  const r2 = Math.floor(idxB / cols);
  const c2 = idxB % cols;

  console.log(`Checking idxA=${idxA} (${r1},${c1}) and idxB=${idxB} (${r2},${c2})`);

  // 1. Horizontal check
  if (r1 === r2) {
    const minCol = Math.min(c1, c2);
    const maxCol = Math.max(c1, c2);
    let blocked = false;
    for (let c = minCol + 1; c < maxCol; c++) {
      const idx = r1 * cols + c;
      if (!cells[idx].removed) {
        blocked = true;
        break;
      }
    }
    if (!blocked) return true;
  }

  // 2. Vertical check
  if (c1 === c2) {
    const minRow = Math.min(r1, r2);
    const maxRow = Math.max(r1, r2);
    let blocked = false;
    for (let r = minRow + 1; r < maxRow; r++) {
      const idx = r * cols + c1;
      if (!cells[idx].removed) {
        blocked = true;
        break;
      }
    }
    if (!blocked) return true;
  }

  // 3. Diagonal check
  if (Math.abs(r1 - r2) === Math.abs(c1 - c2)) {
    const rowStep = r2 > r1 ? 1 : -1;
    const colStep = c2 > c1 ? 1 : -1;
    const steps = Math.abs(r1 - r2);
    let blocked = false;
    for (let i = 1; i < steps; i++) {
      const r = r1 + i * rowStep;
      const c = c1 + i * colStep;
      const idx = r * cols + c;
      if (!cells[idx].removed) {
        blocked = true;
        break;
      }
    }
    if (!blocked) return true;
  }

  // 4. Linear wrapping check
  let blocked1D = false;
  for (let i = minIdx + 1; i < maxIdx; i++) {
    if (!cells[i].removed) {
      blocked1D = true;
      break;
    }
  }
  if (!blocked1D) return true;

  return false;
}

console.log("9 and 9 adjacent:", checkAdjacent(3, 11, cells, cols));
console.log("1 and 1 adjacent:", checkAdjacent(0, 10, cells, cols));
