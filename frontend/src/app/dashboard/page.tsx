"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import adminService from "@/lib/api/adminService";
import { Patchnote, Modification } from "@/types/patchNoteType";
import { User, BanUserData } from "@/types/authType";

// Enhanced report interface with user details
interface ReportWithDetails {
  id: number;
  reason: string;
  reportableId: number;
  reportableEntity: string;
  createdAt?: string;
  reportedBy?: {
    id: number;
    username: string;
  };
  entityDetails?: {
    type: string;
    id: number;
    title: string;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl p-6 mx-4 bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">
            Détails du signalement #{report.id}
          </h3>
          <button
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Signalement info */}
          <div className="p-4 bg-gray-700 rounded-lg">
            <h4 className="mb-3 text-lg font-semibold text-white">
              Informations du signalement
            </h4>
            <div className="space-y-2 text-gray-300">
              <p>
                <strong>Élément signalé:</strong> {getEntityDisplayName(report)}
              </p>
              <p>
                <strong>Raison:</strong> {report.reason}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {report.createdAt
                  ? new Date(report.createdAt).toLocaleString()
                  : "N/A"}
              </p>
              {report.reportedBy && (
                <p>
                  <strong>Signalé par:</strong> {report.reportedBy.username}
                </p>
              )}
            </div>
          </div>

          {/* Entity details */}
          {report.entityDetails && (
            <div className="p-4 bg-gray-700 rounded-lg">
              <h4 className="mb-3 text-lg font-semibold text-white">
                Détails de l&apos;élément signalé
              </h4>
              <div className="space-y-2 text-gray-300">
                <p>
                  <strong>Type:</strong> {report.entityDetails.type}
                </p>
                <p>
                  <strong>Titre:</strong> {report.entityDetails.title}
                </p>
                {report.entityDetails.game && (
                  <p>
                    <strong>Jeu:</strong> {report.entityDetails.game.title}
                  </p>
                )}
                {report.entityDetails.patchnote && (
                  <p>
                    <strong>Patchnote:</strong>{" "}
                    {report.entityDetails.patchnote.title}
                  </p>
                )}
                {report.entityDetails.owner && (
                  <p>
                    <strong>Créé par:</strong>{" "}
                    {report.entityDetails.owner.username}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-6">
          <div className="flex space-x-2">
            {/* Redirection buttons based on entity type */}
            {report.entityDetails?.type === "Patchnote" &&
              report.entityDetails.game && (
                <Link
                  href={`/article/${report.entityDetails.game.id}/patchnote/${report.reportableId}`}
                  className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
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
                  className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
                  onClick={onClose}
                >
                  Voir les modifications
                </Link>
              )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-white bg-gray-600 rounded hover:bg-gray-700"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
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
      let className = "p-1 font-mono text-sm rounded";
      let label = "";

      switch (type) {
        case -1:
          className += " bg-red-100 text-red-800 line-through";
          label = "Supprimé";
          break;
        case 1:
          className += " bg-green-100 text-green-800";
          label = "Ajouté";
          break;
        default:
          className += " bg-gray-100 text-gray-800";
          label = "Inchangé";
      }

      return (
        <div key={index} className="mb-2">
          <span className="px-2 py-1 mr-2 text-xs text-gray-700 bg-gray-200 rounded-full">
            {label}
          </span>
          <span className={className}>{text}</span>
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">
            Détails de la modification #{modification.id}
          </h3>
          <button
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Patchnote info */}
          <div className="p-4 bg-gray-700 rounded-lg">
            <h4 className="mb-3 text-lg font-semibold text-white">
              Patchnote concernée
            </h4>
            {modification.patchnote ? (
              <div className="text-gray-300">
                <p>
                  <strong>Titre:</strong> {modification.patchnote.title}
                </p>
                <p>
                  <strong>Jeu:</strong>{" "}
                  {typeof modification.patchnote.game === "object"
                    ? modification.patchnote.game.title
                    : modification.patchnote.game}
                </p>
                <p>
                  <strong>Importance:</strong>
                  <span
                    className={`ml-2 px-2 py-1 rounded text-xs ${
                      modification.patchnote.importance === "hotfix"
                        ? "bg-red-600"
                        : modification.patchnote.importance === "major"
                        ? "bg-orange-600"
                        : "bg-blue-600"
                    }`}
                  >
                    {modification.patchnote.importance}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-gray-400">Patchnote supprimée</p>
            )}
          </div>

          {/* Modification info */}
          <div className="p-4 bg-gray-700 rounded-lg">
            <h4 className="mb-3 text-lg font-semibold text-white">
              Informations
            </h4>
            <div className="text-gray-300">
              <p>
                <strong>Utilisateur:</strong>{" "}
                {modification.user?.username || "Inconnu"}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(modification.createdAt).toLocaleString()}
              </p>
              <p>
                <strong>Changements:</strong>{" "}
                {modification.difference?.length || 0}
              </p>
              {modification.reportCount !== undefined && (
                <p>
                  <strong>Signalements:</strong> {modification.reportCount}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Differences */}
        <div className="mt-6">
          <h4 className="mb-3 text-lg font-semibold text-white">Différences</h4>
          <div className="p-4 overflow-y-auto bg-gray-700 rounded-lg max-h-96">
            {modification.difference && modification.difference.length > 0 ? (
              formatDifference(modification.difference)
            ) : (
              <p className="text-gray-400">Aucune différence enregistrée</p>
            )}
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <div className="flex space-x-2">
            {/* Redirection button to patchnote */}
            {modification.patchnote && (
              <Link
                href={`/article/${
                  typeof modification.patchnote.game === "object"
                    ? modification.patchnote.game.id
                    : modification.patchnote.game
                }/patchnote/${modification.patchnote.id}`}
                className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                onClick={onClose}
              >
                Voir la patchnote
              </Link>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-white bg-gray-600 rounded hover:bg-gray-700"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ban-modal">
      <div className="w-full max-w-md p-6 mx-4 bg-gray-800 rounded-lg">
        <h3 className="mb-4 text-xl font-bold text-white">
          Bannir l&apos;utilisateur {user.username}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-bold text-gray-300">
              Raison du bannissement
            </label>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="w-full px-3 py-2 text-white bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              required
            />
          </div>
          <div className="mb-4">
            <label className="flex items-center text-gray-300">
              <input
                type="checkbox"
                checked={isPermanent}
                onChange={(e) => setIsPermanent(e.target.checked)}
                className="mr-2"
              />
              Bannissement permanent
            </label>
          </div>
          {!isPermanent && (
            <div className="mb-4">
              <label className="block mb-2 text-sm font-bold text-gray-300">
                Banni jusqu&apos;au
              </label>
              <input
                type="date"
                value={bannedUntil}
                onChange={(e) => setBannedUntil(e.target.value)}
                className="w-full px-3 py-2 text-white bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                required={!isPermanent}
              />
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-white bg-gray-600 rounded admin-btn hover:bg-gray-700"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-red-600 rounded admin-btn hover:bg-red-700 disabled:opacity-50"
              disabled={loading || !banReason.trim()}
            >
              {loading ? "Bannissement..." : "Bannir"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Type utilitaire pour gérer les erreurs d'API avec un champ response.status
interface ApiError {
  response?: { status?: number };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [patchnotes, setPatchnotes] = useState<Patchnote[]>([]);
  const [modifications, setModifications] = useState<Modification[]>([]);
  const [reports, setReports] = useState<ReportWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "patchnotes" | "modifications" | "reports"
  >("patchnotes");
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [selectedUserToBan, setSelectedUserToBan] = useState<User | null>(null);
  const [modificationDetailsModalOpen, setModificationDetailsModalOpen] =
    useState(false);
  const [selectedModification, setSelectedModification] =
    useState<Modification | null>(null);
  const [reportDetailsModalOpen, setReportDetailsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] =
    useState<ReportWithDetails | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  // Helper function to check if a user is banned
  const isUserBanned = (
    user: { isBanned?: boolean; bannedUntil?: string } | null | undefined
  ): boolean => {
    if (!user) return false;

    console.log("Checking user ban status:", user); // Debug log

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

  // Fetch data function
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      switch (activeTab) {
        case "patchnotes":
          const patchnotesData = await adminService.getPatchnotes(currentPage);
          console.log("Patchnotes data received:", patchnotesData); // Debug log
          setPatchnotes(patchnotesData.member);
          setTotalItems(patchnotesData.totalItems);
          break;

        case "modifications":
          const modificationsData = await adminService.getModifications(
            currentPage
          );
          console.log("Modifications data received:", modificationsData); // Debug log
          setModifications(modificationsData.member);
          setTotalItems(modificationsData.totalItems);
          break;

        case "reports":
          const reportsData = await adminService.getReports(currentPage);
          // Transform reports data to include patchnote details if needed
          const reportsWithDetails: ReportWithDetails[] =
            reportsData.member.map((report) => ({
              ...report,
              id: report.id || 0,
            }));
          setReports(reportsWithDetails);
          setTotalItems(reportsData.totalItems);
          break;
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
  };

  // Fetch data based on active tab
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        switch (activeTab) {
          case "patchnotes":
            const patchnotesData = await adminService.getPatchnotes(
              currentPage
            );
            setPatchnotes(patchnotesData.member);
            setTotalItems(patchnotesData.totalItems);
            break;

          case "modifications":
            const modificationsData = await adminService.getModifications(
              currentPage
            );
            setModifications(modificationsData.member);
            setTotalItems(modificationsData.totalItems);
            break;

          case "reports":
            const reportsData = await adminService.getReports(currentPage);
            // Transform reports data to include patchnote details if needed
            const reportsWithDetails: ReportWithDetails[] =
              reportsData.member.map((report) => ({
                ...report,
                id: report.id || 0,
              }));
            setReports(reportsWithDetails);
            setTotalItems(reportsData.totalItems);
            break;
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
    };

    fetchData();
  }, [activeTab, currentPage, router]);

  // Handle ban user
  const handleBanUser = async (userId: number, banData: BanUserData) => {
    try {
      await adminService.banUser(userId, banData);
      alert("Utilisateur banni avec succès.");
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error banning user:", error);
      alert("Erreur lors du bannissement de l'utilisateur.");
    }
  };

  // Delete report
  const handleDeleteReport = async (reportId: number) => {
    if (!window.confirm("Supprimer ce signalement ?")) return;

    try {
      await adminService.deleteReport(reportId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      alert("Signalement supprimé avec succès.");
    } catch (error) {
      console.error("Error deleting report:", error);
      alert("Erreur lors de la suppression du signalement.");
    }
  };

  // Delete patchnote
  const handleDeletePatchnote = async (patchnoteId: number, title: string) => {
    if (!window.confirm(`Supprimer la patchnote "${title}" ?`)) return;

    try {
      await adminService.deletePatchnote(patchnoteId);
      setPatchnotes((prev) => prev.filter((p) => p.id !== patchnoteId));
      alert("Patchnote supprimée avec succès.");
    } catch (error) {
      console.error("Error deleting patchnote:", error);
      alert("Erreur lors de la suppression de la patchnote.");
    }
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
  const handleDeleteModification = async (modificationId: number) => {
    if (!window.confirm("Supprimer cette modification ?")) return;

    try {
      await adminService.deleteModification(modificationId);
      setModifications((prev) => prev.filter((m) => m.id !== modificationId));
      alert("Modification supprimée avec succès.");
    } catch (error) {
      console.error("Error deleting modification:", error);
      alert("Erreur lors de la suppression de la modification.");
    }
  };

  // View reports for modification
  const handleViewModificationReports = async (modificationId: number) => {
    try {
      const reportsData = await adminService.getReportsForEntity(
        "Modification",
        modificationId
      );
      if (reportsData.member.length === 0) {
        alert("Aucun signalement trouvé pour cette modification.");
        return;
      }
      // For now, just show an alert with the count
      alert(
        `${reportsData.member.length} signalement(s) trouvé(s) pour cette modification.`
      );
    } catch (error) {
      console.error("Error fetching reports:", error);
      alert("Erreur lors de la récupération des signalements.");
    }
  };

  // Filter data based on search term
  const filteredPatchnotes = patchnotes.filter(
    (patchnote) =>
      searchTerm === "" ||
      patchnote.id.toString().includes(searchTerm.toLowerCase()) ||
      patchnote.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof patchnote.game === "string"
        ? patchnote.game.toLowerCase().includes(searchTerm.toLowerCase())
        : patchnote.game?.title
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
      patchnote.createdBy?.username
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const filteredModifications = modifications.filter(
    (modification) =>
      searchTerm === "" ||
      modification.id.toString().includes(searchTerm.toLowerCase()) ||
      modification.user?.username
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const filteredReports = reports.filter(
    (report) =>
      searchTerm === "" ||
      report.id.toString().includes(searchTerm.toLowerCase()) ||
      report.reportableId.toString().includes(searchTerm.toLowerCase()) ||
      report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportableEntity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const renderPagination = () => (
    <div className="flex items-center justify-center mt-6 space-x-2">
      <button
        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
        className="px-3 py-1 text-white bg-gray-700 rounded pagination-btn disabled:opacity-50"
      >
        Précédent
      </button>
      <span className="text-gray-300">
        Page {currentPage} sur {totalPages}
      </span>
      <button
        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="px-3 py-1 text-white bg-gray-700 rounded pagination-btn disabled:opacity-50"
      >
        Suivant
      </button>
    </div>
  );

  return (
    <div className="container px-4 py-8 mx-auto text-off-white">
      <h1 className="mb-8 text-4xl font-bold text-center text-primary">
        Dashboard Administrateur
      </h1>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-gray-600">
          <nav className="flex -mb-px space-x-8">
            {[
              { key: "patchnotes", label: "Patchnotes" },
              { key: "modifications", label: "Modifications" },
              { key: "reports", label: "Signalements" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as typeof activeTab);
                  setCurrentPage(1);
                  setSearchTerm(""); // Reset search when switching tabs
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-300 hover:text-gray-200 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Rechercher par ID, titre, nom d'utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 text-white bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute text-gray-400 transform -translate-y-1/2 right-3 top-1/2 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary"></div>
        </div>
      ) : error ? (
        <p className="py-8 text-center text-red-500">{error}</p>
      ) : (
        <>
          {/* Patchnotes Tab */}
          {activeTab === "patchnotes" && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">
                  Patchnotes (
                  {searchTerm
                    ? `${filteredPatchnotes.length} sur ${totalItems}`
                    : totalItems}
                  )
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-gray-800 rounded-lg">
                  <thead>
                    <tr className="text-left text-gray-300 bg-gray-700">
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
                    {filteredPatchnotes.map((patchnote) => (
                      <tr
                        key={patchnote.id}
                        className="border-b border-gray-700 hover:bg-gray-750"
                      >
                        <td className="px-4 py-3 font-mono text-sm">
                          {patchnote.id}
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className="max-w-xs truncate"
                            title={patchnote.title || ""}
                          >
                            {patchnote.title || "Sans titre"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {typeof patchnote.game === "string"
                            ? patchnote.game
                            : patchnote.game?.title || "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          {patchnote.importance ? (
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                patchnote.importance === "hotfix"
                                  ? "bg-red-600"
                                  : patchnote.importance === "major"
                                  ? "bg-orange-600"
                                  : "bg-blue-600"
                              }`}
                            >
                              {patchnote.importance}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {patchnote.createdBy ? (
                            <div className="flex items-center space-x-2">
                              <span>{patchnote.createdBy.username}</span>
                              {isUserBanned(patchnote.createdBy) ? (
                                <span className="px-2 py-1 text-xs text-white bg-red-600 rounded">
                                  Banni
                                </span>
                              ) : (
                                <button
                                  onClick={() =>
                                    openBanModal({
                                      id: patchnote.createdBy!.id,
                                      username: patchnote.createdBy!.username,
                                      email: "",
                                      roles: [],
                                      createdAt: "",
                                      reputation: 0,
                                    })
                                  }
                                  className="px-2 py-1 text-xs text-white bg-yellow-600 rounded hover:bg-yellow-700"
                                >
                                  Bannir
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">Inconnu</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {patchnote.releasedAt
                            ? new Date(
                                patchnote.releasedAt
                              ).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              handleDeletePatchnote(
                                patchnote.id,
                                patchnote.title
                              )
                            }
                            className="px-3 py-1 text-sm font-semibold text-white bg-red-600 rounded hover:bg-red-700"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderPagination()}
            </section>
          )}

          {/* Modifications Tab */}
          {activeTab === "modifications" && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">
                  Modifications (
                  {searchTerm
                    ? `${filteredModifications.length} sur ${totalItems}`
                    : totalItems}
                  )
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-gray-800 rounded-lg">
                  <thead>
                    <tr className="text-left text-gray-300 bg-gray-700">
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
                    {filteredModifications.map((modification) => (
                      <tr
                        key={modification.id}
                        className="border-b border-gray-700 hover:bg-gray-750"
                      >
                        <td className="px-4 py-3 font-mono text-sm">
                          {modification.id}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <span>
                              {modification.user?.username ||
                                "Utilisateur inconnu"}
                            </span>
                            {isUserBanned(modification.user) ? (
                              <span className="px-2 py-1 text-xs text-white bg-red-600 rounded">
                                Banni
                              </span>
                            ) : (
                              <button
                                onClick={() =>
                                  openBanModal({
                                    id: modification.user?.id || 0,
                                    username:
                                      modification.user?.username || "Inconnu",
                                    email: "",
                                    roles: [],
                                    createdAt: "",
                                    reputation: 0,
                                  })
                                }
                                className="px-2 py-1 text-xs text-white bg-yellow-600 rounded admin-btn hover:bg-yellow-700"
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
                                {modification.patchnote.title || "Sans titre"}
                              </div>
                              <div className="text-xs text-gray-400">
                                {typeof modification.patchnote.game === "object"
                                  ? modification.patchnote.game.title
                                  : modification.patchnote.game}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">
                              Patchnote supprimée
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {modification.createdAt
                            ? new Date(modification.createdAt).toLocaleString()
                            : "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-400">
                              {modification.difference?.length || 0}{" "}
                              changement(s)
                            </span>
                            <button
                              onClick={() =>
                                openModificationDetailsModal(modification)
                              }
                              className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                            >
                              Voir détails
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-400">
                              {modification.reportCount || 0}
                            </span>
                            {(modification.reportCount || 0) > 0 && (
                              <button
                                onClick={() =>
                                  handleViewModificationReports(modification.id)
                                }
                                className="px-2 py-1 text-xs text-white bg-purple-600 rounded hover:bg-purple-700"
                              >
                                Voir signalements
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 space-x-2">
                          {modification.patchnote && (
                            <Link
                              href={`/article/${
                                typeof modification.patchnote.game === "object"
                                  ? modification.patchnote.game.id
                                  : modification.patchnote.game
                              }/patchnote/${
                                modification.patchnote.id
                              }/modifications`}
                              className="inline-block px-3 py-1 mr-2 text-sm font-semibold text-white bg-blue-600 rounded admin-btn hover:bg-blue-700"
                            >
                              Voir page
                            </Link>
                          )}
                          <button
                            onClick={() =>
                              handleDeleteModification(modification.id)
                            }
                            className="px-3 py-1 text-sm font-semibold text-white bg-red-600 rounded hover:bg-red-700"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderPagination()}
            </section>
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">
                  Signalements (
                  {searchTerm
                    ? `${filteredReports.length} sur ${totalItems}`
                    : totalItems}
                  )
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-gray-800 rounded-lg">
                  <thead>
                    <tr className="text-left text-gray-300 bg-gray-700">
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Élément signalé</th>
                      <th className="px-4 py-3">Signalé par</th>
                      <th className="px-4 py-3">Raison</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => {
                      // Clean entity type name
                      const cleanEntityType = report.reportableEntity.includes(
                        "\\"
                      )
                        ? report.reportableEntity.split("\\").pop() ||
                          report.reportableEntity
                        : report.reportableEntity;

                      return (
                        <tr
                          key={report.id}
                          className="border-b border-gray-700 hover:bg-gray-750"
                        >
                          <td className="px-4 py-3 font-mono text-sm">
                            {report.id}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => openReportDetailsModal(report)}
                              className="text-left transition-colors hover:text-blue-400"
                            >
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-semibold ${
                                    cleanEntityType === "Patchnote"
                                      ? "bg-blue-600"
                                      : "bg-green-600"
                                  } text-white`}
                                >
                                  {cleanEntityType} n°{report.reportableId}
                                </span>
                              </div>
                              {report.entityDetails && (
                                <div className="max-w-xs mt-1 text-xs text-gray-400 truncate">
                                  {report.entityDetails.title}
                                </div>
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            {report.reportedBy ? (
                              <span className="text-gray-300">
                                {report.reportedBy.username}
                              </span>
                            ) : (
                              <span className="text-gray-400">Inconnu</span>
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
                          <td className="px-4 py-3 text-sm text-gray-400">
                            {report.createdAt
                              ? new Date(report.createdAt).toLocaleString()
                              : "N/A"}
                          </td>
                          <td className="px-4 py-3 space-x-2">
                            <button
                              onClick={() => openReportDetailsModal(report)}
                              className="px-3 py-1 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700"
                            >
                              Voir détails
                            </button>
                            <button
                              onClick={() => handleDeleteReport(report.id)}
                              className="px-3 py-1 text-sm font-semibold text-white bg-red-600 rounded hover:bg-red-700"
                            >
                              Supprimer le signalement
                            </button>
                            {cleanEntityType === "Patchnote" && (
                              <button
                                onClick={() =>
                                  handleDeletePatchnote(
                                    report.reportableId,
                                    report.entityDetails?.title ||
                                      `Patchnote #${report.reportableId}`
                                  )
                                }
                                className="px-3 py-1 text-sm font-semibold text-white bg-orange-600 rounded hover:bg-orange-700"
                              >
                                Supprimer contenu
                              </button>
                            )}
                            {cleanEntityType === "Modification" && (
                              <button
                                onClick={() =>
                                  handleDeleteModification(report.reportableId)
                                }
                                className="px-3 py-1 text-sm font-semibold text-white bg-orange-600 rounded hover:bg-orange-700"
                              >
                                Supprimer contenu
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {renderPagination()}
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
    </div>
  );
}
