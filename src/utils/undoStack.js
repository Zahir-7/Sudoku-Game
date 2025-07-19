
export class UndoStack {
  constructor() {
    this.stack = [];
    this.redoStack = [];
  }

  // Push a move: { row, col, prevValue, newValue }
  push(move) {
    this.stack.push(move);
    this.redoStack = [];
  }

  // Undo one move
  undo(board) {
    if (this.stack.length === 0) return null;
    const move = this.stack.pop();
    this.redoStack.push(move);
    // Apply the previous value to the board
    const { row, col, prevValue } = move;
    const newBoard = board.map((r, rIdx) =>
      r.map((c, cIdx) =>
        rIdx === row && cIdx === col ? { ...c, value: prevValue } : c
      )
    );
    return { newBoard, move };
  }

  // Redo one move
  redo(board) {
    if (this.redoStack.length === 0) return null;
    const move = this.redoStack.pop();
    this.stack.push(move);
    // Apply the new value to the board
    const { row, col, newValue } = move;
    const newBoard = board.map((r, rIdx) =>
      r.map((c, cIdx) =>
        rIdx === row && cIdx === col ? { ...c, value: newValue } : c
      )
    );
    return { newBoard, move };
  }

  clear() {
    this.stack = [];
    this.redoStack = [];
  }
}
