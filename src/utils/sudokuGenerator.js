// Robust Sudoku generator ensuring unique solution
function isSafe(board, row, col, num) {
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num || board[x][col] === num) return false;
  }
  const startRow = row - row % 3;
  const startCol = col - col % 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[startRow + i][startCol + j] === num) return false;
    }
  }
  return true;
}

function fillBoard(board) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        let nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
        for (let num of nums) {
          if (isSafe(board, row, col, num)) {
            board[row][col] = num;
            if (fillBoard(board)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function copyBoard(board) {
  return board.map(row => [...row]);
}

function countSolutions(board) {
  let count = 0;
  function solve(bd) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (bd[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isSafe(bd, row, col, num)) {
              bd[row][col] = num;
              solve(bd);
              bd[row][col] = 0;
            }
          }
          return;
        }
      }
    }
    count++;
  }
  solve(copyBoard(board));
  return count;
}

export function generateSudoku(difficulty = "easy") {
  // Step 1: Generate a full solution
  let solution = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillBoard(solution);

  // Step 2: Remove cells while ensuring unique solution
  let board = solution.map(row => row.map(value => ({ value, prefilled: true })));
  let empties = difficulty === "easy" ? 30 : difficulty === "medium" ? 40 : 50;
  let attempts = 0;
  while (empties > 0 && attempts < 1000) {
    let row = Math.floor(Math.random() * 9);
    let col = Math.floor(Math.random() * 9);
    if (board[row][col].value !== 0) {
      let backup = board[row][col].value;
      board[row][col].value = 0;
      board[row][col].prefilled = false;
      // Check uniqueness
      let testBoard = board.map(r => r.map(c => c.value));
      if (countSolutions(testBoard) !== 1) {
        board[row][col].value = backup;
        board[row][col].prefilled = true;
      } else {
        empties--;
      }
    }
    attempts++;
  }
  return {
    board,
    solution
  };
}
