"use client";
import { useState, useMemo } from "react";
import { diffLines } from "diff";
import DiffViewer from "./DiffViewer";

interface MergeConflictResolverProps {
  userContent: string;
  serverContent: string;
  onResolve: (resolvedContent: string) => void;
  onCancel: () => void;
}

type ConflictBlock = {
  id: number;
  userLines: string;
  serverLines: string;
  diff: [number, string][];
  resolved: "user" | "server" | null;
};

export default function MergeConflictResolver({
  userContent,
  serverContent,
  onResolve,
  onCancel,
}: MergeConflictResolverProps) {
  const conflicts = useMemo(() => {
    const diff = diffLines(userContent, serverContent);
    const blocks: ConflictBlock[] = [];
    let blockId = 0;
    let userBuffer = "";
    let serverBuffer = "";

    for (let i = 0; i < diff.length; i++) {
      const change = diff[i];
      
      if (change.removed) {
        userBuffer += change.value;
      } else if (change.added) {
        serverBuffer += change.value;
      } else {
        // Si on a accumulé des changements, créer un bloc
        if (userBuffer || serverBuffer) {
          const blockDiff: [number, string][] = [];
          if (userBuffer) blockDiff.push([-1, userBuffer]);
          if (serverBuffer) blockDiff.push([1, serverBuffer]);
          
          blocks.push({
            id: blockId++,
            userLines: userBuffer,
            serverLines: serverBuffer,
            diff: blockDiff,
            resolved: null,
          });
          userBuffer = "";
          serverBuffer = "";
        }
      }
    }

    // Dernier bloc si nécessaire
    if (userBuffer || serverBuffer) {
      const blockDiff: [number, string][] = [];
      if (userBuffer) blockDiff.push([-1, userBuffer]);
      if (serverBuffer) blockDiff.push([1, serverBuffer]);
      
      blocks.push({
        id: blockId++,
        userLines: userBuffer,
        serverLines: serverBuffer,
        diff: blockDiff,
        resolved: null,
      });
    }

    return blocks;
  }, [userContent, serverContent]);

  const [resolutions, setResolutions] = useState<Map<number, ConflictBlock>>(
    new Map(conflicts.map((c) => [c.id, c]))
  );

  const handleResolve = (blockId: number, type: "user" | "server") => {
    setResolutions((prev) => {
      const newMap = new Map(prev);
      const block = newMap.get(blockId);
      if (block) {
        newMap.set(blockId, { ...block, resolved: type });
      }
      return newMap;
    });
  };

  const allResolved = Array.from(resolutions.values()).every((b) => b.resolved !== null);

  const applyResolution = () => {
    let result = serverContent;
    const sortedBlocks = Array.from(resolutions.values()).sort((a, b) => b.id - a.id);

    sortedBlocks.forEach((block) => {
      if (block.resolved === "user" && block.userLines) {
        result = result.replace(block.serverLines, block.userLines);
      }
    });

    onResolve(result);
  };

  if (conflicts.length === 0) {
    return null;
  }

  return (
    <div className="bg-red-900 border-l-4 border-red-500 text-red-100 p-6 my-6 rounded-md">
      <h2 className="text-2xl font-bold mb-3">⚠️ Conflit détecté</h2>
      <p className="text-sm mb-6">
        Quelqu&apos;un a modifié cette patchnote pendant que tu travaillais dessus. 
        Résous les conflits ci-dessous en choisissant quelle version garder pour chaque changement.
      </p>

      <div className="space-y-6">
        {Array.from(resolutions.values()).map((block) => (
          <div key={block.id} className="bg-gray-800 rounded-lg p-4 border-2 border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">Conflit #{block.id + 1}</h3>
              {block.resolved && (
                <span className="px-3 py-1 bg-green-600 rounded text-sm font-semibold">
                  ✓ Résolu ({block.resolved === "user" ? "Ton texte" : "Version serveur"})
                </span>
              )}
            </div>

            <div className="bg-gray-900 rounded p-4 mb-4">
              <p className="text-xs font-semibold mb-3 text-gray-400">APERÇU DES CHANGEMENTS</p>
              <DiffViewer diff={block.diff} />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleResolve(block.id, "user")}
                className={`flex-1 py-2 px-4 rounded font-semibold transition ${
                  block.resolved === "user"
                    ? "bg-red-600 text-white ring-2 ring-red-400"
                    : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                }`}
              >
                Garder mon texte
              </button>
              <button
                onClick={() => handleResolve(block.id, "server")}
                className={`flex-1 py-2 px-4 rounded font-semibold transition ${
                  block.resolved === "server"
                    ? "bg-green-600 text-white ring-2 ring-green-400"
                    : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                }`}
              >
                Garder version serveur
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-6 pt-4 border-t border-red-800">
        <button
          onClick={applyResolution}
          disabled={!allResolved}
          className={`flex-1 py-3 px-6 rounded font-bold transition ${
            allResolved
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-gray-600 text-gray-400 cursor-not-allowed"
          }`}
        >
          {allResolved ? "Appliquer et continuer" : `Résoudre tous les conflits (${Array.from(resolutions.values()).filter(b => b.resolved).length}/${resolutions.size})`}
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded font-bold transition"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
