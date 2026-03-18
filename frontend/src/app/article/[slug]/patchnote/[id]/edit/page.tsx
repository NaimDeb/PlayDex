"use client";

import gameService from "@/lib/api/gameService";
import { getIdFromSlug } from "@/lib/gameSlug";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import { redirect, useParams } from "next/navigation";
import { Patchnote } from "@/types/patchNoteType";
import MDEditor, { commands as defaultCommands } from "@uiw/react-md-editor";
import { useFlashMessage } from "@/components/FlashMessage/FlashMessageProvider";
import { buffCommand, debuffCommand } from "@/components/MDEditor/customCommands";
import MergeConflictResolver from "@/components/MergeConflictResolver";
import { PageSection } from "@/components/PageSection";
import React from "react";
import { useTranslation } from "@/i18n/TranslationProvider";

// ─── Types ────────────────────────────────────────────────────────────────────

type ImportanceLevel = "minor" | "major" | "hotfix";

interface PatchnoteFormState {
  title: string;
  releasedAt: string;
  smallDescription: string;
  importance: ImportanceLevel;
  version: number;
  userContent: string;
}

// ─── Design tokens ────────────────────────────────────────────────────────────
//
// Partagés entre tous les champs du formulaire — même DA que FiltersSidebar.

const FIELD_CLASS =
  "w-full bg-off-black border border-gray-600 rounded px-3 py-2.5 text-sm text-off-white " +
  "placeholder:text-gray-600 focus:outline-none focus:border-primary transition-colors [color-scheme:dark]";

const LABEL_CLASS = "block text-sm font-semibold text-gray-300 mb-1.5";

// ─── Sub-components ───────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}

function FormField({ label, htmlFor, children }: FormFieldProps): React.ReactElement {
  return (
    <div className="flex flex-col">
      <label htmlFor={htmlFor} className={LABEL_CLASS}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditPatchnotePage(): React.ReactElement {
  const params = useParams();
  const slug = params.slug as string;
  const id = params.id as string;

  const [gameName, setGameName] = useState<string>("");
  const [gameReleaseDate, setGameReleaseDate] = useState<string>("");
  const [isPatchNoteTitleChanged, setPatchNoteTitleChanged] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [conflict, setConflict] = useState<{ serverContent: string } | null>(null);

  const [form, setForm] = useState<PatchnoteFormState>({
    title: "",
    releasedAt: "",
    smallDescription: "",
    importance: "minor",
    version: 0,
    userContent: "",
  });

  const { showMessage } = useFlashMessage();
  const { t } = useTranslation();

  // ── Setters helpers ──

  const setField = <K extends keyof PatchnoteFormState>(
    key: K,
    value: PatchnoteFormState[K]
  ): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ── Fetch ──

  useEffect(() => {
    if (!slug || !id) return;

    const fetchData = async (): Promise<void> => {
      const gameId = getIdFromSlug(slug);
      const [gameData, patchnoteData] = await Promise.all([
        gameService.getGameById(gameId),
        gameService.getPatchNoteById(id),
      ]);

      setGameName(gameData.title);
      setGameReleaseDate(gameData.releasedAt);

      setForm({
        title: patchnoteData.title ?? "",
        releasedAt: patchnoteData.releasedAt
          ? new Date(patchnoteData.releasedAt).toISOString().slice(0, 10)
          : "",
        smallDescription: patchnoteData.smallDescription ?? "",
        importance: patchnoteData.importance ?? "minor",
        version: patchnoteData.version ?? 0,
        userContent: patchnoteData.content ?? "",
      });
    };

    fetchData().catch((err) => console.error("[EditPatchnote] fetchData:", err));
  }, [slug, id]);

  // ── Handlers ──

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const selectedDate = e.target.value;
    const formattedDate = selectedDate.split("-").reverse().join("/");
    const newTitle = `Patch Note - ${formattedDate}`;

    setForm((prev) => ({
      ...prev,
      releasedAt: selectedDate,
      title:
        !isPatchNoteTitleChanged || prev.title.startsWith("Patch Note") || prev.title === ""
          ? newTitle
          : prev.title,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);

    const updatedPatchnote: Partial<Patchnote> = {
      title: form.title,
      smallDescription: form.smallDescription,
      importance: form.importance,
      content: form.userContent,
      version: form.version,
      ...(form.releasedAt ? { releasedAt: new Date(form.releasedAt) } : {}),
    };

    try {
      await gameService.patchPatchnote(id, updatedPatchnote);
      showMessage(t("patchnote.editSuccess"), "success");
      redirect(`/article/${slug}/patchnote/${id}`);
    } catch (error: unknown) {
      const err = error as { response?: { status?: number }; message?: string };

      if (err.message?.includes("NEXT_REDIRECT")) throw error;

      if (err.response?.status === 409) {
        const serverData = await gameService.getPatchNoteById(id);
        setConflict({ serverContent: serverData.content ?? "" });
        setField("version", serverData.version ?? 0);
        showMessage(t("patchnote.editConflict"), "error");
      } else {
        showMessage(t("patchnote.editError"), "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ──

  return (
    <PageSection className="py-8">
      {/* ── Page title ── */}
      <h1 className="text-2xl font-bold text-off-white mb-6">
        {t("patchnote.editTitle", { game: gameName })}
      </h1>

      {/* ── Warning banner ── */}
      <div
        role="alert"
        className="
          flex items-start gap-3
          bg-yellow-950 border-l-4 border-yellow-500
          text-yellow-100 text-sm p-4 rounded-md mb-8
        "
      >
        <FaExclamationTriangle
          className="text-yellow-400 mt-0.5 flex-shrink-0"
          size={16}
        />
        <p>
          <span className="font-bold">Attention — </span>
          {t("patchnote.warningEditText")}{" "}
          <Link href="/rules" className="underline hover:text-yellow-300 transition-colors">
            {t("patchnote.rulesLink")}
          </Link>
          . {t("patchnote.warningConsequence")}
        </p>
      </div>

      {/* ── Merge conflict resolver ── */}
      {conflict && (
        <MergeConflictResolver
          userContent={form.userContent}
          serverContent={conflict.serverContent}
          onResolve={(resolvedContent: string) => {
            setField("userContent", resolvedContent);
            setConflict(null);
          }}
          onCancel={() => setConflict(null)}
        />
      )}

      {/* ── Form ── */}
      <form
        onSubmit={handleSubmit}
        className={`space-y-6 transition-opacity duration-200 ${
          isLoading ? "opacity-50 pointer-events-none select-none" : ""
        }`}
      >
        <fieldset disabled={isLoading} className="space-y-6">

          {/* Row : Titre + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FormField label={t("patchnote.titleLabel")} htmlFor="title">
              <input
                type="text"
                id="title"
                name="title"
                value={form.title}
                onChange={(e) => {
                  setField("title", e.target.value);
                  setPatchNoteTitleChanged(true);
                }}
                className={FIELD_CLASS}
              />
            </FormField>

            <FormField label={t("patchnote.dateLabel")} htmlFor="releasedAt">
              <input
                type="date"
                id="releasedAt"
                name="releasedAt"
                min={gameReleaseDate}
                value={form.releasedAt}
                onChange={handleDateChange}
                className={FIELD_CLASS}
              />
            </FormField>
          </div>

          {/* Row : Résumé + Importance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FormField label={t("patchnote.summaryLabel")} htmlFor="smallDescription">
              <textarea
                id="smallDescription"
                name="smallDescription"
                rows={3}
                value={form.smallDescription}
                onChange={(e) => setField("smallDescription", e.target.value)}
                placeholder={t("patchnote.summaryPlaceholder")}
                className={`${FIELD_CLASS} resize-none`}
              />
            </FormField>

            <FormField label={t("patchnote.importanceLabel")} htmlFor="importance">
              <select
                id="importance"
                name="importance"
                value={form.importance}
                onChange={(e) => setField("importance", e.target.value as ImportanceLevel)}
                className={FIELD_CLASS}
              >
                <option value="minor">Minor</option>
                <option value="major">Major</option>
                <option value="hotfix">Hotfix</option>
              </select>
            </FormField>
          </div>

          {/* Contenu MDEditor */}
          <FormField label={t("patchnote.contentLabel")} htmlFor="content">
            {/*
              On injecte les overrides CSS du MDEditor directement ici via un <style> scoped.
              Le composant n'expose pas de prop `className` utilisable pour le thème complet,
              donc on cible ses classes internes.
            */}
            <style>{`
              .playdex-editor .w-md-editor {
                background-color: #1A1A1A !important;
                border: 1px solid #4B5563 !important;
                border-radius: 6px !important;
                color: #F0F0F0 !important;
                box-shadow: none !important;
              }
              .playdex-editor .w-md-editor-toolbar {
                background-color: #2D2D2D !important;
                border-bottom: 1px solid #4B5563 !important;
                padding: 4px 8px !important;
              }
              .playdex-editor .w-md-editor-toolbar li button {
                color: #9CA3AF !important;
              }
              .playdex-editor .w-md-editor-toolbar li button:hover {
                color: #F0F0F0 !important;
                background-color: #374151 !important;
              }
              .playdex-editor .w-md-editor-toolbar-divider {
                background-color: #4B5563 !important;
              }
              .playdex-editor .w-md-editor-text-textarea,
              .playdex-editor .w-md-editor-text-pre > code,
              .playdex-editor .w-md-editor-text {
                background-color: #1A1A1A !important;
                color: #F0F0F0 !important;
                font-size: 14px !important;
                caret-color: #F0F0F0 !important;
              }
              .playdex-editor .w-md-editor-preview {
                background-color: #1A1A1A !important;
                color: #F0F0F0 !important;
                border-left: 1px solid #4B5563 !important;
              }
              .playdex-editor .w-md-editor-preview .wmde-markdown {
                background-color: transparent !important;
                color: #F0F0F0 !important;
                font-size: 14px !important;
              }
              .playdex-editor .w-md-editor-preview .wmde-markdown a {
                color: #7173FF !important;
              }
              .playdex-editor .w-md-editor-preview .wmde-markdown code {
                background-color: #2D2D2D !important;
                color: #F0F0F0 !important;
              }
              .playdex-editor .w-md-editor-preview .wmde-markdown blockquote {
                border-left-color: #4D40FF !important;
                color: #9CA3AF !important;
              }
              .playdex-editor .w-md-editor:focus-within {
                border-color: #4D40FF !important;
              }
            `}</style>
            <div className="playdex-editor" data-color-mode="dark">
              <MDEditor
                id="content"
                value={form.userContent}
                onChange={(val) => setField("userContent", val ?? "")}
                textareaProps={{
                  autoCapitalize: "none",
                  disabled: isLoading,
                }}
                commands={[
                  defaultCommands.bold,
                  defaultCommands.italic,
                  defaultCommands.divider,
                  buffCommand,
                  debuffCommand,
                  defaultCommands.divider,
                  defaultCommands.link,
                  defaultCommands.quote,
                  defaultCommands.unorderedListCommand,
                  defaultCommands.orderedListCommand,
                  defaultCommands.checkedListCommand,
                ]}
                visibleDragbar={false}
                tabIndex={isLoading ? -1 : 0}
              />
            </div>
          </FormField>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="
                bg-primary hover:bg-secondary
                text-white font-semibold
                py-2 px-8 rounded
                transition-colors duration-150
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {isLoading ? t("common.saving") : t("common.save")}
            </button>
          </div>

        </fieldset>
      </form>
    </PageSection>
  );
}