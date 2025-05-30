"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import userService from "@/lib/api/userService";
import Image from "next/image";

interface UserProfile {
  id: number;
  email: string;
  roles: string[];
  username: string;
  createdAt: string;
  reputation: number | string;
  modifications?: string[];
  followedGames?: string[];
}

export default function AccountPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const userData = await userService.getUserById(Number(userId));
        setUser(userData);
        setError(null);
      } catch (err) {
        console.error("Erreur dans fetchUser:", err);
        setError("Utilisateur introuvable ou erreur lors du chargement.");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchUser();
  }, [userId]);

  const avatarUrl = "/user_placeholder.svg";

  if (error) {
    return (
      <div className="container px-4 py-8 mx-auto text-off-white flex flex-col items-center justify-center min-h-[60vh]">
        <div className="p-8 text-center bg-red-900 rounded-md bg-opacity-30">
          <h2 className="mb-4 text-2xl font-bold text-red-400">{error}</h2>
          <button
            className="px-6 py-2 font-semibold text-white rounded-md [background-color:var(--color-primary)]"
            onClick={() => router.back()}
          >
            Retour à la page précédente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto text-off-white">
      {/* Profile Header Section */}
      <section className="mb-12">
        <div className="flex flex-col items-center gap-6 p-6 bg-gray-800 rounded-lg shadow-xl md:flex-row md:items-start md:gap-8 bg-opacity-70 backdrop-blur-sm">
          <div className="relative w-36 h-36 md:w-48 md:h-48">
            <Image
              src={avatarUrl}
              alt="User Avatar"
              fill
              className="object-cover border-4 rounded-full shadow-md bg-primary"
              sizes="(max-width: 768px) 9rem, 12rem"
              priority
            />
          </div>
          <div className="flex-grow text-center md:text-left">
            <h1 className="text-3xl font-bold lg:text-4xl font-montserrat [color:var(--color-primary)]">
              {user?.username || "Utilisateur"}
            </h1>
            <p className="mt-2 text-sm text-gray-300">
              {user ? `ID: ${user.id}` : ""}
            </p>
            <p className="text-sm text-gray-300">
              {user
                ? `Utilisateur depuis le : ${
                    user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : ""
                  }`
                : ""}
            </p>
            <p className="text-sm text-gray-300">
              {loading
                ? "Chargement des jeux..."
                : `${user?.followedGames?.length ?? 0} jeux dans sa liste`}
            </p>
            <p className="text-sm text-gray-300">
              {user ? `${user.modifications?.length ?? 0} modifications` : ""}
            </p>
            <p className="mt-2 text-lg font-semibold text-green-400">
              {user ? `+ ${user.reputation} Rep` : ""}
            </p>
          </div>
        </div>
      </section>

      {/* Ma Liste Section */}
      <section>
        <div className="flex flex-col items-center justify-between mb-8 sm:flex-row">
          <h2 className="mb-4 text-3xl font-bold font-montserrat sm:mb-0">
            Sa liste
          </h2>
        </div>
      </section>
    </div>
  );
}
