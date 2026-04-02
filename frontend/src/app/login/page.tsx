"use client";

import { useAuth } from "@/providers/AuthProvider";
import { FormEvent, useEffect, useState } from "react";

import Link from "next/link";
import { useFlashMessage } from "@/components/FlashMessage/FlashMessageProvider";
import PasswordInput from "@/components/shared/PasswordInput";
import { useTranslation } from "@/i18n/TranslationProvider";
import { isValidEmail } from "@/lib/validationUtils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<{ email?: string }>({});

  const { t } = useTranslation();

  const { login, error, isAuthenticated } = useAuth();
  const { showMessage } = useFlashMessage();

  useEffect(() => {
    if (isAuthenticated && !error) {
      showMessage(t("auth.loginSuccess"), "success");
    }
  }, [isAuthenticated, error, showMessage]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let hasError = false;
    const newFormError: { email?: string } = {};
    if (!isValidEmail(email)) {
      newFormError.email = t("auth.invalidEmail");
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
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-off-black">
      <div className="relative w-full max-w-lg p-4 sm:p-8 overflow-hidden border-4 shadow-2xl bg-offgray border-secondary rounded-xl">
        <h1 className="mb-4 text-2xl sm:text-3xl font-extrabold text-center text-offwhite">
          {t("auth.loginTitle")}
        </h1>
        {(formError.email || error) && (
          <div role="alert" className="px-4 py-3 mb-6 text-sm text-white border border-red-600 rounded-lg bg-red-500/90">
            {formError.email ? formError.email : error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block mb-1 text-sm font-semibold text-offwhite"
            >
              {t("auth.email")}
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
              placeholder={t("auth.emailPlaceholder")}
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
              {t("auth.password")}
            </label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-lg text-offwhite bg-offwhite border-secondary focus:ring-primary focus:border-primary placeholder:text-gray-400"
              placeholder={t("auth.passwordPlaceholder")}
            />
          </div>
          <div className="flex items-center">
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-primary bg-offwhite border-secondary rounded focus:ring-primary focus:ring-2"
            />
            <label
              htmlFor="rememberMe"
              className="block ml-2 text-sm text-offwhite"
            >
              {t("auth.rememberMe")}
            </label>
          </div>
          <div>
            <button
              type="submit"
              className="w-full px-4 py-3 text-lg font-bold transition-colors rounded-lg shadow-md text-offwhite bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-offwhite"
              disabled={loading}
            >
              {loading ? t("common.loading") : t("auth.loginAction")}
            </button>
          </div>
          <div className="mt-2 text-sm text-center text-offwhite">
            {t("auth.noAccount")}{" "}
            <Link
              href="/register"
              className="font-bold underline text-offwhite hover:text-secondary"
            >
              {t("auth.registerAction")}
            </Link>
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
