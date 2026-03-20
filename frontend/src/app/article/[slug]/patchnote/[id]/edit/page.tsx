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
import { useAuth } from "@/providers/AuthProvider";
import { useFormCache } from "@/hooks/useFormCache";
import { FormField, FIELD_CLASS } from "@/components/shared/FormField";
import { MDEditorStyles } from "@/components/shared/MDEditorStyles";

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
  const { isAuthenticated } = useAuth();

  const cacheKey = `playdex-edit-patchnote-${id}`;
  const { loadCachedForm, clearCache } = useFormCache(cacheKey, form);

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

      // Restore cached form if available, otherwise use server data
      const cached = loadCachedForm();
      setForm(cached ?? {
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
      clearCache();
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
    <PageSection className="py-4">
      {/* ── Page title ── */}
      <h1 className="text-2xl font-bold text-off-white mb-4">
        {t("patchnote.editTitle", { game: gameName })}
      </h1>

      {/* ── Warning banner ── */}
      <div
        role="alert"
        className="flex items-start gap-3 bg-yellow-950 border-l-4 border-yellow-500 text-yellow-100 text-sm p-3 rounded-md mb-4"
      >
        <FaExclamationTriangle
          className="text-yellow-400 mt-0.5 flex-shrink-0"
          size={16}
        />
        <p>
          <span className="font-bold">Attention — </span>
          {t("patchnote.warningEditText")}{" "}
          <Link href="/community-guidelines" className="underline hover:text-yellow-300 transition-colors">
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
        className={`space-y-4 transition-opacity duration-200 ${
          isLoading ? "opacity-50 pointer-events-none select-none" : ""
        }`}
      >
        <fieldset disabled={isLoading} className="space-y-4">

          <div className="max-w-lg">
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-sm">
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

          <FormField label={t("patchnote.summaryLabel")} htmlFor="smallDescription">
            <textarea
              id="smallDescription"
              name="smallDescription"
              rows={2}
              value={form.smallDescription}
              onChange={(e) => setField("smallDescription", e.target.value)}
              placeholder={t("patchnote.summaryPlaceholder")}
              className={`${FIELD_CLASS} resize-none`}
            />
          </FormField>

          {/* Row 3 : Contenu MDEditor (grande zone wiki-like) */}
          <FormField label={t("patchnote.contentLabel")} htmlFor="content">
            <MDEditorStyles />
            <div className="playdex-editor" data-color-mode="dark">
              <MDEditor
                id="content"
                value={form.userContent}
                onChange={(val) => setField("userContent", val ?? "")}
                height={500}
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
            {isAuthenticated ? (
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
            ) : (
              <Link
                href="/login"
                className="
                  bg-primary hover:bg-secondary
                  text-white font-semibold
                  py-2 px-8 rounded
                  transition-colors duration-150
                  text-center
                "
              >
                {t("patchnote.loginToEdit")}
              </Link>
            )}
          </div>

        </fieldset>
      </form>
    </PageSection>
  );
}