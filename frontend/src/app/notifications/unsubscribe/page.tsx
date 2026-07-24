"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BellOff, CircleAlert } from "lucide-react";
import { useTranslation } from "@/i18n/TranslationProvider";

export const dynamic = "force-dynamic";

/**
 * Page d'atterrissage du lien « Ne plus recevoir ces emails ».
 * L'opt-out est déjà appliqué côté API : cette page ne fait que confirmer,
 * le paramètre `status` étant posé par la redirection du back.
 */
function UnsubscribeContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const success = searchParams.get("status") !== "invalid";

  return (
    <div className="container px-4 py-16 mx-auto text-off-white">
      <div className="max-w-lg p-6 mx-auto text-center bg-gray-800 rounded-lg shadow-xl bg-opacity-70 backdrop-blur-sm sm:p-8">
        <div className="flex justify-center mb-4">
          {success ? (
            <BellOff
              className="w-12 h-12 [color:var(--color-primary)]"
              aria-hidden="true"
            />
          ) : (
            <CircleAlert className="w-12 h-12 text-red-400" aria-hidden="true" />
          )}
        </div>

        <h1 className="mb-3 text-2xl font-bold font-montserrat">
          {success ? t("unsubscribe.successTitle") : t("unsubscribe.invalidTitle")}
        </h1>

        <p className="mb-8 text-sm leading-relaxed text-gray-400">
          {success
            ? t("unsubscribe.successMessage")
            : t("unsubscribe.invalidMessage")}
        </p>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/profile/edit"
            className="px-6 py-3 font-semibold text-white transition duration-150 ease-in-out rounded-md [background-color:var(--color-primary)] hover:opacity-90"
          >
            {t("unsubscribe.backToProfile")}
          </Link>
          <Link
            href="/"
            className="px-6 py-3 text-gray-300 transition duration-150 ease-in-out bg-gray-600 rounded-md hover:bg-gray-500"
          >
            {t("unsubscribe.backToHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  // useSearchParams impose une frontière Suspense en App Router.
  return (
    <Suspense fallback={null}>
      <UnsubscribeContent />
    </Suspense>
  );
}
