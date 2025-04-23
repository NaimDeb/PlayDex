import React from "react";

type DiffArray = [number, string][];

interface DiffViewerProps {
  diff: DiffArray;
}

function semanticCleanup(diff: DiffArray): DiffArray {
    if (!diff.length) return [];
    const result: DiffArray = [];
    let lastOp = diff[0][0];
    let buffer = diff[0][1];
  
    for (let i = 1; i < diff.length; i++) {
      const [op, text] = diff[i];
      if (op === lastOp) {
        buffer += text;
      } else {
        result.push([lastOp, buffer]);
        lastOp = op;
        buffer = text;
      }
    }
    result.push([lastOp, buffer]);
    return result;
  }

export default function DiffViewer({ diff }: DiffViewerProps) {
    const cleaned = semanticCleanup(diff);

  return (
    <span>
      {cleaned.map(([op, text], i) => {
        if (!text) return null;
        if (op === -1)
          return (
            <del key={i} style={{ background: "#ffdddd", color: "#c00", textDecoration: "line-through" }}>
              {text}
            </del>
          );
        if (op === 1)
          return (
            <ins key={i} style={{ background: "#ddffdd", color: "#080", textDecoration: "none" }}>
              {text}
            </ins>
          );
        return <span key={i}>{text}</span>;
      })}
    </span>
  );
}