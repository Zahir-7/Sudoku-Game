import React, { useEffect, useState, useRef } from "react";
import { generateSudoku } from "./utils/sudokuGenerator";
import { UndoStack } from "./utils/undoStack";
import { launchConfetti } from "./utils/confetti";
import Cell from "./components/Cell";
import DarkModeToggle from "./components/DarkModeToggle";
import "./App.css";
import { RotateCcw } from "lucide-react";
import { Undo2 } from "lucide-react";
import { Redo2 } from "lucide-react";
import { Pause, Play } from "lucide-react";
import { Lightbulb } from "lucide-react";




function App() {
  const [board, setBoard] = useState([]);
  const [solution, setSolution] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [difficulty, setDifficulty] = useState("easy");
  const [mistakes, setMistakes] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultMsg, setResultMsg] = useState("");
  const [restartKey, setRestartKey] = useState(0);
  const [paused, setPaused] = useState(false);
  const [mistakeCell, setMistakeCell] = useState(null);
  const undoStack = useRef(new UndoStack());

  // Helper to count mistakes in a board
  const countMistakes = (board) => {
    if (!solution.length) return 0;
    let count = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!board[r][c].prefilled && board[r][c].value !== 0 && board[r][c].value !== solution[r][c]) {
          count++;
        }
      }
    }
    return count;
  };

  // Helper to get mistake delta for a move
  const getMistakeDelta = (prevBoard, nextBoard) => {
    let delta = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const prev = prevBoard[r][c];
        const next = nextBoard[r][c];
        if (!prev.prefilled && !next.prefilled) {
          const wasMistake = prev.value !== 0 && prev.value !== solution[r][c];
          const isMistake = next.value !== 0 && next.value !== solution[r][c];
          if (wasMistake && !isMistake) delta--;
          if (!wasMistake && isMistake) delta++;
        }
      }
    }
    return delta;
  };

  // Generate board and solution
  useEffect(() => {
    const newBoard = generateSudoku(difficulty);
    setBoard(newBoard.board);
    setSolution(newBoard.solution);
    setMistakes(0);
    setSelectedCell(null);
    setGameWon(false);
    setShowConfetti(false);
    undoStack.current.clear();
    setIsRunning(false);
    setHasStarted(false);
    setTimer(0);
    setShowResult(false);
    setResultMsg("");
  }, [difficulty, restartKey]);

  // Timer
  useEffect(() => {
    if (!isRunning || gameWon || paused) return;
    const interval = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, gameWon, paused]);

  // Keyboard support for editing cells
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedCell || gameWon) return;
      if (e.key === "ArrowUp") moveSelection(-1, 0);
      else if (e.key === "ArrowDown") moveSelection(1, 0);
      else if (e.key === "ArrowLeft") moveSelection(0, -1);
      else if (e.key === "ArrowRight") moveSelection(0, 1);
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        handleKeyPress(num);
      }
      if (e.key === "Backspace" || e.key === "Delete") {
        handleKeyPress(0);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedCell, board, gameWon]);

  // Check win
  useEffect(() => {
    if (board.length === 0) return;
    const isComplete = board.every((row, rIdx) =>
      row.every((cell, cIdx) => cell.value === solution[rIdx][cIdx])
    );
    if (isComplete && !gameWon) {
      setGameWon(true);
      setShowConfetti(true);
      setIsRunning(false);
      launchConfetti();
    }
  }, [board, solution, gameWon]);

  // Move selection with arrows
  const moveSelection = (dr, dc) => {
    if (!selectedCell) return;
    let { row, col } = selectedCell;
    row = Math.max(0, Math.min(8, row + dr));
    col = Math.max(0, Math.min(8, col + dc));
    setSelectedCell({ row, col });
  };

  // Handle number input
  const handleKeyPress = (num) => {
    if (!selectedCell || gameWon) return;
    const { row, col } = selectedCell;
    const current = board[row][col];
    if (current.prefilled) return;
    if (!hasStarted) {
      setIsRunning(true);
      setHasStarted(true);
    }
    // Store move in undo stack
    undoStack.current.push({
      row,
      col,
      prevValue: current.value,
      newValue: num
    });
    let newMistakes = mistakes;
    // Every wrong entry counts as a mistake
    if (num !== 0 && num !== solution[row][col]) {
      newMistakes++;
      setMistakeCell({ row, col });
      setTimeout(() => setMistakeCell(null), 500);
    }
    setMistakes(newMistakes);
    let newBoard = board.map((r, rIdx) =>
      r.map((c, cIdx) =>
        rIdx === row && cIdx === col ? { ...c, value: num } : c
      )
    );
    setBoard(newBoard);
  };

  // Undo
  const handleUndo = () => {
    const result = undoStack.current.undo(board);
    if (!result) return;
    const { newBoard, move } = result;
    const { row, col, prevValue, newValue } = move;
    // If the undone move was a mistake, decrement
    const wasMistake = newValue !== 0 && newValue !== solution[row][col];
    setBoard(newBoard);
    setMistakes((m) => wasMistake ? Math.max(0, m - 1) : m);
  };

  // Redo
  const handleRedo = () => {
    const result = undoStack.current.redo(board);
    if (!result) return;
    const { newBoard, move } = result;
    const { row, col, prevValue, newValue } = move;
    // If the redone move was a mistake, increment
    const isMistake = newValue !== 0 && newValue !== solution[row][col];
    setBoard(newBoard);
    setMistakes((m) => isMistake ? m + 1 : m);
  };

  // Restart
  const handleRestart = () => {
    setRestartKey((k) => k + 1);
  };

  // Hint
  const handleHint = () => {
    if (!selectedCell || gameWon) return;
    const { row, col } = selectedCell;
    if (board[row][col].prefilled) return;
    if (!hasStarted) {
      setIsRunning(true);
      setHasStarted(true);
    }
    undoStack.current.push(board);
    const newBoard = board.map((r, rIdx) =>
      r.map((c, cIdx) =>
        rIdx === row && cIdx === col ? { ...c, value: solution[row][col] } : c
      )
    );
    setBoard(newBoard);
  };

  // Submit
  const allFilled = board.length > 0 && board.every(row => row.every(cell => cell.value !== 0));
  const handleSubmit = () => {
    if (board.length === 0) return;
    const isCorrect = board.every((row, rIdx) =>
      row.every((cell, cIdx) => cell.value === solution[rIdx][cIdx])
    );
    setShowResult(true);
    setIsRunning(false);
    if (isCorrect) {
      setGameWon(true);
      setShowConfetti(true);
      launchConfetti();
      setResultMsg(`🎉 Correct! You solved the puzzle in ${formatTime(timer)} with ${mistakes} mistake${mistakes === 1 ? "" : "s"}.`);
    } else {
      setResultMsg("❌ Incorrect solution. Try again or use Undo/Hint.");
    }
  };

  // Format timer
  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Difficulty options
  const difficulties = ["easy", "medium", "hard"];
  const emptyCells = board.flat().filter(cell => cell.value === 0).length;

  // Tailwind dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div key={restartKey} className={`min-h-screen flex flex-col items-center justify-center p-2 transition bg-silky dark:bg-gray-900`}>
      <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
      <h1 className="text-4xl font-bold text-accent mb-2 max-sm:text-3xl dark:text-white">Sudokool</h1>
      <div className="flex gap-4 max-sm:text-sm mb-2">
        {difficulties.map((d) => (
          <button
            key={d}
            onClick={() => !paused && setDifficulty(d)}
            className={`px-3 py-1 rounded-lg font-semibold transform-gpu shadow transition border border-accent ${difficulty === d ? "bg-accent text-white" : "bg-white text-accent dark:bg-gray-800 dark:text-white"} ${paused ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}`}
            disabled={paused}
          >
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>
      <div className="flex gap-4 mb-2 max-sm:text-xs bg-amber-300 menu p-2 rounded-full items-center">
        <span className="text-lg font-semibold max-sm:text-xs text-black">⏱ {formatTime(timer)}</span>
        <span className="text-lg font-semibold max-sm:text-xs text-black">❌ Mistakes: {mistakes}</span>
        <span className="text-lg font-semibold max-sm:text-xs text-black">🟦 Empty: {emptyCells}</span>
        <button
          onClick={() => setPaused(p => !p)}
          className={`bg-gray-500 text-white px-2 py-1 rounded-lg shadow transition ${!hasStarted ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 transform-gpu cursor-pointer'}`}
          disabled={!hasStarted}
        >
          {paused ? "Resume" : "Pause"}
        </button>
      </div>
      <div className="flex gap-2 mb-2 max-sm:text-sm">
        <button onClick={() => !paused && handleRestart()} className={`bg-accent flex items-center gap-1 text-white px-3 py-1 rounded-lg shadow transition transform-gpu ${paused ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}`} disabled={paused}> <RotateCcw className="h-4 w-4 max-sm:w-3 max-sm:h-3" /> Restart</button>
        <button onClick={() => !paused && handleUndo()} className={`bg-gray-300 flex items-center gap-1 dark:bg-gray-700 text-black dark:text-white px-3 py-1 rounded-lg shadow transition transform-gpu ${paused ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}`} disabled={paused}> <Undo2 className="w-4 h-4 max-sm:w-3 max-sm:h-3" /> Undo</button>
        <button onClick={() => !paused && handleRedo()} className={`bg-gray-300 flex items-center gap-1 dark:bg-gray-700 text-black dark:text-white px-3 py-1 rounded-lg shadow transition transform-gpu ${paused ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}`} disabled={paused}> <Redo2 className="w-4 h-4 max-sm:w-3 max-sm:h-3" /> Redo</button>
        <button onClick={() => !paused && handleHint()} className={`bg-green-500 flex items-center gap-1 text-white px-3 py-1 rounded-lg shadow transition transform-gpu ${paused ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}`} disabled={paused}> <Lightbulb className="w-4 h-4 max-sm:w-3 max-sm:h-3" /> Hint</button>
      </div>
      <div className="relative grid grid-cols-9  gap-[2px] bg-gray-400 dark:bg-gray-700 rounded-lg p-1">
        {board.flat().map((cell, index) => {
          const row = Math.floor(index / 9);
          const col = index % 9;
          const highlight = selectedCell && (
            selectedCell.row === row || selectedCell.col === col ||
            (Math.floor(selectedCell.row / 3) === Math.floor(row / 3) && Math.floor(selectedCell.col / 3) === Math.floor(col / 3))
          );
          const isMistake = mistakeCell && mistakeCell.row === row && mistakeCell.col === col;
          return (
            <Cell
              key={index}
              cell={cell}
              onClick={() => setSelectedCell({ row, col })}
              selected={selectedCell?.row === row && selectedCell?.col === col}
              blockBorder={true}
              index={index}
              highlight={highlight}
              isMistake={isMistake}
              aria-label={`Cell ${row + 1}, ${col + 1}${cell.prefilled ? ' prefilled' : ''}`}
            />
          );
        })}
        {paused && (
          <div className="absolute top-10 w-full h-4/5 flex items-center justify-center bg-gradient-to-br from-red-400 to-gray-400 bg-opacity-10 rounded-lg z-10">
            <span className="text-3xl font-bold text-white text-center">
              Game Paused
              <div>
                <button
                  onClick={() => setPaused(p => !p)}
                  className={`bg-gray-500 text-white px-2 py-1 rounded-lg shadow transition ${!hasStarted ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 transform-gpu cursor-pointer'}`}
                  disabled={!hasStarted}
                >
                  {paused ? "Resume" : "Pause"}
                </button>
              </div>
            </span>
          </div>
        )}
      </div>
      <div className="mt-4 grid grid-cols-9  gap-4 w-full max-w-xs mx-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => selectedCell && !board[selectedCell.row][selectedCell.col].prefilled && !paused && handleKeyPress(n)}
            className={`bg-accent max-sm:text-sm text-white py-2 px-0 rounded-lg shadow hover:scale-105 transition cursor-pointer text-lg touch-manipulation ${selectedCell && board[selectedCell.row][selectedCell.col].prefilled || paused ? 'opacity-50 cursor-not-allowed' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ minWidth: "36px" }}
            aria-label={`Input number ${n}`}
            disabled={selectedCell && board[selectedCell.row][selectedCell.col].prefilled || paused}
          >
            {n}
          </button>
        ))}
      </div>
      {allFilled && !gameWon && (
        <button
          onClick={handleSubmit}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:scale-105 transition font-bold"
        >
          Submit
        </button>
      )}
      {showResult && (
        <div className="mt-4 text-xl font-bold text-green-600 dark:text-green-400">{resultMsg}</div>
      )}
      {gameWon && (
        <div className="mt-4 text-2xl font-bold text-green-600 dark:text-green-400">🎉 Puzzle Complete! Time: {formatTime(timer)}</div>
      )}
    </div>
  );
}

export default App;
