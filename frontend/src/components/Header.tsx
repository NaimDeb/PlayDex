"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { useAuth } from "@/providers/AuthProvider";
import { useFlashMessage } from "@/components/FlashMessage/FlashMessageProvider";
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
  const { showMessage } = useFlashMessage();
  

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
        <SearchIcon className="w-6 h-6 mx-auto" />
      </button>
    </form>
  );

  return (
    // Fragment pour permettre le menu déroulant comme élément adjacent au header
    <>
      <header className="relative flex w-full h-16 overflow-hidden text-white bg-secondary">
        {/* 1. Logo (toujours visible) */}
        <div className="relative z-30 flex items-center h-full px-2 bg- shrink-0 bg-off-black">
          {/* Assure-toi que Logo est un lien vers l'accueil */}
          <Link href="/" aria-label="Accueil PlayDex">
            <Logo width={64} />
          </Link>
        </div>

        {/* 2. Triangle gauche */}
        <div
          className="z-20 flex-shrink-0 w-8 h-full md:w-16 bg-off-black"
          style={{ clipPath: "polygon(0 0, 0 100%, 100% 100%)" }}
        />

        {/* 3. Bande centrale avec Nav (Bureau seulement) */}
        <div className="relative z-10 items-center justify-center flex-1 hidden h-full overflow-hidden bg-secondary md:flex">
          {/* Nav bureau (cachée si recherche ouverte) */}
          {!searchOpen && (
            <nav className="text-xl font-bold">
              <Link href="/" className="px-2 hover:text-gray-200">
                Accueil
              </Link>
              <Link href="/#jeux" className="px-2 hover:text-gray-200">
                Jeux
              </Link>
              <a
                onClick={handleRandomGame}
                className="px-2 cursor-pointer hover:text-gray-200"
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
            <div className="hidden w-full h-full md:block">
              {" "}
              {/* Conteneur pour positionner le form */}
              <SearchFormComponent isMobile={false} />
            </div>
          )}
        </div>

        {/* 5. Section droite avec icônes/boutons */}
        <div className="bg-[#18181b] h-full flex justify-end items-center px-4 space-x-4 z-30 ml-auto max-md:w-[80vw] md:ml-0 shrink-0">
          {/* Icônes/Boutons Bureau */}
          <div className="items-center hidden space-x-4 md:flex">
            <button className="hover:text-gray-200" onClick={toggleSearch}>
              {searchOpen ? (
                <XIcon className="w-6 h-6" />
              ) : (
                <SearchIcon className="w-6 h-6" />
              )}
            </button>
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/profile"
                  className="flex items-center space-x-2 hover:text-gray-200"
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
                  <LogoutIcon className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <a href="/login" className="hover:text-gray-200">
                  Connexion
                </a>
                <a
                  href="/register"
                  className="px-3 py-1 text-white bg-indigo-500 rounded hover:bg-indigo-600"
                >
                  Inscription
                </a>
              </div>
            )}
          </div>

          {/* Icônes Mobile */}
          <div className="flex items-center px-8 space-x-4 md:hidden">
            <button className="hover:text-gray-200" onClick={toggleSearch}>
              {searchOpen ? (
                <XIcon className="w-6 h-6" />
              ) : (
                <SearchIcon className="w-6 h-6" />
              )}
            </button>
            {isAuthenticated ? (
              <Link href="/profile" className="hover:text-gray-200">
                <UserCircleIcon className="h-7 w-7" />
              </Link>
            ) : (
              <a href="/login" className="hover:text-gray-200">
                <LoginIcon className="w-6 h-6" />
              </a>
            )}
            <button className="hover:text-gray-200" onClick={toggleMobileMenu}>
              {mobileMenuOpen ? (
                <XIcon className="w-6 h-6" />
              ) : (
                <MenuIcon className="w-6 h-6" />
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
          <div className="absolute top-0 left-0 right-0 p-4 bg-gray-800 border-t border-gray-700 shadow-lg">
            <SearchFormComponent isMobile={true} />
          </div>
        )}
        {/* Dropdown Menu Mobile */}
        {mobileMenuOpen && (
          <div className="absolute top-0 left-0 right-0 p-4 bg-gray-800 border-t border-gray-700 shadow-lg">
            <nav className="flex flex-col space-y-4 text-lg font-medium">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1 hover:text-gray-200"
              >
                Accueil
              </Link>
              <Link
                href="/#jeux"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1 hover:text-gray-200"
              >
                Jeux
              </Link>
              <a
                onClick={handleRandomGame}
                className="px-2 py-1 cursor-pointer hover:text-gray-200"
              >
                Jeu au hasard
              </a>
              {/* Liens spécifiques utilisateur si connecté */}
              {isAuthenticated && (
                <>
                  <hr className="my-2 border-gray-600" />
                  <a
                    href="/ma-liste"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center px-2 py-1 space-x-2 hover:text-gray-200"
                  >
                    <ClipboardListIcon className="w-6 h-6" />
                    <span>Ma liste</span>
                  </a>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center px-2 py-1 space-x-2 hover:text-gray-200"
                  >
                    <UserCircleIcon className="w-6 h-6" />
                    <span>Profil ({user?.username})</span>
                  </Link>
                  <button
                    onClick={() => {
                      if (logout) logout();
                      setMobileMenuOpen(false);
                      showMessage(
                        "Vous avez été déconnecté avec succès.", "success"
                      );
                    }}
                    className="flex items-center px-2 py-1 space-x-2 text-left text-red-400 hover:text-red-300"
                  >
                    <LogoutIcon className="w-6 h-6" />
                    <span>Déconnexion</span>
                  </button>
                </>
              )}
              {/* Liens Connexion/Inscription si non connecté */}
              {!isAuthenticated && (
                <>
                  <hr className="my-2 border-gray-600" />
                  <a
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-2 py-1 hover:text-gray-200"
                  >
                    Connexion
                  </a>
                  <a
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-1 mx-2 text-center text-white bg-indigo-500 rounded hover:bg-indigo-600"
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
