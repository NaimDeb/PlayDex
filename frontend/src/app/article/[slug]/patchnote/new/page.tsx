"use client";

import gameService from "@/lib/api/gameService";
import { getIdFromSlug } from "@/lib/gameSlug";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import { redirect } from "next/navigation";
import MDEditor, { commands as defaultCommands } from "@uiw/react-md-editor";
import { useFlashMessage } from "@/components/FlashMessage/FlashMessageProvider";
import { useAuth } from "@/providers/AuthProvider";
import { PageSection } from "@/components/PageSection";
import React from "react";

import {
  buffCommand,
  debuffCommand,
} from "@/components/MDEditor/customCommands";
import { useTranslation } from "@/i18n/TranslationProvider";
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
  userContent: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewPatchnotePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isAuthenticated } = useAuth();
  const { showMessage } = useFlashMessage();
  const { t } = useTranslation();

  const [gameName, setGameName] = useState<string>("");
  const [gameReleaseDate, setGameReleaseDate] = useState<string>("");
  const [isPatchNoteTitleChanged, setPatchNoteTitleChanged] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const [form, setForm] = useState<PatchnoteFormState>({
    title: "Patch Note",
    releasedAt: "",
    smallDescription: "",
    importance: "minor",
    userContent: "",
  });

  const cacheKey = `playdex-new-patchnote-${slug}`;
  const { loadCachedForm, clearCache } = useFormCache(cacheKey, form);

  // ── Setters helpers ──

  const setField = <K extends keyof PatchnoteFormState>(
    key: K,
    value: PatchnoteFormState[K]
  ): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ── Fetch game + restore cache ──

  useEffect(() => {
    const gameId = getIdFromSlug(slug);

    const fetchGameData = async (): Promise<void> => {
      setIsLoading(true);
      const gameData = await gameService.getGameById(gameId);
      setGameName(gameData.title);
      setGameReleaseDate(gameData.releasedAt);

      // Restore cached form if available
      const cached = loadCachedForm();
      if (cached) setForm(cached);

      setIsLoading(false);
    };

    fetchGameData().catch((err) => {
      console.error("[NewPatchnote] fetchGameData:", err);
      setIsLoading(false);
    });
  }, [slug]);

  // ── Validation ──

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = t("patchnote.errorTitleRequired");
    if (!form.releasedAt) errors.releasedAt = t("patchnote.errorDateRequired");
    if (!form.smallDescription.trim()) errors.smallDescription = t("patchnote.errorSummaryRequired");
    if (!form.userContent.trim()) errors.userContent = t("patchnote.errorContentRequired");
    return errors;
  };

  const errors = submitted ? validate() : {};
  const isFormValid = Object.keys(validate()).length === 0;

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
    setSubmitted(true);

    if (!isFormValid) return;

    setIsLoading(true);

    const gameId = `/api/games/${getIdFromSlug(slug)}`;
    const payload: Record<string, string> = {
      title: form.title,
      smallDescription: form.smallDescription,
      importance: form.importance,
      content: form.userContent,
      game: gameId,
      ...(form.releasedAt ? { releasedAt: new Date(form.releasedAt).toISOString() } : {}),
    };

    try {
      await gameService.postPatchnote(payload);
      clearCache();
      showMessage(t("patchnote.createSuccess"), "success");
      redirect(`/article/${slug}`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (err.message?.includes("NEXT_REDIRECT")) throw error;
      showMessage(t("patchnote.createError"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ──

  return (
    <PageSection className="py-4">
      {/* ── Page title ── */}
      <h1 className="text-2xl font-bold text-off-white mb-4">
        {t("patchnote.newTitle", { game: gameName })}
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
          {t("patchnote.warningText")}{" "}
          <Link href="/community-guidelines" className="underline hover:text-yellow-300 transition-colors">
            {t("patchnote.rulesLink")}
          </Link>
          . {t("patchnote.warningConsequence")}
        </p>
      </div>

      {/* ── Form ── */}
      <form
        onSubmit={handleSubmit}
        className={`space-y-4 transition-opacity duration-200 ${
          isLoading ? "opacity-50 pointer-events-none select-none" : ""
        }`}
      >
        <fieldset disabled={isLoading} className="space-y-4">

          <div className="max-w-lg">
            <FormField label={t("patchnote.titleLabel")} htmlFor="title" required error={errors.title}>
              <input
                type="text"
                id="title"
                name="title"
                value={form.title}
                onChange={(e) => {
                  setField("title", e.target.value);
                  setPatchNoteTitleChanged(true);
                }}
                className={`${FIELD_CLASS} ${errors.title ? "border-red-500" : ""}`}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-sm">
            <FormField label={t("patchnote.dateLabel")} htmlFor="releasedAt" required error={errors.releasedAt}>
              <input
                type="date"
                id="releasedAt"
                name="releasedAt"
                min={gameReleaseDate}
                value={form.releasedAt}
                onChange={handleDateChange}
                className={`${FIELD_CLASS} ${errors.releasedAt ? "border-red-500" : ""}`}
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

          <FormField label={t("patchnote.summaryLabel")} htmlFor="smallDescription" required error={errors.smallDescription}>
            <textarea
              id="smallDescription"
              name="smallDescription"
              rows={2}
              value={form.smallDescription}
              onChange={(e) => setField("smallDescription", e.target.value)}
              placeholder={t("patchnote.summaryPlaceholder")}
              className={`${FIELD_CLASS} resize-none ${errors.smallDescription ? "border-red-500" : ""}`}
            />
          </FormField>

          {/* Row 3 : Contenu MDEditor (grande zone wiki-like) */}
          <FormField label={t("patchnote.contentLabel")} htmlFor="content" required error={errors.userContent}>
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
                {isLoading ? t("common.publishing") : t("common.publish")}
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
                {t("patchnote.loginToCreate")}
              </Link>
            )}
          </div>

        </fieldset>
      </form>
    </PageSection>
  );
}
