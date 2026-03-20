"use client";

import { useAuth } from "@/providers/AuthProvider";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useFlashMessage } from "@/components/FlashMessage/FlashMessageProvider";
import Link from "next/link";
import PasswordInput from "@/components/shared/PasswordInput";
import { useTranslation } from "@/i18n/TranslationProvider";
import { isValidEmail, validatePassword } from "@/lib/validationUtils";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formError, setFormError] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    username?: string;
    acceptTerms?: string;
  }>({
    email: undefined,
    password: undefined,
    confirmPassword: undefined,
    username: undefined,
    acceptTerms: undefined,
  });
  const { register, error } = useAuth();
  const { showMessage } = useFlashMessage();
  const router = useRouter();
  const { t } = useTranslation();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let hasError = false;
    const newFormError: {
      email?: string;
      password?: string;
      confirmPassword?: string;
      username?: string;
      acceptTerms?: string;
    } = {};

    if (!isValidEmail(email)) {
      newFormError.email = t("auth.invalidEmail");
      hasError = true;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      newFormError.password = t(passwordError);
      hasError = true;
    }

    if (password !== confirmPassword) {
      newFormError.confirmPassword = t("auth.passwordMismatch");
      hasError = true;
    }

    if (!username || username.length < 4) {
      newFormError.username = t("auth.usernameMinLength");
      hasError = true;
    } else if (username.length > 100) {
      newFormError.username = t("auth.usernameMaxLength");
      hasError = true;
    }

    if (!acceptTerms) {
      newFormError.acceptTerms = t("auth.mustAcceptTerms");
      hasError = true;
    }

    setFormError(newFormError);
    if (hasError) {
      return;
    }

    setLoading(true);
    try {
      await register({ email, password, username });
      showMessage(t("auth.registerSuccess"), "success");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { violations?: Array<{ propertyPath: string; message: string }> } } };
      const violations = error?.response?.data?.violations;
      if (violations && Array.isArray(violations)) {
        violations.forEach((violation: { propertyPath: string; message: string }) => {
          if (violation.propertyPath === "plainPassword") {
            setFormError(prev => ({ ...prev, password: violation.message }));
          } else if (violation.propertyPath === "email") {
            setFormError(prev => ({ ...prev, email: violation.message }));
          } else if (violation.propertyPath === "username") {
            setFormError(prev => ({ ...prev, username: violation.message }));
          }
        });
      } else {
        showMessage(typeof error === 'string' ? error : t("auth.registerError"), "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-off-black">
      <div className="relative w-full max-w-lg p-4 sm:p-8 overflow-hidden border-4 shadow-2xl bg-offgray border-secondary rounded-xl">
        <h1 className="mb-4 text-2xl sm:text-3xl font-extrabold text-center text-offwhite">
          {t("auth.registerTitle")}
        </h1>
        <p className="mb-8 text-base font-medium text-center text-offwhite">
          {t("auth.registerSubtitle")}
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
              error={formError.password}
              className="rounded-lg text-offwhite bg-offwhite border-secondary focus:ring-primary focus:border-primary placeholder:text-gray-400"
              placeholder={t("auth.passwordChoosePlaceholder")}
            />
            {formError.password && (
              <p className="mt-1 text-xs text-red-400 animate-fade-in">
                {formError.password}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block mb-1 text-sm font-semibold text-offwhite"
            >
              {t("auth.confirmPassword")}
            </label>
            <PasswordInput
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              error={formError.confirmPassword}
              className="rounded-lg text-offwhite bg-offwhite border-secondary focus:ring-primary focus:border-primary placeholder:text-gray-400"
              placeholder={t("auth.confirmPasswordPlaceholder")}
            />
            {formError.confirmPassword && (
              <p className="mt-1 text-xs text-red-400 animate-fade-in">
                {formError.confirmPassword}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="pseudo"
              className="block mb-1 text-sm font-semibold text-offwhite"
            >
              {t("auth.pseudo")}
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
              placeholder={t("auth.pseudoPlaceholder")}
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
                {t("auth.acceptTerms")}{" "}
                <Link
                  href="/terms"
                  className="font-semibold underline text-primary hover:text-secondary"
                  target="_blank"
                >
                  {t("auth.termsLink")}
                </Link>{" "}
                {t("auth.and")}{" "}
                <Link
                  href="/privacy"
                  className="font-semibold underline text-primary hover:text-secondary"
                  target="_blank"
                >
                  {t("auth.privacyLink")}
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
              {loading ? t("common.loading") : t("auth.registerAction")}
            </button>
          </div>
          <div className="mt-2 text-sm text-center text-offwhite">
            {t("auth.hasAccount")}{" "}
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="font-bold underline text-offwhite hover:text-secondary"
            >
              {t("auth.loginAction")}
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
