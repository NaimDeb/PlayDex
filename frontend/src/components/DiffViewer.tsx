import React from "react";

type DiffArray = [number, string][];

interface DiffViewerProps {
  diff: DiffArray;
}

function semanticCleanup(diff: DiffArray): DiffArray {
  if (!diff.length) return [];

  // First pass: merge consecutive operations of the same type
  const merged: DiffArray = [];
  let lastOp = diff[0][0];
  let buffer = diff[0][1];

  for (let i = 1; i < diff.length; i++) {
    const [op, text] = diff[i];
    if (op === lastOp) {
      buffer += text;
    } else {
      merged.push([lastOp, buffer]);
      lastOp = op;
      buffer = text;
    }
  }
  merged.push([lastOp, buffer]);

  // Second pass: eliminate trivial edits and noise
  let cleaned = eliminateTrivialEdits(merged);

  // Third pass: semantic cleanup - factor out coincidental commonalities
  cleaned = semanticMerge(cleaned);

  // Fourth pass: improve word and sentence boundaries
  cleaned = improveWordBoundaries(cleaned);

  // Fifth pass: final cleanup
  return cleaned.filter(([, text]) => text.length > 0);
}

function eliminateTrivialEdits(diff: DiffArray): DiffArray {
  const cleaned: DiffArray = [];

  for (let i = 0; i < diff.length; i++) {
    const [op, text] = diff[i];

    // Skip very small changes that are likely noise
    if (op !== 0) {
      // Skip single whitespace changes
      if (text.length === 1 && /^\s$/.test(text)) {
        continue;
      }

      // Skip tiny punctuation-only changes
      if (text.length <= 2 && /^[^\w\s]+$/.test(text)) {
        continue;
      }

      // Skip changes that are just case differences of single characters
      if (text.length === 1 && i > 0 && i < diff.length - 1) {
        const prev = diff[i - 1];
        const next = diff[i + 1];
        if (prev[0] === 0 && next[0] === 0) {
          const prevChar = prev[1].slice(-1);
          const nextChar = next[1].slice(0, 1);
          if (
            prevChar.toLowerCase() === text.toLowerCase() ||
            nextChar.toLowerCase() === text.toLowerCase()
          ) {
            continue;
          }
        }
      }
    }

    cleaned.push([op, text]);
  }

  return cleaned;
}

function semanticMerge(diff: DiffArray): DiffArray {
  if (diff.length <= 2) return diff;

  const result: DiffArray = [];
  let i = 0;

  while (i < diff.length) {
    const current = diff[i];

    // Look for patterns like: EQUAL + DELETE + EQUAL + INSERT + EQUAL
    // or DELETE + EQUAL + INSERT where the EQUAL part is common
    if (i < diff.length - 2) {
      const pattern = findCommonSubsequences(diff, i);
      if (pattern) {
        result.push(...pattern.merged);
        i = pattern.nextIndex;
        continue;
      }
    }

    result.push(current);
    i++;
  }

  return result;
}

function findCommonSubsequences(
  diff: DiffArray,
  startIndex: number
): { merged: DiffArray; nextIndex: number } | null {
  const maxLookAhead = Math.min(6, diff.length - startIndex);

  for (let lookAhead = 3; lookAhead <= maxLookAhead; lookAhead++) {
    const slice = diff.slice(startIndex, startIndex + lookAhead);

    // Pattern: DELETE + EQUAL + INSERT
    if (
      slice.length >= 3 &&
      slice[0][0] === -1 &&
      slice[1][0] === 0 &&
      slice[2][0] === 1
    ) {
      const [, delText] = slice[0];
      const [, eqText] = slice[1];
      const [, insText] = slice[2];

      // Check if the equal part is truly common or just coincidental
      if (isSignificantCommonality(eqText, delText, insText)) {
        // Keep the equal part separate, merge the changes
        return {
          merged: [
            [-1, delText],
            [0, eqText],
            [1, insText],
          ],
          nextIndex: startIndex + 3,
        };
      } else {
        // Factor out the common part - merge it into the changes
        return {
          merged: [
            [-1, delText + eqText],
            [1, eqText + insText],
          ],
          nextIndex: startIndex + 3,
        };
      }
    }

    // Pattern: EQUAL + DELETE + INSERT + EQUAL (word replacement)
    if (
      slice.length >= 4 &&
      slice[0][0] === 0 &&
      slice[1][0] === -1 &&
      slice[2][0] === 1 &&
      slice[3][0] === 0
    ) {
      const beforeEqual = slice[0][1];
      const deleted = slice[1][1];
      const inserted = slice[2][1];
      const afterEqual = slice[3][1];

      // Check if this looks like a word replacement
      if (isWordReplacement(beforeEqual, deleted, inserted, afterEqual)) {
        return {
          merged: [
            [0, beforeEqual],
            [-1, deleted],
            [1, inserted],
            [0, afterEqual],
          ],
          nextIndex: startIndex + 4,
        };
      }
    }
  }

  return null;
}

function isSignificantCommonality(
  commonText: string,
  context1: string,
  context2: string
): boolean {
  // Empty or very short common parts are usually not significant
  if (commonText.length <= 1) return false;

  // Whitespace-only commonality is usually not significant
  if (/^\s+$/.test(commonText)) return false;

  // Single punctuation is usually not significant
  if (commonText.length <= 2 && /^[^\w\s]+$/.test(commonText)) return false;

  // If the common part is a significant portion of the context, it's meaningful
  const contextLength = Math.max(context1.length, context2.length);
  if (commonText.length > contextLength * 0.3) return true;

  // If it's a complete word or contains word boundaries, it's significant
  if (/\b\w+\b/.test(commonText) && commonText.length > 3) return true;

  // If it contains sentence-ending punctuation, it's significant
  if (/[.!?]\s*$/.test(commonText)) return true;

  return false;
}

function isWordReplacement(
  before: string,
  deleted: string,
  inserted: string,
  after: string
): boolean {
  // Check if this looks like a complete word replacement
  const beforeEndsWithWordBoundary = /\s$/.test(before) || before === "";
  const afterStartsWithWordBoundary = /^\s/.test(after) || after === "";
  const deletedIsWord = /^\w+$/.test(deleted.trim());
  const insertedIsWord = /^\w+$/.test(inserted.trim());

  return (
    beforeEndsWithWordBoundary &&
    afterStartsWithWordBoundary &&
    deletedIsWord &&
    insertedIsWord
  );
}

function improveWordBoundaries(diff: DiffArray): DiffArray {
  const improved: DiffArray = [];

  for (let i = 0; i < diff.length; i++) {
    const [op, text] = diff[i];

    if (op === 0) {
      improved.push([op, text]);
      continue;
    }

    let processedText = text;

    // Try to extend changes to natural boundaries
    if (i > 0 && i < diff.length - 1) {
      const prevEntry = diff[i - 1];
      const nextEntry = diff[i + 1];

      if (prevEntry[0] === 0 && nextEntry[0] === 0) {
        const prevText = prevEntry[1];
        const nextText = nextEntry[1];

        // Extend to word boundaries
        processedText = extendToWordBoundary(
          processedText,
          prevText,
          nextText,
          prevEntry,
          nextEntry
        );

        // Extend to sentence boundaries if it makes sense
        processedText = extendToSentenceBoundary(
          processedText,
          prevText,
          nextText,
          prevEntry,
          nextEntry
        );
      }
    }

    improved.push([op, processedText]);
  }

  return improved;
}

function extendToWordBoundary(
  text: string,
  prevText: string,
  nextText: string,
  prevEntry: DiffArray[0],
  nextEntry: DiffArray[0]
): string {
  let result = text;

  // Extend backwards to include partial words
  if (/\w/.test(prevText.slice(-1)) && /\w/.test(result.slice(0, 1))) {
    const wordMatch = prevText.match(/\w+$/);
    if (wordMatch && wordMatch[0].length <= 10) {
      // Don't extend very long words
      result = wordMatch[0] + result;
      prevEntry[1] = prevText.slice(0, -wordMatch[0].length);
    }
  }

  // Extend forwards to include partial words
  if (/\w/.test(result.slice(-1)) && /\w/.test(nextText.slice(0, 1))) {
    const wordMatch = nextText.match(/^\w+/);
    if (wordMatch && wordMatch[0].length <= 10) {
      // Don't extend very long words
      result = result + wordMatch[0];
      nextEntry[1] = nextText.slice(wordMatch[0].length);
    }
  }

  return result;
}

function extendToSentenceBoundary(
  text: string,
  prevText: string,
  nextText: string,
  prevEntry: DiffArray[0],
  nextEntry: DiffArray[0]
): string {
  let result = text;

  // If we're at the end of a sentence, try to include the punctuation
  if (/[.!?]/.test(nextText.slice(0, 1)) && !/[.!?]/.test(result.slice(-1))) {
    const punctMatch = nextText.match(/^[.!?]\s*/);
    if (punctMatch) {
      result = result + punctMatch[0];
      nextEntry[1] = nextText.slice(punctMatch[0].length);
    }
  }

  // If we're at the start of a sentence, try to include proper capitalization context
  if (/[.!?]\s+$/.test(prevText) && /^[A-Z]/.test(result)) {
    // This looks like the start of a new sentence, keep it clean
    return result;
  }

  return result;
}

export default function DiffViewer({ diff }: DiffViewerProps) {
  const cleaned = semanticCleanup(diff);

  // Group consecutive changes for better visual presentation
  const groupedChanges: Array<{
    type: "unchanged" | "modified";
    items: DiffArray;
  }> = [];
  let currentGroup: {
    type: "unchanged" | "modified";
    items: DiffArray;
  } | null = null;

  for (const [op, text] of cleaned) {
    const isUnchanged = op === 0;
    const groupType = isUnchanged ? "unchanged" : "modified";

    if (!currentGroup || currentGroup.type !== groupType) {
      currentGroup = { type: groupType, items: [] };
      groupedChanges.push(currentGroup);
    }

    currentGroup.items.push([op, text]);
  }

  return (
    <div className="font-mono text-sm leading-relaxed diff-viewer">
      {groupedChanges.map((group, groupIndex) => {
        if (group.type === "unchanged") {
          // For unchanged text, just show it normally but with subtle styling
          return (
            <span key={groupIndex} className="text-gray-300">
              {group.items.map(([, text]) => text).join("")}
            </span>
          );
        } else {
          // For modified sections, show them with clear visual distinction
          return (
            <span key={groupIndex} className="diff-changes">
              {group.items.map(([op, text], i) => {
                if (!text) return null;

                if (op === -1) {
                  return (
                    <del
                      key={i}
                      className="px-1 text-red-300 border-l-2 border-red-500 rounded-sm bg-red-900/30 decoration-red-500"
                      title="Texte supprimé"
                    >
                      {text}
                    </del>
                  );
                }

                if (op === 1) {
                  return (
                    <ins
                      key={i}
                      className="px-1 text-green-300 no-underline border-l-2 border-green-500 rounded-sm bg-green-900/30"
                      title="Texte ajouté"
                    >
                      {text}
                    </ins>
                  );
                }

                return (
                  <span key={i} className="text-gray-300">
                    {text}
                  </span>
                );
              })}
            </span>
          );
        }
      })}

      {/* Legend for better UX */}
      <div className="flex gap-4 pt-3 mt-4 text-xs text-gray-400 border-t border-gray-600 diff-legend">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 border-l-2 border-green-500 rounded-sm bg-green-900/30"></span>
          <span>Ajouté</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 border-l-2 border-red-500 rounded-sm bg-red-900/30"></span>
          <span>Supprimé</span>
        </div>
      </div>
    </div>
  );
}
