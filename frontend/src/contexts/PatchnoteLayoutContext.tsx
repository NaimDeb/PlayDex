"use client";
import { createContext, useContext } from "react";
import { Patchnote } from "@/types/patchNoteType";
import { Game } from "@/types/gameType";

type PatchnoteLayoutContextType = {
  patchnote: Patchnote | null;
  game: Game | null;
  loading: boolean;
};

const PatchnoteLayoutContext = createContext<PatchnoteLayoutContextType>({
  patchnote: null,
  game: null,
  loading: true,
});

export function usePatchnoteLayout() {
  return useContext(PatchnoteLayoutContext);
}

export { PatchnoteLayoutContext };
