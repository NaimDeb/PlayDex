"use client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import Image from "next/image";
import { usePatchnoteLayout } from "./layout";

export default function PatchnoteDetailPage() {
  const router = useRouter();
  const { slug, id } = useParams() as { slug: string; id: string };
  const { patchnote, game, loading } = usePatchnoteLayout();

  if (loading) {
    return (
      <div className="text-center text-gray-400 py-8">
        Chargement de la patchnote...
      </div>
    );
  }

  if (!patchnote || !game) {
    return (
      <div className="text-center text-red-500 py-8">
        Patchnote introuvable.
      </div>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-2">{patchnote.title}</h1>
      <div className="flex items-center mb-6">
        <span className="mr-2 font-semibold">Du jeu :</span>
        <Link href={`/article/${slug}`} className="flex items-center gap-2 hover:underline">
          {game.imageUrl && (
            <Image
              src={game.imageUrl}
              alt={game.title}
              width={40}
              height={40}
              className="rounded"
            />
          )}
          <span className="font-semibold">{game.title}</span>
        </Link>
      </div>

      <div className="flex gap-4 mb-8 items-end">
        <Button color="primary" onPress={() => router.push(`/article/${slug}/patchnote/${id}/edit`)}>
          Modifier la patchnote
        </Button>
        <Button color="warning" variant="bordered" onPress={() => router.push(`/report/patchnote/${id}`)}>
          Signaler la patchnote
        </Button>
        <Button color="secondary" variant="bordered" onPress={() => router.push(`/article/${slug}/patchnote/${id}/modifications`)}>
          Voir les modifications
        </Button>
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="prose max-w-none text-white">
            <div dangerouslySetInnerHTML={{ __html: patchnote.content }} />
          </div>
        </CardBody>
      </Card>
    </>
  );
}