"use client";

import { useAuth } from "@/providers/AuthProvider";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useFlashMessage } from "@/components/FlashMessage/FlashMessageProvider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<{ email?: string }>({});

  const router = useRouter();

  const { login, error } = useAuth();
  const { showMessage } = useFlashMessage();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let hasError = false;
    const newFormError: { email?: string } = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      newFormError.email = "Veuillez entrer une adresse email valide.";
      hasError = true;
    }
    setFormError(newFormError);
    if (hasError) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await login({ email, password, rememberMe });
    setLoading(false);
    if (!error) {
      showMessage("Connexion réussie !", "success");
      router.push("/");
    } else {
      showMessage(
        "Erreur de connexion : L'email ou le mot de passe est incorrect.",
        "error"
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-off-black">
      <div className="relative w-full max-w-lg p-8 overflow-hidden border-4 shadow-2xl bg-offgray border-secondary rounded-xl">
        <h1 className="mb-4 text-3xl font-extrabold text-center text-offwhite">
          Se connecter
        </h1>
        {(formError.email || error) && (
          <div className="px-4 py-3 mb-4 text-sm text-white border border-red-600 rounded-lg bg-red-500/90 animate-fade-in">
            {formError.email
              ? formError.email
              : "L'email ou le mot de passe est incorrect."}
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
              className="w-full px-4 py-3 border rounded-lg text-offwhite bg-offwhite border-secondary focus:ring-primary focus:border-primary placeholder:text-gray-400"
              placeholder="Choisissez un mot de passe"
            />
          </div>
          <div className="flex items-center">
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label
              htmlFor="rememberMe"
              className="block ml-2 text-sm text-offwhite"
            >
              Se souvenir de moi
            </label>
          </div>
          <div>
            <button
              type="submit"
              className="w-full px-4 py-3 text-lg font-bold transition-colors rounded-lg shadow-md text-offwhite bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-offwhite"
              disabled={loading}
            >
              {loading ? "Chargement..." : "Se connecter"}
            </button>
          </div>
          <div className="mt-2 text-sm text-center text-offwhite">
            Pas encore de compte ?{" "}
            <button
              type="button"
              onClick={() => router.push("/register")}
              className="font-bold underline text-offwhite hover:text-secondary"
            >
              S&apos;inscrire
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
