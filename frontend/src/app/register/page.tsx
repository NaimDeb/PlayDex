"use client";

import { useAuth } from "@/providers/AuthProvider";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useFlashMessage } from "@/components/FlashMessage/FlashMessageProvider";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<{
    email?: string;
    password?: string;
    username?: string;
    acceptTerms?: string;
  }>({
    email: undefined,
    password: undefined,
    username: undefined,
    acceptTerms: undefined,
  });
  // Assume register returns: Promise<{ status?: number; description?: string; error?: string } | undefined>
  const { register, error } = useAuth();
  const { showMessage } = useFlashMessage();
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let hasError = false;
    const newFormError: {
      email?: string;
      password?: string;
      username?: string;
      acceptTerms?: string;
    } = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      newFormError.email = "Veuillez entrer une adresse email valide.";
      hasError = true;
    }
    if (!password || password.length < 8) {
      newFormError.password =
        "Le mot de passe doit contenir au moins 8 caractères.";
      hasError = true;
    }

    if (password.length > 100) {
      newFormError.password =
        "Le mot de passe doit contenir contenir moins de 100 caractères.";
      hasError = true;
    }

    if (password.search(/[A-Z]/) < 0) {
      newFormError.password =
        "Le mot de passe doit contenir au moins une majuscule.";
      hasError = true;
    }

    if (!username || username.length < 4) {
      newFormError.username = "Le pseudo doit contenir au moins 4 caractères.";
      hasError = true;
    }
    if (username.length > 100) {
      newFormError.username = "Le pseudo doit contenir au moins 4 caractères.";
      hasError = true;
    }
    if (!acceptTerms) {
      newFormError.acceptTerms =
        "Vous devez accepter les conditions d'utilisation.";
      hasError = true;
    }
    setFormError(newFormError);
    if (hasError) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const result = (await register({ email, password, username })) as
      | { status?: number; description?: string; error?: string }
      | undefined;
    setLoading(false);

    if (result !== undefined && result.status === 422 && result.description) {
      showMessage(result.description, "error");
      return;
    }

    // Si le status n'est pas 201 (créé), ou s'il y a une erreur, affiche une erreur
    if (!result || result.status !== 201 || result.error || error) {
      showMessage(
        "Erreur d'inscription : Une erreur est survenue lors de l'inscription.",
        "error"
      );
      return;
    }

    showMessage("Inscription réussie !", "success");
    router.push("/");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-off-black">
      <div className="relative w-full max-w-lg p-8 overflow-hidden border-4 shadow-2xl bg-offgray border-secondary rounded-xl">
        <h1 className="mb-4 text-3xl font-extrabold text-center text-offwhite">
          Inscription
        </h1>
        <p className="mb-8 text-base font-medium text-center text-offwhite">
          Rejoignez PlayDex pour suivre vos jeux préférés, recevoir des
          notifications sur les nouveautés, et partager vos avis avec la
          communauté !
        </p>
        {error && (
          <div className="px-4 py-3 mb-6 text-sm text-white border border-red-600 rounded-lg bg-red-500/90">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block mb-1 text-sm font-semibold text-offwhite"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`w-full px-4 py-3 border rounded-lg text-offwhite bg-offwhite border-secondary focus:ring-primary focus:border-primary placeholder:text-gray-400 ${
                formError.email
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
              placeholder="Votre email"
            />
            {formError.email && (
              <p className="mt-1 text-xs text-red-400 animate-fade-in">
                {formError.email}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="password"
              className="block mb-1 text-sm font-semibold text-offwhite"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`w-full px-4 py-3 border rounded-lg text-offwhite bg-offwhite border-secondary focus:ring-primary focus:border-primary placeholder:text-gray-400 ${
                formError.password
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
              placeholder="Choisissez un mot de passe"
            />
            {formError.password && (
              <p className="mt-1 text-xs text-red-400 animate-fade-in">
                {formError.password}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="pseudo"
              className="block mb-1 text-sm font-semibold text-offwhite"
            >
              Pseudo
            </label>
            <input
              id="pseudo"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className={`w-full px-4 py-3 border rounded-lg text-offwhite bg-offwhite border-secondary focus:ring-primary focus:border-primary placeholder:text-gray-400 ${
                formError.username
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
              placeholder="Votre pseudo"
            />
            {formError.username && (
              <p className="mt-1 text-xs text-red-400 animate-fade-in">
                {formError.username}
              </p>
            )}
          </div>
          <div>
            <div className="flex items-start space-x-2">
              <input
                id="acceptTerms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className={`mt-1 w-4 h-4 text-primary bg-offwhite border-secondary rounded focus:ring-primary focus:ring-2 ${
                  formError.acceptTerms
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
              />
              <label htmlFor="acceptTerms" className="text-sm text-offwhite">
                J&#39;accepte les{" "}
                <Link
                  href="/terms"
                  className="font-semibold underline text-primary hover:text-secondary"
                  target="_blank"
                >
                  conditions d&#39;utilisation
                </Link>{" "}
                et les{" "}
                <Link
                  href="/privacy"
                  className="font-semibold underline text-primary hover:text-secondary"
                  target="_blank"
                >
                  termes de confidentialité
                </Link>
              </label>
            </div>
            {formError.acceptTerms && (
              <p className="mt-1 text-xs text-red-400 animate-fade-in">
                {formError.acceptTerms}
              </p>
            )}
          </div>
          <div>
            <button
              type="submit"
              className="w-full px-4 py-3 text-lg font-bold transition-colors rounded-lg shadow-md text-offwhite bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-offwhite"
              disabled={loading}
            >
              {loading ? "Chargement..." : "S'inscrire"}
            </button>
          </div>
          <div className="mt-2 text-sm text-center text-offwhite">
            Déjà un compte ?{" "}
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="font-bold underline text-offwhite hover:text-secondary"
            >
              Se connecter
            </button>
          </div>
        </form>
      </div>
      <style jsx>{`
        .bg-offgray {
          background-color: #232329;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-in;
        }
      `}</style>
    </div>
  );
}
