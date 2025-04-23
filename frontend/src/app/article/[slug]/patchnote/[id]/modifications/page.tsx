"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { usePatchnoteLayout } from "../layout";
import { Modification } from "@/types/patchNoteType";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import gameService from "@/lib/api/gameService";
import DiffViewer from "@/components/DiffViewer";


// Todo : make the difference show more user friendly


export default function PatchnoteModificationsPage() {
  const { id, slug } = useParams() as { id: string; slug: string };
  const { patchnote, loading } = usePatchnoteLayout();
  const [modifications, setModifications] = useState<Modification[]>([]);
  const [loadingMods, setLoadingMods] = useState(true);
  const [page, setPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    async function fetchModifications() {
      setLoadingMods(true);
      try {
        const data = await gameService.getModificationsByPatchnoteId(id, page);
        setModifications(data);
      } catch {
        setModifications([]);
      }
      setLoadingMods(false);
    }
    if (id) {
      fetchModifications();
    }
  }, [id, page]);

  if (loading || loadingMods) {
    return (
      <div className="text-center text-gray-400 py-8">
        Chargement des modifications...
      </div>
    );
  }

  if (!patchnote) {
    router.back();
  }

  return (
    <div className="container mx-auto px-4 py-8 text-white">

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Modifications de la patchnote</h1>
        <Button
          color="secondary"
          onPress={() => router.push(`/article/${slug}/patchnote/${id}`)}
        >
          Retour à la patchnote
        </Button>
      </div>
      {modifications.length === 0 ? (
        <div className="text-gray-400">
          Aucune modification trouvée pour cette patchnote.
        </div>
      ) : (
        <div className="space-y-4">
          {modifications.map((mod) => (
            <details
              key={mod.id}
              className="bg-off-gray border border-gray-700 rounded group"
            >
              <summary className="cursor-pointer px-4 py-3 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  {/* Arrow icon */}
                  <span
                    className="transition-transform duration-200 group-open:rotate-90"
                    style={{ display: "inline-block" }}
                  >
                    &gt;
                  </span>
                  <span className="font-semibold text-lg">
                    Modification du{" "}
                    {mod.createdAt
                      ? new Date(mod.createdAt).toLocaleDateString("fr-FR")
                      : ""}
                  </span>
                  <span className="text-xs text-gray-400">
                    {mod.createdAt
                      ? formatDistanceToNow(new Date(mod.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })
                      : ""}
                  </span>
                </div>
                <Button
                  color="danger"
                  size="sm"
                  variant="ghost"
                  onPress={(e) => {
                    (e as unknown as React.MouseEvent).stopPropagation();
                    alert("Fonction de signalement à implémenter");
                  }}
                >
                  Signaler
                </Button>
              </summary>
              <Card>
                <CardBody>
                  <div className="prose max-w-none text-white">
                    {Array.isArray(mod.difference) ? (
                      <DiffViewer diff={mod.difference} />
                    ) : (
                      <ReactMarkdown>{mod.difference}</ReactMarkdown>
                    )}
                  </div>
                </CardBody>
              </Card>
            </details>
          ))}
        </div>
      )}
    <div className="flex justify-center mt-8 space-x-2">
        <Button
            color="secondary"
            variant="ghost"
            disabled={page === 1}
            onPress={() => setPage((p) => Math.max(1, p - 1))}
        >
            Précédent
        </Button>
        <span className="px-4 py-2 rounded bg-gray-800 text-white">
            Page {page}
        </span>
        <Button
            color="secondary"
            variant="ghost"
            disabled={modifications.length === 0}
            onPress={() => setPage((p) => p + 1)}
        >
            Suivant
        </Button>
    </div>
    </div>

  );
}
