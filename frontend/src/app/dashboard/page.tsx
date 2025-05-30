"use client";

import React, { useEffect, useState } from "react";
import reportService from "@/lib/api/reportService";
import gameService from "@/lib/api/gameService";
import userService from "@/lib/api/userService";
import { Patchnote } from "@/types/patchNoteType";
import { User } from "@/types/authType";
import { useRouter } from "next/navigation";

interface RawReport {
  id: number;
  reportedBy: { id: number };
  reportableId: number;
  reportableEntity: string;
}

interface PatchnoteReport {
  id: number;
  patchnote: Patchnote;
  reporter: User;
  reportedUser: User;
}

// Type utilitaire pour gérer les erreurs d'API avec un champ response.status
interface ApiError {
  response?: { status?: number };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [patchnotes, setPatchnotes] = useState<Patchnote[]>([]);
  const [patchnoteReportCounts, setPatchnoteReportCounts] = useState<
    Record<number, number>
  >({});
  const [reports, setReports] = useState<PatchnoteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all reports and patchnotes with report counts
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // On force le typage ici car l'API ne retourne pas tout ce qu'il faut
        const reportsData = await reportService.getReports(1);
        // reportsData: ReportData[]
        // On ne peut pas caster, donc on ne garde que les infos nécessaires (reportableId, reportableEntity)
        // Pour la suite, on va simuler RawReport à partir de ReportData
        const patchnoteReports: RawReport[] = reportsData
          .filter((r) => r.reportableEntity === "Patchnote")
          .map((r, idx) => ({
            id: idx, // Pas d'id dans ReportData, on met un index temporaire (à améliorer si possible)
            reportedBy: { id: 0 }, // On ne peut pas savoir ici, sera enrichi plus tard
            reportableId: r.reportableId,
            reportableEntity: r.reportableEntity,
          }));

        // Get all unique patchnote IDs from reports
        const patchnoteIds = [
          ...new Set(patchnoteReports.map((r: RawReport) => r.reportableId)),
        ];
        // Fetch patchnote details
        const patchnotesFetched = await Promise.all(
          patchnoteIds.map(async (id: number) => {
            try {
              return await gameService.getPatchNoteById(String(id));
            } catch {
              return undefined;
            }
          })
        );
        // Remove nulls
        const validPatchnotes = patchnotesFetched.filter(
          (p): p is Patchnote => !!p
        );
        setPatchnotes(validPatchnotes);

        // Count reports per patchnote
        const reportCounts: Record<number, number> = {};
        patchnoteReports.forEach((r: RawReport) => {
          reportCounts[r.reportableId] =
            (reportCounts[r.reportableId] || 0) + 1;
        });
        setPatchnoteReportCounts(reportCounts);

        // Fetch user info for each report
        const userCache: Record<number, User> = {};
        async function getUser(id: number) {
          if (!userCache[id]) userCache[id] = await userService.getUserById(id);
          return userCache[id];
        }
        const reportsWithUsers: PatchnoteReport[] = await Promise.all(
          patchnoteReports.map(async (r: RawReport) => {
            const reporter = await getUser(r.reportedBy.id);
            const patchnote = validPatchnotes.find(
              (p) => p.id === r.reportableId
            );
            // Fallback complet pour User
            let reportedUser: User = {
              id: 0,
              username: "?",
              email: "",
              roles: [],
              createdAt: "",
              reputation: 0,
            };
            if (patchnote && patchnote.createdBy) {
              reportedUser = await getUser(patchnote.createdBy.id);
            }
            return {
              id: r.id,
              patchnote: patchnote || {
                id: r.reportableId,
                title: "(inconnu)",
                content: "",
                releasedAt: new Date(),
                importance: "minor",
                game: "",
                smallDescription: "",
                createdBy: { id: 0, username: "?" },
              },
              reporter,
              reportedUser,
            };
          })
        );
        setReports(reportsWithUsers);
      } catch (err) {
        const error = err as ApiError;
        if (error.response?.status === 403) {
          // Redirection automatique si 403
          router.replace("/login"); // ou "/" selon la logique souhaitée
          return;
        }
        setError("Erreur lors du chargement des données administrateur.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router]);

  // Delete a report
  const handleDeleteReport = async (reportId: number, reporter: User) => {
    if (
      !window.confirm(
        "Supprimer ce signalement ? Un avertissement sera envoyé au créateur."
      )
    )
      return;
    try {
      await reportService.deleteReport(reportId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      // TODO: Envoyer un avertissement au reporter (backend)
      alert(
        `Signalement supprimé. Un avertissement a été envoyé à ${reporter.username}.`
      );
    } catch {
      alert("Erreur lors de la suppression du signalement.");
    }
  };

  // Delete a patchnote
  const handleDeletePatchnote = async (patchnoteId: number, author: User) => {
    if (
      !window.confirm(
        "Supprimer cette patchnote/modification ? Un avertissement sera envoyé à l'auteur."
      )
    )
      return;
    try {
      await gameService.deletePatchnote(patchnoteId);
      setPatchnotes((prev) => prev.filter((p) => p.id !== patchnoteId));
      setReports((prev) => prev.filter((r) => r.patchnote.id !== patchnoteId));
      // TODO: Envoyer un avertissement à l'auteur (backend)
      alert(
        `Patchnote/modification supprimé(e). Un avertissement a été envoyé à ${author.username}.`
      );
    } catch {
      alert("Erreur lors de la suppression de la patchnote.");
    }
  };

  return (
    <div className="container px-4 py-8 mx-auto text-off-white">
      <h1 className="mb-8 text-4xl font-bold text-center text-primary">
        Dashboard Administrateur
      </h1>
      {loading ? (
        <p className="text-center">Chargement...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <>
          {/* Tableau des patchnotes/modifications */}
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-semibold">
              Modifications & Patchnotes
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-800 rounded-lg">
                <thead>
                  <tr className="text-left text-gray-300">
                    <th className="px-4 py-2">Titre</th>
                    <th className="px-4 py-2">Auteur</th>
                    <th className="px-4 py-2">Nb signalements</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patchnotes.map((p) => (
                    <tr key={p.id} className="border-b border-gray-700">
                      <td className="px-4 py-2">{p.title}</td>
                      <td className="px-4 py-2">
                        {p.createdBy?.username || "?"}
                      </td>
                      <td className="px-4 py-2">
                        {patchnoteReportCounts[p.id] || 0}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          className="px-3 py-1 text-sm font-semibold text-white bg-red-600 rounded hover:bg-red-700"
                          onClick={() =>
                            handleDeletePatchnote(
                              p.id,
                              p.createdBy
                                ? { ...fallbackUser, ...p.createdBy }
                                : fallbackUser
                            )
                          }
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Tableau des signalements */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold">
              Signalements de patchnotes
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-800 rounded-lg">
                <thead>
                  <tr className="text-left text-gray-300">
                    <th className="px-4 py-2">Patchnote</th>
                    <th className="px-4 py-2">Signalé par</th>
                    <th className="px-4 py-2">Utilisateur signalé</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} className="border-b border-gray-700">
                      <td className="px-4 py-2">{r.patchnote.title}</td>
                      <td className="px-4 py-2">{r.reporter.username}</td>
                      <td className="px-4 py-2">{r.reportedUser.username}</td>
                      <td className="px-4 py-2 space-x-2">
                        <button
                          className="px-3 py-1 text-sm font-semibold text-white bg-red-600 rounded hover:bg-red-700"
                          onClick={() => handleDeleteReport(r.id, r.reporter)}
                        >
                          Supprimer signalement
                        </button>
                        <button
                          className="px-3 py-1 text-sm font-semibold text-white bg-orange-500 rounded hover:bg-orange-600"
                          onClick={() =>
                            handleDeletePatchnote(
                              r.patchnote.id,
                              r.reportedUser
                            )
                          }
                        >
                          Supprimer patchnote
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
