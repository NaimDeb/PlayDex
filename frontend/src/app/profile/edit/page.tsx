"use client";

import React, { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import userService from "@/lib/api/userService";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import PasswordInput from "@/components/shared/PasswordInput";
import { useTranslation } from "@/i18n/TranslationProvider";
import { isValidEmail, validatePassword } from "@/lib/validationUtils";

export const dynamic = 'force-dynamic';

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

  // Redirect if not authenticated
  if (!user) {
    router.push("/login");
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
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
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
          <h1 className="text-2xl sm:text-3xl font-bold font-montserrat [color:var(--color-primary)]">
            {t("profile.editTitle")}
          </h1>
        </div>

        {/* Success Message */}
        {success && (
          <div className="p-4 mb-6 text-green-400 bg-green-900 rounded-md bg-opacity-30">
            {t("profile.updateSuccess")}
          </div>
        )}

        {/* General Error */}
        {errors.general && (
          <div className="p-4 mb-6 text-red-400 bg-red-900 rounded-md bg-opacity-30">
            {errors.general}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 sm:p-6 bg-gray-800 rounded-lg shadow-xl bg-opacity-70 backdrop-blur-sm">
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
                className={`w-full px-4 py-3 bg-gray-700 border rounded-md text-off-white focus:ring-2 focus:border-0 focus:outline-primary ${
                  errors.username ? "border-red-500" : "border-gray-600"
                }`}
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
                className={`w-full px-4 py-3 bg-gray-700 border rounded-md text-off-white focus:ring-2 focus:border-0 focus:outline-primary ${
                  errors.email ? "border-red-500" : "border-gray-600"
                }`}
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
                  className={`bg-gray-700 rounded-md text-off-white focus:ring-2 focus:border-0 focus:outline-primary ${
                    !errors.currentPassword ? "border-gray-600" : ""
                  }`}
                  buttonClassName="text-gray-400 hover:text-off-white"
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
                  className={`bg-gray-700 rounded-md text-off-white focus:ring-2 focus:border-0 focus:outline-primary ${
                    !errors.password ? "border-gray-600" : ""
                  }`}
                  buttonClassName="text-gray-400 hover:text-off-white"
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
                  className={`bg-gray-700 rounded-md text-off-white focus:ring-2 focus:border-0 focus:outline-primary ${
                    !errors.confirmPassword ? "border-gray-600" : ""
                  }`}
                  buttonClassName="text-gray-400 hover:text-off-white"
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
                className="px-6 py-3 text-center text-gray-300 transition duration-150 ease-in-out bg-gray-600 rounded-md hover:bg-gray-500"
              >
                {t("common.cancel")}
              </Link>
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-3 font-semibold text-white rounded-md transition duration-150 ease-in-out ${
                  loading
                    ? "bg-gray-500 cursor-not-allowed"
                    : "[background-color:var(--color-primary)] hover:opacity-90"
                }`}
              >
                {loading
                  ? t("common.saving")
                  : t("profile.saveChanges")}
              </button>
            </div>
          </div>
        </form>

        {/* ── Delete account ── */}
        <div className="mt-10 pt-8 border-t border-red-500/30">
          <h2 className="text-lg font-bold text-red-400 mb-2 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            {t("profile.deleteAccount")}
          </h2>
          <p className="text-sm text-off-white/60 mb-4">
            {t("profile.deleteConfirm")}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
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
                className="bg-gray-700 rounded-md text-off-white focus:ring-2 focus:border-0 focus:outline-primary border-gray-600"
                buttonClassName="text-gray-400 hover:text-off-white"
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
