"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSafeContent from "@/lib/rehypeSafeContent";
import { colorizeContent } from "@/lib/utils";
import { steamBbcodeToMarkdown } from "@/lib/patchnoteContent";
import { PREVIEW_MARKDOWN_COMPONENTS } from "@/components/ArticleCard/PatchnoteCard";
import adminService, { ADMIN_PAGE_SIZE } from "@/lib/api/adminService";
import { DebouncedInput } from "@/components/shared/DebouncedInput";
import { Patchnote, Modification } from "@/types/patchNoteType";
import { User, BanUserData } from "@/types/authType";
import { useAuth } from "@/providers/AuthProvider";
import { useFlashMessage } from "@/components/FlashMessage/FlashMessageProvider";
import { Pagination } from "@/components/shared/Pagination";
import {
  PATCHNOTE_IMPORTANCE_STYLES,
  PATCHNOTE_IMPORTANCE_FALLBACK_STYLE,
} from "@/constants/patchnote.constants";

// Vocabulaire de boutons aligné sur ActionButton de la page patchnote
const BTN_BASE =
  "inline-block rounded-sm font-montserrat font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-40 disabled:pointer-events-none";
const BTN = {
  primary: `${BTN_BASE} bg-primary hover:bg-secondary text-off-white`,
  outlined: `${BTN_BASE} border border-off-white/30 text-off-white/80 hover:border-off-white/60 hover:bg-off-white/5`,
  danger: `${BTN_BASE} bg-red-500/10 border border-red-500/40 text-red-400 hover:bg-red-500/20`,
  warning: `${BTN_BASE} border border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/10`,
} as const;
const BTN_SM = "px-3 py-1 text-xs";
const BTN_MD = "px-4 py-2 text-sm";

const BADGE_BASE = "inline-block px-2.5 py-0.5 rounded-sm text-xs font-semibold";
const BANNED_BADGE = `${BADGE_BASE} bg-red-500/20 text-red-400 border border-red-500/40`;

const TABLE_HEAD_ROW =
  "text-left text-xs font-montserrat font-semibold uppercase tracking-wider text-off-white/60 bg-off-black/40 border-b border-off-white/10";
const TABLE_ROW =
  "border-b border-off-white/5 last:border-b-0 hover:bg-off-white/5 transition-colors";

function importanceBadge(importance?: string | null) {
  const style =
    PATCHNOTE_IMPORTANCE_STYLES[
      importance as keyof typeof PATCHNOTE_IMPORTANCE_STYLES
    ] ?? PATCHNOTE_IMPORTANCE_FALLBACK_STYLE;
  return `${BADGE_BASE} ${style.badge}`;
}

// Enhanced report interface with user details
interface ReportWithDetails {
  id: number;
  reason: string;
  reportableId: number;
  reportableEntity: string;
  reportedAt?: string;
  reportedBy?: {
    id: number;
    username: string;
  };
  entityDetails?: {
    type: string;
    id: number;
    title: string;
    deleted?: boolean;
    owner?: {
      id: number;
      username: string;
    };
    game?: {
      id: number;
      title: string;
    };
    patchnote?: {
      id: number;
      title: string;
    };
  };
}

interface ModalShellProps {
  title: string;
  onClose: () => void;
  maxWidth?: string;
  children: React.ReactNode;
}

function ModalShell({
  title,
  onClose,
  maxWidth = "max-w-2xl",
  children,
}: ModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-fast">
      <div
        className={`w-full ${maxWidth} max-h-[85vh] overflow-y-auto bg-off-gray border border-off-white/10 rounded-sm text-off-white`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-off-white/10">
          <h3 className="text-lg font-bold font-montserrat">{title}</h3>
          <button
            onClick={onClose}
            className="text-2xl leading-none text-off-white/50 hover:text-off-white"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// Ban form modal component
interface BanModalProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
  onBan: (userId: number, banData: BanUserData) => Promise<void>;
}

// Modification details modal component
interface ModificationDetailsModalProps {
  isOpen: boolean;
  modification: Modification | null;
  onClose: () => void;
}

// Report details modal component
interface ReportDetailsModalProps {
  isOpen: boolean;
  report: ReportWithDetails | null;
  onClose: () => void;
}

// Confirmation maison : ConfirmDialog (shadcn) rend un panneau clair,
// hors DA sur un site dark-only.
interface ConfirmState {
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
}

function ConfirmModal({
  state,
  onClose,
}: {
  state: ConfirmState | null;
  onClose: () => void;
}) {
  if (!state) return null;

  return (
    <ModalShell title="Confirmation" onClose={onClose} maxWidth="max-w-md">
      <p className="text-off-white/80">{state.message}</p>
      <div className="flex justify-end gap-2 mt-6">
        <button onClick={onClose} className={`${BTN.outlined} ${BTN_MD}`}>
          Annuler
        </button>
        <button
          onClick={() => {
            state.onConfirm();
            onClose();
          }}
          className={`${BTN.danger} ${BTN_MD}`}
        >
          {state.confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}

function PatchnotePreviewModal({
  patchnote,
  onClose,
}: {
  patchnote: Patchnote | null;
  onClose: () => void;
}) {
  if (!patchnote) return null;

  const content = colorizeContent(steamBbcodeToMarkdown(patchnote.content ?? ""));

  return (
    <ModalShell
      title={patchnote.title || "Sans titre"}
      onClose={onClose}
      maxWidth="max-w-3xl"
    >
      <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-off-white/60">
        <span className={importanceBadge(patchnote.importance)}>
          {patchnote.importance || "N/A"}
        </span>
        <span>
          {typeof patchnote.game === "string"
            ? patchnote.game
            : patchnote.game?.title || "Jeu inconnu"}
        </span>
        {patchnote.createdBy && <span>par {patchnote.createdBy.username}</span>}
        {patchnote.releasedAt && (
          <span>{new Date(patchnote.releasedAt).toLocaleDateString()}</span>
        )}
      </div>
      {patchnote.smallDescription && (
        <p className="mb-4 text-sm font-medium text-off-white/80">
          {patchnote.smallDescription}
        </p>
      )}
      <div className="p-4 overflow-y-auto max-h-[55vh] text-sm leading-relaxed border rounded-sm bg-off-black/40 border-off-white/5 text-off-white/70 patchnote-content">
        <ReactMarkdown
          rehypePlugins={[rehypeRaw, rehypeSafeContent]}
          components={PREVIEW_MARKDOWN_COMPONENTS}
        >
          {content}
        </ReactMarkdown>
      </div>
      <div className="flex justify-end mt-6">
        <button onClick={onClose} className={`${BTN.outlined} ${BTN_MD}`}>
          Fermer
        </button>
      </div>
    </ModalShell>
  );
}

function ReportDetailsModal({
  isOpen,
  report,
  onClose,
}: ReportDetailsModalProps) {
  if (!isOpen || !report) return null;

  const getEntityDisplayName = (report: ReportWithDetails) => {
    let entityType = report.reportableEntity;

    // Clean up entity type name - remove App\Entity\ prefix
    if (entityType.includes("\\")) {
      const parts = entityType.split("\\");
      entityType = parts[parts.length - 1] || entityType;
    }

    return `${entityType} n°${report.reportableId}`;
  };

  return (
    <ModalShell title={`Détails du signalement #${report.id}`} onClose={onClose}>
      <div className="space-y-4">
        {/* Signalement info */}
        <div className="p-4 border rounded-sm bg-off-black/40 border-off-white/5">
          <h4 className="mb-3 font-semibold font-montserrat">
            Informations du signalement
          </h4>
          <div className="space-y-2 text-sm text-off-white/70">
            <p>
              <strong className="text-off-white">Élément signalé :</strong>{" "}
              {getEntityDisplayName(report)}
            </p>
            <p>
              <strong className="text-off-white">Raison :</strong>{" "}
              {report.reason}
            </p>
            <p>
              <strong className="text-off-white">Date :</strong>{" "}
              {report.reportedAt
                ? new Date(report.reportedAt).toLocaleString()
                : "N/A"}
            </p>
            {report.reportedBy && (
              <p>
                <strong className="text-off-white">Signalé par :</strong>{" "}
                {report.reportedBy.username}
              </p>
            )}
          </div>
        </div>

        {/* Entity details */}
        {report.entityDetails && (
          <div className="p-4 border rounded-sm bg-off-black/40 border-off-white/5">
            <h4 className="mb-3 font-semibold font-montserrat">
              Détails de l&apos;élément signalé
            </h4>
            <div className="space-y-2 text-sm text-off-white/70">
              <p>
                <strong className="text-off-white">Type :</strong>{" "}
                {report.entityDetails.type}
              </p>
              {report.entityDetails.deleted && (
                <p className="text-red-400">Ce contenu a déjà été supprimé.</p>
              )}
              <p>
                <strong className="text-off-white">Titre :</strong>{" "}
                {report.entityDetails.title}
              </p>
              {report.entityDetails.game && (
                <p>
                  <strong className="text-off-white">Jeu :</strong>{" "}
                  {report.entityDetails.game.title}
                </p>
              )}
              {report.entityDetails.patchnote && (
                <p>
                  <strong className="text-off-white">Patchnote :</strong>{" "}
                  {report.entityDetails.patchnote.title}
                </p>
              )}
              {report.entityDetails.owner && (
                <p>
                  <strong className="text-off-white">Créé par :</strong>{" "}
                  {report.entityDetails.owner.username}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <div className="flex gap-2">
          {/* Redirection buttons based on entity type */}
          {report.entityDetails?.type === "Patchnote" &&
            report.entityDetails.game && (
              <Link
                href={`/article/${report.entityDetails.game.id}/patchnote/${report.reportableId}`}
                className={`${BTN.primary} ${BTN_MD}`}
                onClick={onClose}
              >
                Voir la patchnote
              </Link>
            )}
          {report.entityDetails?.type === "Modification" &&
            report.entityDetails?.patchnote &&
            report.entityDetails.game && (
              <Link
                href={`/article/${report.entityDetails.game.id}/patchnote/${report.entityDetails.patchnote.id}/modifications`}
                className={`${BTN.primary} ${BTN_MD}`}
                onClick={onClose}
              >
                Voir les modifications
              </Link>
            )}
        </div>
        <button onClick={onClose} className={`${BTN.outlined} ${BTN_MD}`}>
          Fermer
        </button>
      </div>
    </ModalShell>
  );
}

function ModificationDetailsModal({
  isOpen,
  modification,
  onClose,
}: ModificationDetailsModalProps) {
  if (!isOpen || !modification) return null;

  const formatDifference = (diff: Array<[number, string]>) => {
    return diff.map(([type, text], index) => {
      let className = "p-1 font-mono text-sm rounded-sm";
      let label = "";

      switch (type) {
        case -1:
          className += " bg-debuff/10 text-red-400 line-through";
          label = "Supprimé";
          break;
        case 1:
          className += " bg-buff/10 text-green-400";
          label = "Ajouté";
          break;
        default:
          className += " bg-off-white/5 text-off-white/60";
          label = "Inchangé";
      }

      return (
        <div key={index} className="mb-2">
          <span className="px-2 py-0.5 mr-2 text-xs rounded-sm bg-off-white/10 text-off-white/60">
            {label}
          </span>
          <span className={className}>{text}</span>
        </div>
      );
    });
  };

  return (
    <ModalShell
      title={`Détails de la modification #${modification.id}`}
      onClose={onClose}
      maxWidth="max-w-4xl"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Patchnote info */}
        <div className="p-4 border rounded-sm bg-off-black/40 border-off-white/5">
          <h4 className="mb-3 font-semibold font-montserrat">
            Patchnote concernée
          </h4>
          {modification.patchnote ? (
            <div className="space-y-2 text-sm text-off-white/70">
              <p>
                <strong className="text-off-white">Titre :</strong>{" "}
                {modification.patchnote.title}
              </p>
              <p>
                <strong className="text-off-white">Jeu :</strong>{" "}
                {typeof modification.patchnote.game === "object"
                  ? modification.patchnote.game.title
                  : modification.patchnote.game}
              </p>
              <p>
                <strong className="text-off-white">Importance :</strong>{" "}
                <span
                  className={importanceBadge(modification.patchnote.importance)}
                >
                  {modification.patchnote.importance}
                </span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-off-white/50">Patchnote supprimée</p>
          )}
        </div>

        {/* Modification info */}
        <div className="p-4 border rounded-sm bg-off-black/40 border-off-white/5">
          <h4 className="mb-3 font-semibold font-montserrat">Informations</h4>
          <div className="space-y-2 text-sm text-off-white/70">
            <p>
              <strong className="text-off-white">Utilisateur :</strong>{" "}
              {modification.user?.username || "Inconnu"}
            </p>
            <p>
              <strong className="text-off-white">Date :</strong>{" "}
              {new Date(modification.createdAt).toLocaleString()}
            </p>
            <p>
              <strong className="text-off-white">Changements :</strong>{" "}
              {modification.difference?.length || 0}
            </p>
            {modification.reportCount !== undefined && (
              <p>
                <strong className="text-off-white">Signalements :</strong>{" "}
                {modification.reportCount}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Differences */}
      <div className="mt-6">
        <h4 className="mb-3 font-semibold font-montserrat">Différences</h4>
        <div className="p-4 overflow-y-auto border rounded-sm bg-off-black/40 border-off-white/5 max-h-96">
          {modification.difference && modification.difference.length > 0 ? (
            formatDifference(modification.difference)
          ) : (
            <p className="text-sm text-off-white/50">
              Aucune différence enregistrée
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <div className="flex gap-2">
          {/* Redirection button to patchnote */}
          {modification.patchnote && (
            <Link
              href={`/article/${
                typeof modification.patchnote.game === "object"
                  ? modification.patchnote.game.id
                  : modification.patchnote.game
              }/patchnote/${modification.patchnote.id}`}
              className={`${BTN.primary} ${BTN_MD}`}
              onClick={onClose}
            >
              Voir la patchnote
            </Link>
          )}
        </div>
        <button onClick={onClose} className={`${BTN.outlined} ${BTN_MD}`}>
          Fermer
        </button>
      </div>
    </ModalShell>
  );
}

function BanModal({ isOpen, user, onClose, onBan }: BanModalProps) {
  const [banReason, setBanReason] = useState("");
  const [isPermanent, setIsPermanent] = useState(false);
  const [bannedUntil, setBannedUntil] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banReason.trim()) return;

    setLoading(true);
    try {
      const banData: BanUserData = {
        banReason: banReason.trim(),
        ...(isPermanent ? {} : { bannedUntil: bannedUntil + "T00:00:00.000Z" }),
      };
      await onBan(user.id, banData);
      onClose();
      setBanReason("");
      setBannedUntil("");
      setIsPermanent(false);
    } catch (error) {
      console.error("Error banning user:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClasses =
    "w-full px-3 py-2 bg-off-black/40 border border-off-white/20 rounded-sm text-off-white focus:outline-none focus:border-primary/60";

  return (
    <ModalShell
      title={`Bannir l'utilisateur ${user.username}`}
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2 text-sm font-semibold font-montserrat text-off-white/80">
            Raison du bannissement
          </label>
          <textarea
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            className={inputClasses}
            rows={3}
            required
          />
        </div>
        <div className="mb-4">
          <label className="flex items-center gap-2 text-sm text-off-white/80">
            <input
              type="checkbox"
              checked={isPermanent}
              onChange={(e) => setIsPermanent(e.target.checked)}
              className="accent-primary"
            />
            Bannissement permanent
          </label>
        </div>
        {!isPermanent && (
          <div className="mb-4">
            <label className="block mb-2 text-sm font-semibold font-montserrat text-off-white/80">
              Banni jusqu&apos;au
            </label>
            <input
              type="date"
              value={bannedUntil}
              onChange={(e) => setBannedUntil(e.target.value)}
              className={inputClasses}
              required={!isPermanent}
            />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className={`${BTN.outlined} ${BTN_MD}`}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="submit"
            className={`${BTN.danger} ${BTN_MD}`}
            disabled={loading || !banReason.trim()}
          >
            {loading ? "Bannissement..." : "Bannir"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// Type utilitaire pour gérer les erreurs d'API avec un champ response.status
interface ApiError {
  response?: { status?: number; data?: { detail?: string } };
}

type TabKey = "patchnotes" | "modifications" | "reports";
const TABS: TabKey[] = ["patchnotes", "modifications", "reports"];

const SELECT_CLASSES =
  "px-3 py-2 bg-off-gray border border-off-white/20 rounded-sm text-off-white focus:outline-none focus:border-primary/60 [color-scheme:dark]";

const SEARCH_PLACEHOLDERS: Record<TabKey, string> = {
  patchnotes: "Rechercher par titre, jeu ou auteur...",
  modifications: "Rechercher par utilisateur, patchnote ou jeu...",
  reports: "Rechercher par raison ou utilisateur...",
};

function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { showMessage } = useFlashMessage();
  const isAdmin = user?.roles?.includes("ROLE_ADMIN") ?? false;
  const [patchnotes, setPatchnotes] = useState<Patchnote[]>([]);
  const [modifications, setModifications] = useState<Modification[]>([]);
  const [reports, setReports] = useState<ReportWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [selectedUserToBan, setSelectedUserToBan] = useState<User | null>(null);
  const [modificationDetailsModalOpen, setModificationDetailsModalOpen] =
    useState(false);
  const [selectedModification, setSelectedModification] =
    useState<Modification | null>(null);
  const [reportDetailsModalOpen, setReportDetailsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] =
    useState<ReportWithDetails | null>(null);
  const [previewPatchnote, setPreviewPatchnote] = useState<Patchnote | null>(
    null
  );
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  // L'état de navigation vit dans l'URL : rechargeable, partageable, back/forward ok.
  const tabParam = searchParams.get("tab") as TabKey | null;
  const activeTab: TabKey =
    tabParam && TABS.includes(tabParam) ? tabParam : "patchnotes";
  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const searchTerm = searchParams.get("q") ?? "";
  const importanceFilter = searchParams.get("importance") ?? "";
  const entityFilter = searchParams.get("entity") ?? "";

  const updateParams = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      const qs = params.toString();
      router.replace(qs ? `/dashboard?${qs}` : "/dashboard", { scroll: false });
    },
    [searchParams, router]
  );

  const handlePageChange = useCallback(
    (page: number) => updateParams({ page: page > 1 ? String(page) : null }),
    [updateParams]
  );

  const handleSearchChange = useCallback(
    (value: string) => updateParams({ q: value || null, page: null }),
    [updateParams]
  );

  // Helper function to check if a user is banned
  const isUserBanned = (
    user: { isBanned?: boolean; bannedUntil?: string } | null | undefined
  ): boolean => {
    if (!user) return false;

    // Check if explicitly banned
    if (user.isBanned === true) return true;

    // Check if banned until a future date
    if (user.bannedUntil) {
      const bannedUntilDate = new Date(user.bannedUntil);
      const now = new Date();
      return bannedUntilDate > now;
    }

    return false;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      switch (activeTab) {
        case "patchnotes": {
          const patchnotesData = await adminService.getPatchnotes(
            currentPage,
            searchTerm,
            importanceFilter
          );
          setPatchnotes(patchnotesData.member);
          setTotalItems(patchnotesData.totalItems);
          break;
        }

        case "modifications": {
          const modificationsData = await adminService.getModifications(
            currentPage,
            searchTerm
          );
          setModifications(modificationsData.member);
          setTotalItems(modificationsData.totalItems);
          break;
        }

        case "reports": {
          const reportsData = await adminService.getReports(
            currentPage,
            searchTerm,
            entityFilter
          );
          const reportsWithDetails: ReportWithDetails[] =
            reportsData.member.map((report) => ({
              ...report,
              id: report.id || 0,
            }));
          setReports(reportsWithDetails);
          setTotalItems(reportsData.totalItems);
          break;
        }
      }
    } catch (err) {
      const error = err as ApiError;
      if (error.response?.status === 403) {
        router.replace("/login");
        return;
      }
      setError("Erreur lors du chargement des données administrateur.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, searchTerm, importanceFilter, entityFilter, router]);

  // Le back refuse les appels admin, mais l'UI doit aussi rester fermée.
  useEffect(() => {
    if (authLoading || isAdmin) return;
    router.replace("/");
  }, [authLoading, isAdmin, router]);

  // Fetch data based on active tab
  useEffect(() => {
    if (!isAdmin) return;
    fetchData();
  }, [isAdmin, fetchData]);

  // Handle ban user
  const handleBanUser = async (userId: number, banData: BanUserData) => {
    try {
      await adminService.banUser(userId, banData);
      showMessage("Utilisateur banni avec succès.", "success");
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error banning user:", error);
      showMessage("Erreur lors du bannissement de l'utilisateur.", "error");
    }
  };

  // Delete report
  const handleDeleteReport = (reportId: number) => {
    setConfirmState({
      message: "Supprimer ce signalement ?",
      confirmLabel: "Supprimer",
      onConfirm: async () => {
        try {
          await adminService.deleteReport(reportId);
          showMessage("Signalement supprimé avec succès.", "success");
          fetchData();
        } catch (error) {
          console.error("Error deleting report:", error);
          showMessage(
            (error as ApiError).response?.data?.detail ??
              "Erreur lors de la suppression du signalement.",
            "error"
          );
        }
      },
    });
  };

  // Delete patchnote
  const handleDeletePatchnote = (patchnoteId: number, title: string) => {
    setConfirmState({
      message: `Supprimer la patchnote "${title}" ?`,
      confirmLabel: "Supprimer",
      onConfirm: async () => {
        try {
          await adminService.deletePatchnote(patchnoteId);
          showMessage("Patchnote supprimée avec succès.", "success");
          // Côté API, supprimer un contenu solde aussi ses signalements
          fetchData();
        } catch (error) {
          console.error("Error deleting patchnote:", error);
          showMessage(
            (error as ApiError).response?.data?.detail ??
              "Erreur lors de la suppression de la patchnote.",
            "error"
          );
        }
      },
    });
  };

  // Open ban modal
  const openBanModal = (user: User) => {
    setSelectedUserToBan(user);
    setBanModalOpen(true);
  };

  // Open modification details modal
  const openModificationDetailsModal = (modification: Modification) => {
    setSelectedModification(modification);
    setModificationDetailsModalOpen(true);
  };

  // Open report details modal
  const openReportDetailsModal = (report: ReportWithDetails) => {
    setSelectedReport(report);
    setReportDetailsModalOpen(true);
  };

  // Delete modification
  const handleDeleteModification = (modificationId: number) => {
    setConfirmState({
      message: "Supprimer cette modification ?",
      confirmLabel: "Supprimer",
      onConfirm: async () => {
        try {
          await adminService.deleteModification(modificationId);
          showMessage("Modification supprimée avec succès.", "success");
          // Côté API, supprimer un contenu solde aussi ses signalements
          fetchData();
        } catch (error) {
          console.error("Error deleting modification:", error);
          showMessage(
            (error as ApiError).response?.data?.detail ??
              "Erreur lors de la suppression de la modification.",
            "error"
          );
        }
      },
    });
  };

  // View reports for modification
  const handleViewModificationReports = async (modificationId: number) => {
    try {
      const reportsData = await adminService.getReportsForEntity(
        "Modification",
        modificationId
      );
      if (reportsData.member.length === 0) {
        showMessage("Aucun signalement trouvé pour cette modification.", "info");
        return;
      }
      showMessage(
        `${reportsData.member.length} signalement(s) trouvé(s) pour cette modification.`,
        "info"
      );
    } catch (error) {
      console.error("Error fetching reports:", error);
      showMessage("Erreur lors de la récupération des signalements.", "error");
    }
  };

  // Pagination
  const totalPages = Math.max(1, Math.ceil(totalItems / ADMIN_PAGE_SIZE));

  const hasActiveFilters = Boolean(
    searchTerm || importanceFilter || entityFilter
  );

  const emptyRow = (colSpan: number) => (
    <tr>
      <td
        colSpan={colSpan}
        className="px-4 py-10 text-center text-off-white/50"
      >
        {hasActiveFilters
          ? "Aucun résultat pour ces filtres"
          : "Aucun élément à afficher"}
      </td>
    </tr>
  );

  if (authLoading || !isAdmin) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 py-16 text-center text-off-white/70">
        {authLoading ? "Chargement..." : "Accès réservé aux administrateurs."}
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 py-10 text-off-white">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-montserrat">
          Dashboard administrateur
        </h1>
        <p className="mt-1 text-off-white/50">
          Modération des patchnotes, modifications et signalements
        </p>
      </header>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-off-white/10">
        <nav className="flex gap-6 -mb-px">
          {[
            { key: "patchnotes", label: "Patchnotes" },
            { key: "modifications", label: "Modifications" },
            { key: "reports", label: "Signalements" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() =>
                updateParams({
                  tab: tab.key,
                  page: null,
                  q: null,
                  importance: null,
                  entity: null,
                })
              }
              className={`pb-3 px-1 border-b-2 text-sm font-montserrat font-semibold transition-colors ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-off-white/60 hover:text-off-white hover:border-off-white/30"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Search + filters (server-side) */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative w-full max-w-md">
          <DebouncedInput
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={SEARCH_PLACEHOLDERS[activeTab]}
            className="w-full px-4 py-2 border rounded-sm bg-off-gray border-off-white/20 text-off-white placeholder:text-off-white/40 focus:outline-none focus:border-primary/60"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute -translate-y-1/2 text-off-white/50 right-3 top-1/2 hover:text-off-white"
              aria-label="Effacer la recherche"
            >
              ✕
            </button>
          )}
        </div>
        {activeTab === "patchnotes" && (
          <select
            value={importanceFilter}
            onChange={(e) =>
              updateParams({ importance: e.target.value || null, page: null })
            }
            className={SELECT_CLASSES}
            aria-label="Filtrer par importance"
          >
            <option value="">Toutes les importances</option>
            <option value="major">Majeure</option>
            <option value="minor">Mineure</option>
            <option value="hotfix">Hotfix</option>
          </select>
        )}
        {activeTab === "reports" && (
          <select
            value={entityFilter}
            onChange={(e) =>
              updateParams({ entity: e.target.value || null, page: null })
            }
            className={SELECT_CLASSES}
            aria-label="Filtrer par type d'élément signalé"
          >
            <option value="">Tous les types</option>
            <option value="Patchnote">Patchnotes</option>
            <option value="Modification">Modifications</option>
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary"></div>
        </div>
      ) : error ? (
        <p className="py-8 text-center text-red-400">{error}</p>
      ) : (
        <>
          {/* Patchnotes Tab */}
          {activeTab === "patchnotes" && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">
                  Patchnotes ({totalItems})
                </h2>
              </div>
              <div className="overflow-x-auto border rounded-sm bg-off-gray border-off-white/10">
                <table className="min-w-full">
                  <thead>
                    <tr className={TABLE_HEAD_ROW}>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Titre</th>
                      <th className="px-4 py-3">Jeu</th>
                      <th className="px-4 py-3">Importance</th>
                      <th className="px-4 py-3">Auteur</th>
                      <th className="px-4 py-3">Date de sortie</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patchnotes.length === 0
                      ? emptyRow(7)
                      : patchnotes.map((patchnote) => (
                          <tr key={patchnote.id} className={TABLE_ROW}>
                            <td className="px-4 py-3 font-mono text-sm text-off-white/70">
                              {patchnote.id}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => setPreviewPatchnote(patchnote)}
                                className="max-w-xs text-left truncate transition-colors hover:text-primary"
                                title={patchnote.title || ""}
                              >
                                {patchnote.title || "Sans titre"}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              {typeof patchnote.game === "string"
                                ? patchnote.game
                                : patchnote.game?.title || "N/A"}
                            </td>
                            <td className="px-4 py-3">
                              {patchnote.importance ? (
                                <span
                                  className={importanceBadge(
                                    patchnote.importance
                                  )}
                                >
                                  {patchnote.importance}
                                </span>
                              ) : (
                                <span className="text-xs text-off-white/40">
                                  N/A
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {patchnote.createdBy ? (
                                <div className="flex items-center gap-2">
                                  <span>{patchnote.createdBy.username}</span>
                                  {isUserBanned(patchnote.createdBy) ? (
                                    <span className={BANNED_BADGE}>Banni</span>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        openBanModal({
                                          id: patchnote.createdBy!.id,
                                          username:
                                            patchnote.createdBy!.username,
                                          email: "",
                                          roles: [],
                                          createdAt: "",
                                          contributionsCount: 0,
                                        })
                                      }
                                      className={`${BTN.warning} ${BTN_SM}`}
                                    >
                                      Bannir
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-off-white/40">
                                  Inconnu
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-off-white/50">
                              {patchnote.releasedAt
                                ? new Date(
                                    patchnote.releasedAt
                                  ).toLocaleDateString()
                                : "N/A"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setPreviewPatchnote(patchnote)}
                                  className={`${BTN.outlined} ${BTN_SM}`}
                                >
                                  Aperçu
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeletePatchnote(
                                      patchnote.id,
                                      patchnote.title
                                    )
                                  }
                                  className={`${BTN.danger} ${BTN_SM}`}
                                >
                                  Supprimer
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </section>
          )}

          {/* Modifications Tab */}
          {activeTab === "modifications" && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">
                  Modifications ({totalItems})
                </h2>
              </div>
              <div className="overflow-x-auto border rounded-sm bg-off-gray border-off-white/10">
                <table className="min-w-full">
                  <thead>
                    <tr className={TABLE_HEAD_ROW}>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Utilisateur</th>
                      <th className="px-4 py-3">Patchnote</th>
                      <th className="px-4 py-3">Date de création</th>
                      <th className="px-4 py-3">Différences</th>
                      <th className="px-4 py-3">Signalements</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modifications.length === 0
                      ? emptyRow(7)
                      : modifications.map((modification) => (
                          <tr key={modification.id} className={TABLE_ROW}>
                            <td className="px-4 py-3 font-mono text-sm text-off-white/70">
                              {modification.id}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span>
                                  {modification.user?.username ||
                                    "Utilisateur inconnu"}
                                </span>
                                {isUserBanned(modification.user) ? (
                                  <span className={BANNED_BADGE}>Banni</span>
                                ) : (
                                  <button
                                    onClick={() =>
                                      openBanModal({
                                        id: modification.user?.id || 0,
                                        username:
                                          modification.user?.username ||
                                          "Inconnu",
                                        email: "",
                                        roles: [],
                                        createdAt: "",
                                        contributionsCount: 0,
                                      })
                                    }
                                    className={`${BTN.warning} ${BTN_SM}`}
                                  >
                                    Bannir
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {modification.patchnote ? (
                                <div className="max-w-xs">
                                  <div
                                    className="text-sm font-medium truncate"
                                    title={modification.patchnote.title || ""}
                                  >
                                    {modification.patchnote.title ||
                                      "Sans titre"}
                                  </div>
                                  <div className="text-xs text-off-white/50">
                                    {typeof modification.patchnote.game ===
                                    "object"
                                      ? modification.patchnote.game.title
                                      : modification.patchnote.game}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-off-white/40">
                                  Patchnote supprimée
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-off-white/50">
                              {modification.createdAt
                                ? new Date(
                                    modification.createdAt
                                  ).toLocaleString()
                                : "N/A"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-off-white/50">
                                  {modification.difference?.length || 0}{" "}
                                  changement(s)
                                </span>
                                <button
                                  onClick={() =>
                                    openModificationDetailsModal(modification)
                                  }
                                  className={`${BTN.outlined} ${BTN_SM}`}
                                >
                                  Voir détails
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-off-white/50">
                                  {modification.reportCount || 0}
                                </span>
                                {(modification.reportCount || 0) > 0 && (
                                  <button
                                    onClick={() =>
                                      handleViewModificationReports(
                                        modification.id
                                      )
                                    }
                                    className={`${BTN.outlined} ${BTN_SM}`}
                                  >
                                    Voir signalements
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {modification.patchnote && (
                                  <Link
                                    href={`/article/${
                                      typeof modification.patchnote.game ===
                                      "object"
                                        ? modification.patchnote.game.id
                                        : modification.patchnote.game
                                    }/patchnote/${
                                      modification.patchnote.id
                                    }/modifications`}
                                    className={`${BTN.primary} ${BTN_SM}`}
                                  >
                                    Voir page
                                  </Link>
                                )}
                                <button
                                  onClick={() =>
                                    handleDeleteModification(modification.id)
                                  }
                                  className={`${BTN.danger} ${BTN_SM}`}
                                >
                                  Supprimer
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </section>
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">
                  Signalements ({totalItems})
                </h2>
              </div>
              <div className="overflow-x-auto border rounded-sm bg-off-gray border-off-white/10">
                <table className="min-w-full">
                  <thead>
                    <tr className={TABLE_HEAD_ROW}>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Élément signalé</th>
                      <th className="px-4 py-3">Signalé par</th>
                      <th className="px-4 py-3">Raison</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.length === 0
                      ? emptyRow(6)
                      : reports.map((report) => {
                          // Clean entity type name
                          const cleanEntityType =
                            report.reportableEntity.includes("\\")
                              ? report.reportableEntity.split("\\").pop() ||
                                report.reportableEntity
                              : report.reportableEntity;

                          return (
                            <tr key={report.id} className={TABLE_ROW}>
                              <td className="px-4 py-3 font-mono text-sm text-off-white/70">
                                {report.id}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => openReportDetailsModal(report)}
                                  className="text-left transition-colors hover:opacity-80"
                                >
                                  <span
                                    className={`${BADGE_BASE} ${
                                      cleanEntityType === "Patchnote"
                                        ? "bg-primary/20 text-primary border border-primary/40"
                                        : "bg-green-500/20 text-green-400 border border-green-500/40"
                                    }`}
                                  >
                                    {cleanEntityType} n°{report.reportableId}
                                  </span>
                                  {report.entityDetails && (
                                    <div className="max-w-xs mt-1 text-xs truncate text-off-white/50">
                                      {report.entityDetails.title}
                                    </div>
                                  )}
                                </button>
                              </td>
                              <td className="px-4 py-3">
                                {report.reportedBy ? (
                                  <span className="text-off-white/80">
                                    {report.reportedBy.username}
                                  </span>
                                ) : (
                                  <span className="text-off-white/40">
                                    Inconnu
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div
                                  className="max-w-xs truncate"
                                  title={report.reason}
                                >
                                  {report.reason}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-off-white/50">
                                {report.reportedAt
                                  ? new Date(report.reportedAt).toLocaleString()
                                  : "N/A"}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    onClick={() =>
                                      openReportDetailsModal(report)
                                    }
                                    className={`${BTN.outlined} ${BTN_SM}`}
                                  >
                                    Voir détails
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteReport(report.id)
                                    }
                                    className={`${BTN.danger} ${BTN_SM}`}
                                  >
                                    Supprimer le signalement
                                  </button>
                                  {report.entityDetails?.deleted ? (
                                    <span
                                      className={`${BADGE_BASE} bg-off-white/10 text-off-white/50 border border-off-white/20`}
                                    >
                                      Contenu supprimé
                                    </span>
                                  ) : (
                                    <>
                                      {cleanEntityType === "Patchnote" && (
                                        <button
                                          onClick={() =>
                                            handleDeletePatchnote(
                                              report.reportableId,
                                              report.entityDetails?.title ||
                                                `Patchnote #${report.reportableId}`
                                            )
                                          }
                                          className={`${BTN.danger} ${BTN_SM}`}
                                        >
                                          Supprimer contenu
                                        </button>
                                      )}
                                      {cleanEntityType === "Modification" && (
                                        <button
                                          onClick={() =>
                                            handleDeleteModification(
                                              report.reportableId
                                            )
                                          }
                                          className={`${BTN.danger} ${BTN_SM}`}
                                        >
                                          Supprimer contenu
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </section>
          )}
        </>
      )}

      {/* Ban Modal */}
      {selectedUserToBan && (
        <BanModal
          isOpen={banModalOpen}
          user={selectedUserToBan}
          onClose={() => {
            setBanModalOpen(false);
            setSelectedUserToBan(null);
          }}
          onBan={handleBanUser}
        />
      )}

      {/* Modification Details Modal */}
      <ModificationDetailsModal
        isOpen={modificationDetailsModalOpen}
        modification={selectedModification}
        onClose={() => {
          setModificationDetailsModalOpen(false);
          setSelectedModification(null);
        }}
      />

      {/* Report Details Modal */}
      <ReportDetailsModal
        isOpen={reportDetailsModalOpen}
        report={selectedReport}
        onClose={() => {
          setReportDetailsModalOpen(false);
          setSelectedReport(null);
        }}
      />

      {/* Patchnote Preview Modal */}
      <PatchnotePreviewModal
        patchnote={previewPatchnote}
        onClose={() => setPreviewPatchnote(null)}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        state={confirmState}
        onClose={() => setConfirmState(null)}
      />
    </div>
  );
}

// useSearchParams impose une frontière Suspense au prerender
export default function AdminDashboardPage() {
  return (
    <Suspense fallback={null}>
      <AdminDashboard />
    </Suspense>
  );
}
