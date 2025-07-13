"use client";

import React, { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import userService from "@/lib/api/userService";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ProfileUpdateData {
  username: string;
  email: string;
  password?: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function ProfileEditPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<ProfileUpdateData>({
    username: user?.username || "",
    email: user?.email || "",
    password: "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Redirect if not authenticated
  if (!user) {
    router.push("/login");
    return null;
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = "Le nom d'utilisateur est requis";
    } else if (formData.username.length < 3) {
      newErrors.username =
        "Le nom d'utilisateur doit contenir au moins 3 caractères";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Veuillez entrer un email valide";
    }

    // Password validation (only if password is provided)
    if (formData.password) {
      if (formData.password.length < 6) {
        newErrors.password =
          "Le mot de passe doit contenir au moins 6 caractères";
      }

      if (formData.password !== confirmPassword) {
        newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
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
        updateData.password = formData.password;
      }

      await userService.patchUserProfile({
        id: user.id,
        ...updateData,
      });

      setSuccess(true);

      // Clear password fields
      setFormData((prev) => ({ ...prev, password: "" }));
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
          }
        });
        setErrors(apiErrors);
      } else {
        setErrors({
          general: "Une erreur est survenue lors de la mise à jour du profil",
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
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-3xl font-bold font-montserrat [color:var(--color-primary)]">
            Modifier le profil
          </h1>
        </div>

        {/* Success Message */}
        {success && (
          <div className="p-4 mb-6 text-green-400 bg-green-900 rounded-md bg-opacity-30">
            Profil mis à jour avec succès ! Redirection en cours...
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
          <div className="p-6 bg-gray-800 rounded-lg shadow-xl bg-opacity-70 backdrop-blur-sm">
            {/* Username Field */}
            <div className="mb-6">
              <label
                htmlFor="username"
                className="block mb-2 text-sm font-medium text-gray-300"
              >
                Nom d&apos;utilisateur
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
                placeholder="Votre nom d'utilisateur"
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
                Adresse email
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
              <h3 className="mb-4 text-lg font-semibold text-gray-300">
                Changer le mot de passe
              </h3>
              <p className="mb-4 text-sm text-gray-400">
                Laissez vide si vous ne souhaitez pas changer votre mot de passe
              </p>

              {/* New Password Field */}
              <div className="mb-4">
                <label
                  htmlFor="password"
                  className="block mb-2 text-sm font-medium text-gray-300"
                >
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-gray-700 border rounded-md text-off-white focus:ring-2 focus:border-0 focus:outline-primary ${
                    errors.password ? "border-red-500" : "border-gray-600"
                  }`}
                  placeholder="Nouveau mot de passe (optionnel)"
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
                  Confirmer le nouveau mot de passe
                </label>
                <input
                  type="password"
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
                  className={`w-full px-4 py-3 bg-gray-700 border rounded-md text-off-white focus:ring-2 focus:border-0 focus:outline-primary ${
                    errors.confirmPassword
                      ? "border-red-500"
                      : "border-gray-600"
                  }`}
                  placeholder="Confirmez le nouveau mot de passe"
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
                Annuler
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
                  ? "Enregistrement..."
                  : "Enregistrer les modifications"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
