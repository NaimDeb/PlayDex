"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import userService from "@/lib/api/userService";
import { useRouter } from "next/navigation";
import { Bell, Trash2 } from "lucide-react";
import Link from "next/link";
import PasswordInput from "@/components/shared/PasswordInput";
import { useTranslation } from "@/i18n/TranslationProvider";
import { isValidEmail, validatePassword } from "@/lib/validationUtils";

export const dynamic = 'force-dynamic';

// ─── Styles ───────────────────────────────────────────────────────────────────
// Palette du site (cf. FIELD_CLASS de components/shared/FormField) : panneaux
// off-gray, champs off-black, focus primary.

const PANEL_CLASS = "p-4 rounded-lg shadow-xl sm:p-6 bg-off-gray border border-off-white/10";

const INPUT_CLASS =
  "bg-off-black border-gray-600 rounded text-off-white placeholder:text-gray-600 " +
  "focus:outline-none focus:border-primary transition-colors [color-scheme:dark]";

const TEXT_INPUT_CLASS = `w-full px-4 py-3 border ${INPUT_CLASS}`;

interface ProfileUpdateData {
  username: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  currentPassword?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function ProfileEditPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const [formData, setFormData] = useState<ProfileUpdateData & { password?: string }>({
    username: user?.username || "",
    email: user?.email || "",
    currentPassword: "",
    password: "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Préférence de notification : enregistrée immédiatement, hors du formulaire
  // principal, pour que la désinscription reste possible en un clic.
  const [emailNotifications, setEmailNotifications] = useState(
    user?.emailNotifications ?? true
  );
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [notificationsSaving, setNotificationsSaving] = useState(false);

  useEffect(() => {
    if (user?.emailNotifications !== undefined) {
      setEmailNotifications(user.emailNotifications);
    }
  }, [user?.emailNotifications]);

  const handleToggleEmailNotifications = async () => {
    const next = !emailNotifications;

    setEmailNotifications(next); // optimiste
    setNotificationsError(null);
    setNotificationsSaving(true);

    try {
      const saved = await userService.updateEmailNotifications(next);
      setEmailNotifications(saved);
    } catch {
      setEmailNotifications(!next); // rollback
      setNotificationsError(t("profile.notificationsError"));
    } finally {
      setNotificationsSaving(false);
    }
  };

  // Redirect if not authenticated (in an effect so it never runs during SSR/prerender)
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = t("profile.usernameRequired");
    } else if (formData.username.length < 3) {
      newErrors.username = t("profile.usernameMinLength");
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = t("profile.emailRequired");
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = t("auth.invalidEmail");
    }

    // Password validation (only if password is provided)
    if (formData.password) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = t("auth.currentPasswordRequired");
      }
      const passwordError = validatePassword(formData.password);
      if (passwordError) {
        newErrors.password = t(passwordError);
      }

      if (formData.password !== confirmPassword) {
        newErrors.confirmPassword = t("auth.passwordMismatch");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});
    setSuccess(false);

    try {
      const updateData: Partial<ProfileUpdateData> = {
        username: formData.username,
        email: formData.email,
      };

      // Only include password if it's provided
      if (formData.password) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.password;
      }

      await userService.patchUserProfile({
        id: user.id,
        ...updateData,
      });

      setSuccess(true);

      // Clear password fields
      setFormData((prev) => ({ ...prev, currentPassword: "", password: "" }));
      setConfirmPassword("");

      // Show success message and redirect after a short delay
      setTimeout(() => {
        router.push("/profile");
      }, 2000);
    } catch (error: unknown) {
      console.error("Error updating profile:", error);

      const apiError = error as {
        response?: {
          data?: {
            detail?: string;
            violations?: Array<{
              propertyPath: string;
              message: string;
            }>;
          };
        };
      };

      if (apiError.response?.data?.detail) {
        setErrors({ general: apiError.response.data.detail });
      } else if (apiError.response?.data?.violations) {
        // Handle validation errors from API
        const apiErrors: FormErrors = {};
        apiError.response.data.violations.forEach((violation) => {
          if (violation.propertyPath === "username") {
            apiErrors.username = violation.message;
          } else if (violation.propertyPath === "email") {
            apiErrors.email = violation.message;
          } else if (violation.propertyPath === "password") {
            apiErrors.password = violation.message;
          } else if (violation.propertyPath === "currentPassword") {
            apiErrors.currentPassword = violation.message;
          }
        });
        setErrors(apiErrors);
      } else {
        setErrors({
          general: t("profile.updateError"),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear errors when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="container px-4 py-8 mx-auto text-off-white">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/profile"
            className="p-2 transition-colors duration-150 rounded-lg bg-off-gray hover:bg-off-white/10"
            aria-label={t("common.back")}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold font-montserrat text-off-white">
            {t("profile.editTitle")}
          </h1>
        </div>

        {/* Success Message */}
        {success && (
          <div className="p-4 mb-6 text-green-300 border rounded-md bg-green-500/15 border-green-500/40">
            {t("profile.updateSuccess")}
          </div>
        )}

        {/* General Error */}
        {errors.general && (
          <div className="p-4 mb-6 text-red-300 border rounded-md bg-red-500/15 border-red-500/40">
            {errors.general}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className={PANEL_CLASS}>
            {/* Username Field */}
            <div className="mb-6">
              <label
                htmlFor="username"
                className="block mb-2 text-sm font-medium text-gray-300"
              >
                {t("profile.usernameLabel")}
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={`${TEXT_INPUT_CLASS} ${errors.username ? "border-red-500" : ""}`}
                placeholder={t("auth.pseudoPlaceholder")}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-400">{errors.username}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="mb-6">
              <label
                htmlFor="email"
                className="block mb-2 text-sm font-medium text-gray-300"
              >
                {t("profile.emailLabel")}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`${TEXT_INPUT_CLASS} ${errors.email ? "border-red-500" : ""}`}
                placeholder="votre.email@exemple.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password Section */}
            <div className="pt-6 border-t border-gray-600">
              <h2 className="mb-4 text-lg font-semibold text-gray-300">
                {t("auth.changePassword")}
              </h2>
              <p className="mb-4 text-sm text-gray-400">
                {t("auth.changePasswordHint")}
              </p>

              {/* Current Password Field */}
              <div className="mb-4">
                <label
                  htmlFor="currentPassword"
                  className="block mb-2 text-sm font-medium text-gray-300"
                >
                  {t("auth.currentPassword")}
                </label>
                <PasswordInput
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  error={errors.currentPassword}
                  className={INPUT_CLASS}
                  buttonClassName="text-gray-400 hover:text-off-white"
                  autoComplete="current-password"
                  placeholder={t("auth.currentPasswordPlaceholder")}
                />
                {errors.currentPassword && (
                  <p className="mt-1 text-sm text-red-400">{errors.currentPassword}</p>
                )}
              </div>

              {/* New Password Field */}
              <div className="mb-4">
                <label
                  htmlFor="password"
                  className="block mb-2 text-sm font-medium text-gray-300"
                >
                  {t("auth.newPassword")}
                </label>
                <PasswordInput
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  error={errors.password}
                  className={INPUT_CLASS}
                  buttonClassName="text-gray-400 hover:text-off-white"
                  autoComplete="new-password"
                  placeholder={t("auth.newPasswordPlaceholder")}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="mb-6">
                <label
                  htmlFor="confirmPassword"
                  className="block mb-2 text-sm font-medium text-gray-300"
                >
                  {t("auth.confirmNewPassword")}
                </label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) {
                      setErrors((prev) => ({
                        ...prev,
                        confirmPassword: undefined,
                      }));
                    }
                  }}
                  error={errors.confirmPassword}
                  className={INPUT_CLASS}
                  buttonClassName="text-gray-400 hover:text-off-white"
                  autoComplete="new-password"
                  placeholder={t("auth.confirmNewPasswordPlaceholder")}
                  disabled={!formData.password}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
              <Link
                href="/profile"
                className="px-6 py-3 text-center transition-colors duration-150 border rounded-md border-off-white/50 text-off-white hover:border-off-white hover:bg-off-white/5"
              >
                {t("common.cancel")}
              </Link>
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-3 font-semibold rounded-md text-off-white transition-colors duration-150 ${
                  loading
                    ? "bg-off-black cursor-not-allowed opacity-60"
                    : "bg-primary hover:bg-secondary cursor-pointer"
                }`}
              >
                {loading
                  ? t("common.saving")
                  : t("profile.saveChanges")}
              </button>
            </div>
          </div>
        </form>

        {/* ── Notifications ── */}
        <div className={`mt-6 ${PANEL_CLASS}`}>
          <h2 className="flex items-center gap-2 mb-2 text-lg font-semibold text-gray-300">
            <Bell className="w-5 h-5" aria-hidden="true" />
            {t("profile.notificationsTitle")}
          </h2>
          <p className="mb-4 text-sm text-gray-400">
            {t("profile.notificationsHint")}
          </p>

          <div className="flex items-start justify-between gap-4">
            <div>
              <label
                htmlFor="emailNotifications"
                className="block text-sm font-medium text-gray-300"
              >
                {t("profile.emailNotificationsLabel")}
              </label>
              <p className="mt-1 text-sm text-gray-400">
                {t("profile.emailNotificationsDescription")}
              </p>
            </div>

            <button
              type="button"
              id="emailNotifications"
              role="switch"
              aria-checked={emailNotifications}
              disabled={notificationsSaving}
              onClick={handleToggleEmailNotifications}
              className={`relative inline-flex items-center h-6 rounded-full w-11 shrink-0 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-off-gray disabled:opacity-50 disabled:cursor-not-allowed ${
                emailNotifications ? "bg-primary" : "bg-off-black"
              }`}
            >
              <span
                className={`inline-block w-4 h-4 transition-transform bg-white rounded-full ${
                  emailNotifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {notificationsError && (
            <p className="mt-3 text-sm text-red-400">{notificationsError}</p>
          )}
        </div>

        {/* ── Delete account ── */}
        <div className="pt-8 mt-10 border-t border-red-500/30">
          <h2 className="flex items-center gap-2 mb-2 text-lg font-bold text-red-400">
            <Trash2 className="w-5 h-5" />
            {t("profile.deleteAccount")}
          </h2>
          <p className="mb-4 text-sm text-off-white/60">
            {t("profile.deleteConfirm")}
          </p>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end">
            <div className="w-full sm:w-64">
              <label htmlFor="deletePassword" className="block text-sm font-semibold text-gray-300 mb-1.5">
                {t("auth.password")}
              </label>
              <PasswordInput
                id="deletePassword"
                name="deletePassword"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setDeleteError(null);
                }}
                placeholder={t("auth.passwordPlaceholder")}
                className={INPUT_CLASS}
                buttonClassName="text-gray-400 hover:text-off-white"
                // "off" est ignoré par la plupart des gestionnaires de mots de
                // passe : "new-password" est ce qui empêche réellement le
                // pré-remplissage sur ce champ de confirmation.
                autoComplete="new-password"
              />
            </div>
            <button
              type="button"
              disabled={!deletePassword || deleteLoading}
              onClick={async () => {
                if (!user?.id || !deletePassword) return;
                setDeleteLoading(true);
                setDeleteError(null);
                try {
                  await userService.deleteAccount(user.id);
                  logout();
                } catch {
                  setDeleteError(t("profile.deleteError"));
                } finally {
                  setDeleteLoading(false);
                }
              }}
              className="px-6 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {deleteLoading ? t("common.loading") : t("profile.deleteAccount")}
            </button>
          </div>
          {deleteError && (
            <p className="mt-2 text-sm text-red-400">{deleteError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
