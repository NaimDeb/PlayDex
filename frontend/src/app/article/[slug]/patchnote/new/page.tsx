"use client";

import gameService from "@/lib/api/gameService";
import { getIdFromSlug } from "@/lib/gameSlug";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import { redirect, useRouter } from "next/navigation";
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

// ─── Types ────────────────────────────────────────────────────────────────────

type ImportanceLevel = "minor" | "major" | "hotfix";

interface PatchnoteFormState {
  title: string;
  releasedAt: string;
  smallDescription: string;
  importance: ImportanceLevel;
  userContent: string;
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const FIELD_CLASS =
  "w-full bg-off-black border border-gray-600 rounded px-3 py-2.5 text-sm text-off-white " +
  "placeholder:text-gray-600 focus:outline-none focus:border-primary transition-colors [color-scheme:dark]";

const LABEL_CLASS = "block text-sm font-semibold text-gray-300 mb-1.5";

// ─── Sub-components ───────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

function FormField({ label, htmlFor, required, error, children }: FormFieldProps): React.ReactElement {
  return (
    <div className="flex flex-col">
      <label htmlFor={htmlFor} className={LABEL_CLASS}>
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewPatchnotePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
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

  // ── Setters helpers ──

  const setField = <K extends keyof PatchnoteFormState>(
    key: K,
    value: PatchnoteFormState[K]
  ): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ── Auth guard + fetch game ──

  useEffect(() => {
    if (!isAuthenticated) {
      showMessage(t("auth.loginRequired"), "error");
      router.push("/login");
      return;
    }

    const gameId = getIdFromSlug(slug);

    const fetchGameData = async (): Promise<void> => {
      setIsLoading(true);
      const gameData = await gameService.getGameById(gameId);
      setGameName(gameData.title);
      setGameReleaseDate(gameData.releasedAt);
      setIsLoading(false);
    };

    fetchGameData().catch((err) => {
      console.error("[NewPatchnote] fetchGameData:", err);
      setIsLoading(false);
    });
  }, [slug, isAuthenticated, router, showMessage]);

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
    <PageSection className="py-8">
      {/* ── Page title ── */}
      <h1 className="text-2xl font-bold text-off-white mb-6">
        {t("patchnote.newTitle", { game: gameName })}
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
          {t("patchnote.warningText")}{" "}
          <Link href="/rules" className="underline hover:text-yellow-300 transition-colors">
            {t("patchnote.rulesLink")}
          </Link>
          . {t("patchnote.warningConsequence")}
        </p>
      </div>

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
          </div>

          {/* Row : Résumé + Importance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FormField label={t("patchnote.summaryLabel")} htmlFor="smallDescription" required error={errors.smallDescription}>
              <textarea
                id="smallDescription"
                name="smallDescription"
                rows={3}
                value={form.smallDescription}
                onChange={(e) => setField("smallDescription", e.target.value)}
                placeholder={t("patchnote.summaryPlaceholder")}
                className={`${FIELD_CLASS} resize-none ${errors.smallDescription ? "border-red-500" : ""}`}
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
          <FormField label={t("patchnote.contentLabel")} htmlFor="content" required error={errors.userContent}>
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
              {isLoading ? t("common.publishing") : t("common.publish")}
            </button>
          </div>

        </fieldset>
      </form>
    </PageSection>
  );
}
