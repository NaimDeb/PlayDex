import React from "react";
import { ICommand, TextAreaTextApi, TextState } from "@uiw/react-md-editor";
// Todo : add more commands, (rework, bugfix, etc...)


export const buffCommand: ICommand = {
  name: "buff",
  keyCommand: "buff",
  buttonProps: { "aria-label": "Buff", title: "Buff, méchaniques ayant été renforcées." },
  icon: (
    <span style={{ color: "#22c55e", fontWeight: "bold", fontSize: "18px" }}>
      ▲
    </span>
  ),
  execute: (state: TextState, api: TextAreaTextApi) => {
    const selectedText = state.selectedText || "";
    api.replaceSelection(`[buff]${selectedText}[/buff]`);
    if (!state.selectedText) {
      const pos = state.selection.start + 6;
      api.setSelectionRange({
        start: pos,
        end: pos + 4,
      });
    }
  },
};

export const debuffCommand: ICommand = {
  name: "debuff",
  keyCommand: "debuff",
  buttonProps: { "aria-label": "Nerf", title: "Nerfs, méchaniques ayant été rendues plus faibles" },
  icon: (
    <span style={{ color: "#ef4444", fontWeight: "bold", fontSize: "18px" }}>
      ▼
    </span>
  ),
  execute: (state: TextState, api: TextAreaTextApi) => {
    const selectedText = state.selectedText || "";
    api.replaceSelection(`[debuff]${selectedText}[/debuff]`);
    if (!state.selectedText) {
      const pos = state.selection.start + 8;
      api.setSelectionRange({
        start: pos,
        end: pos + 6,
      });
    }
  },
};