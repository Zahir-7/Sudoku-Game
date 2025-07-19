import React from "react";

function getBlockBorder(row, col) {
  let classes = "";
  if (col % 3 === 0) classes += " border-l-4 ";
  if (row % 3 === 0) classes += " border-t-4 ";
  if (col === 8) classes += " border-r-4 ";
  if (row === 8) classes += " border-b-4 ";
  return classes;
}

function Cell({ cell, onClick, selected, blockBorder, index, highlight, isMistake, ...props }) {
  const row = Math.floor(index / 9);
  const col = index % 9;
  return (
    <div
      onClick={onClick}
      className={`w-10 h-10 flex items-center justify-center text-lg cursor-pointer transition-all duration-150 relative
        bg-white text-black dark:bg-gray-900 dark:text-white
        ${cell.prefilled ? "font-bold cursor-not-allowed" : "cursor-pointer"}
        ${blockBorder ? getBlockBorder(row, col) : ""}
        border
        ${highlight && !selected ? "bg-yellow-100 dark:bg-yellow-900" : ""}
        ${isMistake ? "animate-shake" : ""}
        focus:outline-none
      `}
      style={{ boxSizing: "border-box" }}
      tabIndex={0}
      aria-label={props["aria-label"]}
    >
      {selected && (
        <div
          className="absolute inset-0 bg-blue-300 dark:bg-blue-600 z-0"
          style={{ pointerEvents: "none" }}
        />
      )}
        <span className="relative z-10">{cell.value !== 0 ? cell.value : ""}</span>
    </div>
  );
}

export default Cell;
