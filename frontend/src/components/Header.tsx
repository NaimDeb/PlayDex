"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { useAuth } from "@/providers/AuthProvider";
import {
  SearchIcon,
  XIcon,
  MenuIcon,
  UserCircleIcon,
  ClipboardListIcon,
  LogInIcon as LoginIcon,
  LogOutIcon as LogoutIcon,
} from "lucide-react";
import { addToast } from "@heroui/toast";

// Todo : Implement ajax search

export function Header() {
  // Assume que 'logout' existe dans ton contexte d'authentification
  const { user, isAuthenticated, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Nouvel état pour le menu mobile

  // Fonctions pour basculer l'état et fermer l'autre panneau
  const toggleSearch = () => {
    const newState = !searchOpen;
    setSearchOpen(newState);
    if (newState) {
      // Si on ouvre la recherche, on ferme le menu
      setMobileMenuOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    const newState = !mobileMenuOpen;
    setMobileMenuOpen(newState);
    if (newState) {
      // Si on ouvre le menu, on ferme la recherche
      setSearchOpen(false);
    }
  };

  // Logique des triangles
  const triangleRightWidth = searchOpen ? "md:w-[75vw]" : "w-16";

  const triangleRightClip = searchOpen
    ? "polygon(15% 0, 100% 0, 100% 100%, 0% 100%)"
    : "polygon(100% 0, 0% 100%, 100% 100%)";

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const category = formData.get("category") as string;
    const search = formData.get("search") as string;
    if (!search.trim()) return;

    // Redirige vers la page de recherche avec les paramètres
    window.location.href = `/search?category=${encodeURIComponent(
      category
    )}&q=${encodeURIComponent(search)}`;
    setSearchOpen(false);
  }

  function handleRandomGame() {
    const currentGameId =
      window.location.pathname.split("/article/")[1] || null;
    const randomGameId = Math.floor(Math.random() * 120000) + 1;
    if (randomGameId === parseInt(currentGameId || "0")) {
      window.location.reload();
      return;
    }
    window.location.href = `/article/${randomGameId}`;
    setMobileMenuOpen(false); // Ferme le menu mobile après clic
  }

  // Composant interne pour le formulaire de recherche (évite la duplication)
  const SearchFormComponent = ({
    isMobile = false,
  }: {
    isMobile?: boolean;
  }) => (
    <form
      className={`flex gap-2 py-2 ${
        isMobile
          ? "flex-col w-full px-4"
          : "absolute left-1/4 w-3/4 transform items-center"
      }`}
      onSubmit={handleSearch}
    >
      <select
        className={`h-10 px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 shadow-lg z-40 ${
          isMobile ? "w-full" : "w-36 md:w-48"
        }`}
        defaultValue="jeux"
        name="category"
      >
        <option value="jeux">Jeux</option>
        <option value="extensions">Extensions</option>
        <option value="genre">Genre</option>
        <option value="entreprise">Entreprise</option>
      </select>
      <input
        type="text"
        className={`bg-transparent text-white px-2 placeholder-gray-400 focus:outline-none z-40 ${
          isMobile
            ? "border-b border-gray-500/50 h-10 text-xl w-full"
            : "underline border-none text-3xl w-1/2"
        }`}
        placeholder="Rechercher..."
        autoFocus={!isMobile} // Autofocus seulement sur desktop
        name="search"
      />
      <button
        type="submit"
        className={`bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded z-40 ${
          isMobile ? "w-full mt-2" : "shrink-0"
        }`} // shrink-0 pour desktop
      >
        <SearchIcon className="h-6 w-6 mx-auto" />
      </button>
    </form>
  );

  return (
    // Fragment pour permettre le menu déroulant comme élément adjacent au header
    <>
      <header className="relative h-16 flex w-full overflow-hidden bg-secondary text-white">
        {/* 1. Logo (toujours visible) */}
        <div className="bg-[#18181b] h-full flex items-center px-2 z-30 relative shrink-0">
          {/* Assure-toi que Logo est un lien vers l'accueil */}
          <Link href="/" aria-label="Accueil PlayDex">
            <Logo width={64} />
          </Link>
        </div>

        {/* 2. Triangle gauche */}
        <div
          className="h-full w-8 md:w-16 z-20 flex-shrink-0 bg-off-black"
          style={{ clipPath: "polygon(0 0, 0 100%, 100% 100%)" }}
        />

        {/* 3. Bande centrale avec Nav (Bureau seulement) */}
        <div className="flex-1 h-full bg-secondary items-center justify-center relative z-10 overflow-hidden hidden md:flex">
          {/* Nav bureau (cachée si recherche ouverte) */}
          {!searchOpen && (
            <nav className="font-bold text-xl">
              <Link href="/" className="hover:text-gray-200 px-2">
                Accueil
              </Link>
              <Link href="/#jeux" className="hover:text-gray-200 px-2">
                Jeux
              </Link>
              <a
                onClick={handleRandomGame}
                className="hover:text-gray-200 px-2 cursor-pointer"
              >
                Jeu au hasard
              </a>
            </nav>
          )}
        </div>

        {/* 4. Triangle droit (Bureau seulement) */}
        <div
          className={`h-full ${triangleRightWidth} z-20 flex-shrink-0 transition-all duration-300 relative`}
          style={{ clipPath: triangleRightClip, background: "#18181b" }}
        >
          {/* Formulaire de recherche Bureau (dans le triangle) */}
          {searchOpen && (
            <div className="hidden md:block w-full h-full">
              {" "}
              {/* Conteneur pour positionner le form */}
              <SearchFormComponent isMobile={false} />
            </div>
          )}
        </div>

        {/* 5. Section droite avec icônes/boutons */}
        <div className="bg-[#18181b] h-full flex justify-end items-center px-4 space-x-4 z-30 ml-auto max-md:w-[80vw] md:ml-0 shrink-0">
          {/* Icônes/Boutons Bureau */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="hover:text-gray-200" onClick={toggleSearch}>
              {searchOpen ? (
                <XIcon className="h-6 w-6" />
              ) : (
                <SearchIcon className="h-6 w-6" />
              )}
            </button>
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/profile"
                  className="hover:text-gray-200 flex items-center space-x-2"
                >
                  <UserCircleIcon className="h-7 w-7" />
                  <span className="text-lg font-bold">{user?.username}</span>
                </Link>
                <button
                  onClick={() => {
                    if (logout) logout();
                    addToast({
                      title: "Déconnexion réussie",
                      description: "Vous avez été déconnecté avec succès.",
                      severity: "success",
                    });
                  }}
                  className="hover:text-red-400"
                  title="Déconnexion"
                >
                  <LogoutIcon className="h-6 w-6" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <a href="/login" className="hover:text-gray-200">
                  Connexion
                </a>
                <a
                  href="/register"
                  className="bg-indigo-500 hover:bg-indigo-600 text-white py-1 px-3 rounded"
                >
                  Inscription
                </a>
              </div>
            )}
          </div>

          {/* Icônes Mobile */}
          <div className="flex md:hidden items-center space-x-4 px-8">
            <button className="hover:text-gray-200" onClick={toggleSearch}>
              {searchOpen ? (
                <XIcon className="h-6 w-6" />
              ) : (
                <SearchIcon className="h-6 w-6" />
              )}
            </button>
            {isAuthenticated ? (
              <Link href="/profile" className="hover:text-gray-200">
                <UserCircleIcon className="h-7 w-7" />
              </Link>
            ) : (
              <a href="/login" className="hover:text-gray-200">
                <LoginIcon className="h-6 w-6" />
              </a>
            )}
            <button className="hover:text-gray-200" onClick={toggleMobileMenu}>
              {mobileMenuOpen ? (
                <XIcon className="h-6 w-6" />
              ) : (
                <MenuIcon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Zone déroulante pour Mobile (Recherche ou Menu) */}
      <div className="relative z-40 md:hidden">
        {" "}
        {/* md:hidden pour ne l'afficher que sur mobile */}
        {/* Dropdown Recherche Mobile */}
        {searchOpen && (
          <div className="absolute top-0 left-0 right-0 bg-gray-800 p-4 shadow-lg border-t border-gray-700">
            <SearchFormComponent isMobile={true} />
          </div>
        )}
        {/* Dropdown Menu Mobile */}
        {mobileMenuOpen && (
          <div className="absolute top-0 left-0 right-0 bg-gray-800 p-4 shadow-lg border-t border-gray-700">
            <nav className="flex flex-col space-y-4 text-lg font-medium">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-gray-200 px-2 py-1"
              >
                Accueil
              </Link>
              <Link
                href="/#jeux"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-gray-200 px-2 py-1"
              >
                Jeux
              </Link>
              <a
                onClick={handleRandomGame}
                className="hover:text-gray-200 px-2 py-1 cursor-pointer"
              >
                Jeu au hasard
              </a>
              {/* Liens spécifiques utilisateur si connecté */}
              {isAuthenticated && (
                <>
                  <hr className="border-gray-600 my-2" />
                  <a
                    href="/ma-liste"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 hover:text-gray-200 px-2 py-1"
                  >
                    <ClipboardListIcon className="h-6 w-6" />
                    <span>Ma liste</span>
                  </a>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 hover:text-gray-200 px-2 py-1"
                  >
                    <UserCircleIcon className="h-6 w-6" />
                    <span>Profil ({user?.username})</span>
                  </Link>
                  <button
                    onClick={() => {
                      if (logout) logout();
                      setMobileMenuOpen(false);
                      addToast({
                        title: "Déconnexion réussie",
                        description: "Vous avez été déconnecté avec succès.",
                        severity: "success",
                      });
                    }}
                    className="flex items-center space-x-2 text-red-400 hover:text-red-300 px-2 py-1 text-left"
                  >
                    <LogoutIcon className="h-6 w-6" />
                    <span>Déconnexion</span>
                  </button>
                </>
              )}
              {/* Liens Connexion/Inscription si non connecté */}
              {!isAuthenticated && (
                <>
                  <hr className="border-gray-600 my-2" />
                  <a
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="hover:text-gray-200 px-2 py-1"
                  >
                    Connexion
                  </a>
                  <a
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white py-1 px-3 rounded text-center mx-2"
                  >
                    Inscription
                  </a>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </>
  );
}
