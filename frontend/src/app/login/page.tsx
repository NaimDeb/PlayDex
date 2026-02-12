"use client";

import { useAuth } from "@/providers/AuthProvider";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFlashMessage } from "@/components/FlashMessage/FlashMessageProvider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<{ email?: string }>({});

  const router = useRouter();

  const { login, error, isAuthenticated } = useAuth();
  const { showMessage } = useFlashMessage();

  useEffect(() => {
    if (isAuthenticated && !error) {
      showMessage("Connexion réussie !", "success");
      // router.push("/") inutile ici, déjà fait dans le provider
    }
  }, [isAuthenticated, error, showMessage]);

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
    await login({ email, password, rememberMe });
    setLoading(false);
    // Ne rien faire ici, le message de succès ou d'erreur est géré par le provider et l'effet ci-dessus
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-off-black">
      <div className="relative w-full max-w-lg p-8 overflow-hidden border-4 shadow-2xl bg-off-gray border-secondary rounded-xl">
        <h1 className="mb-4 text-3xl font-extrabold text-center text-off-white">
          Se connecter
        </h1>
        {(formError.email || error) && (
          <div className="px-4 py-3 mb-4 text-sm text-white border border-red-600 rounded-lg bg-red-500/90 animate-fade-in">
            {formError.email ? formError.email : error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block mb-1 text-sm font-semibold text-off-white"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`w-full px-4 py-3 border rounded-lg text-off-white bg-off-white border-secondary focus:ring-primary focus:border-primary placeholder:text-gray-400 ${
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
              className="block mb-1 text-sm font-semibold text-off-white"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border rounded-lg text-off-white bg-off-white border-secondary focus:ring-primary focus:border-primary placeholder:text-gray-400"
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
              className="block ml-2 text-sm text-off-white"
            >
              Se souvenir de moi
            </label>
          </div>
          <div>
            <button
              type="submit"
              className="w-full px-4 py-3 text-lg font-bold transition-colors rounded-lg shadow-md text-off-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-off-white"
              disabled={loading}
            >
              {loading ? "Chargement..." : "Se connecter"}
            </button>
          </div>
          <div className="mt-2 text-sm text-center text-off-white">
            Pas encore de compte ?{" "}
            <button
              type="button"
              onClick={() => router.push("/register")}
              className="font-bold underline text-off-white hover:text-secondary"
            >
              S&apos;inscrire
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
