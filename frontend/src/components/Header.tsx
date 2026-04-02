"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { useAuth } from "@/providers/AuthProvider";
import { useFlashMessage } from "@/components/FlashMessage/FlashMessageProvider";
import { useTranslation } from "@/i18n/TranslationProvider";
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

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { showMessage } = useFlashMessage();
  const { t } = useTranslation();

  const toggleSearch = () => {
    const newState = !searchOpen;
    setSearchOpen(newState);
    if (newState) setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    const newState = !mobileMenuOpen;
    setMobileMenuOpen(newState);
    if (newState) setSearchOpen(false);
  };

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
    window.location.href = `/search?category=${encodeURIComponent(category)}&q=${encodeURIComponent(search)}`;
    setSearchOpen(false);
  }

  function handleRandomGame() {
    const currentGameId = window.location.pathname.split("/article/")[1] || null;
    const randomGameId = Math.floor(Math.random() * 120000) + 1;
    if (randomGameId === parseInt(currentGameId || "0")) {
      window.location.reload();
      return;
    }
    window.location.href = `/article/${randomGameId}`;
    setMobileMenuOpen(false);
  }

  const SearchFormComponent = ({ isMobile = false }: { isMobile?: boolean }) => (
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
        <option value="jeux">{t("search.categories.games")}</option>
        <option value="extensions">{t("search.categories.extensions")}</option>
        <option value="genre">{t("search.categories.genre")}</option>
        <option value="entreprise">{t("search.categories.company")}</option>
      </select>
      <input
        type="text"
        className={`bg-transparent text-white px-2 placeholder-gray-400 focus:outline-none z-40 ${
          isMobile
            ? "border-b border-gray-500/50 h-10 text-xl w-full"
            : "underline border-none text-3xl w-1/2"
        }`}
        placeholder={t("search.placeholder")}
        autoFocus={!isMobile}
        name="search"
      />
      <button
        type="submit"
        className={`bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded z-40 ${
          isMobile ? "w-full mt-2" : "shrink-0"
        }`}
        aria-label={t("common.search")}
      >
        <SearchIcon className="w-6 h-6 mx-auto" />
      </button>
    </form>
  );

  return (
    <>
      <header className="relative flex w-full h-16 overflow-hidden text-white bg-secondary">
        {/* Logo */}
        <div className="relative z-30 flex items-center h-full px-2 bg- shrink-0 bg-off-black">
          <Link href="/" aria-label={t("nav.homeAriaLabel")}>
            <Logo width={64} />
          </Link>
        </div>

        {/* Triangle gauche */}
        <div
          className="z-20 flex-shrink-0 w-8 h-full md:w-16 bg-off-black"
          style={{ clipPath: "polygon(0 0, 0 100%, 100% 100%)" }}
        />

        {/* Bande centrale Nav (Bureau) */}
        <div className="relative z-10 items-center justify-center flex-1 hidden h-full overflow-hidden bg-secondary md:flex">
          {!searchOpen && (
            <nav className="text-xl font-bold">
              <Link href="/" className="px-2 hover:text-gray-200">
                {t("nav.home")}
              </Link>
              <Link href="/#jeux" className="px-2 hover:text-gray-200">
                {t("nav.games")}
              </Link>
              <a
                onClick={handleRandomGame}
                className="px-2 cursor-pointer hover:text-gray-200"
              >
                {t("nav.randomGame")}
              </a>
            </nav>
          )}
        </div>

        {/* Triangle droit (Bureau) */}
        <div
          className={`h-full ${triangleRightWidth} z-20 flex-shrink-0 transition-all duration-300 relative hidden md:block`}
          style={{ clipPath: triangleRightClip, background: "#18181b" }}
        >
          {searchOpen && (
            <div className="hidden w-full h-full md:block">
              <SearchFormComponent isMobile={false} />
            </div>
          )}
        </div>

        {/* Section droite */}
        <div className="bg-[#18181b] h-full flex justify-end items-center px-4 space-x-4 z-30 ml-auto max-md:flex-1 md:ml-0 shrink-0">
          {/* Bureau */}
          <div className="items-center hidden space-x-4 md:flex">
            <button
              className="hover:text-gray-200"
              onClick={toggleSearch}
              aria-label={searchOpen ? t("nav.closeSearchAriaLabel") : t("nav.searchAriaLabel")}
            >
              {searchOpen ? <XIcon className="w-6 h-6" /> : <SearchIcon className="w-6 h-6" />}
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
                      title: t("auth.logoutTitle"),
                      description: t("auth.logoutSuccess"),
                      severity: "success",
                    });
                  }}
                  className="hover:text-red-400"
                  aria-label={t("nav.logout")}
                >
                  <LogoutIcon className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login" className="hover:text-gray-200">
                  {t("nav.login")}
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1 text-white bg-indigo-500 rounded hover:bg-indigo-600"
                >
                  {t("nav.register")}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile */}
          <div className="flex items-center pr-4 pl-2 space-x-3 md:hidden">
            <button
              className="hover:text-gray-200"
              onClick={toggleSearch}
              aria-label={searchOpen ? t("nav.closeSearchAriaLabel") : t("nav.searchAriaLabel")}
            >
              {searchOpen ? <XIcon className="w-6 h-6" /> : <SearchIcon className="w-6 h-6" />}
            </button>
            {isAuthenticated ? (
              <Link href="/profile" className="hover:text-gray-200" aria-label={t("nav.profile")}>
                <UserCircleIcon className="h-7 w-7" />
              </Link>
            ) : (
              <Link href="/login" className="hover:text-gray-200" aria-label={t("nav.login")}>
                <LoginIcon className="w-6 h-6" />
              </Link>
            )}
            <button
              className="hover:text-gray-200"
              onClick={toggleMobileMenu}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? t("nav.closeMenuAriaLabel") : t("nav.menuAriaLabel")}
            >
              {mobileMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile dropdowns */}
      <div className="relative z-40 md:hidden">
        {searchOpen && (
          <div className="absolute top-0 left-0 right-0 p-4 bg-off-black border-t border-gray-700 shadow-lg">
            <SearchFormComponent isMobile={true} />
          </div>
        )}
        {mobileMenuOpen && (
          <div className="absolute top-0 left-0 right-0 p-4 bg-off-black border-t border-gray-700 shadow-lg">
            <nav className="flex flex-col space-y-4 text-lg font-medium">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="px-2 py-1 hover:text-gray-200">
                {t("nav.home")}
              </Link>
              <Link href="/#jeux" onClick={() => setMobileMenuOpen(false)} className="px-2 py-1 hover:text-gray-200">
                {t("nav.games")}
              </Link>
              <a onClick={handleRandomGame} className="px-2 py-1 cursor-pointer hover:text-gray-200">
                {t("nav.randomGame")}
              </a>
              {isAuthenticated && (
                <>
                  <hr className="my-2 border-gray-600" />
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center px-2 py-1 space-x-2 hover:text-gray-200"
                  >
                    <ClipboardListIcon className="w-6 h-6" />
                    <span>{t("nav.myList")}</span>
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center px-2 py-1 space-x-2 hover:text-gray-200"
                  >
                    <UserCircleIcon className="w-6 h-6" />
                    <span>{t("nav.profile")} ({user?.username})</span>
                  </Link>
                  <button
                    onClick={() => {
                      if (logout) logout();
                      setMobileMenuOpen(false);
                      showMessage(t("auth.logoutSuccess"), "success");
                    }}
                    className="flex items-center px-2 py-1 space-x-2 text-left text-red-400 hover:text-red-300"
                  >
                    <LogoutIcon className="w-6 h-6" />
                    <span>{t("nav.logout")}</span>
                  </button>
                </>
              )}
              {!isAuthenticated && (
                <>
                  <hr className="my-2 border-gray-600" />
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="px-2 py-1 hover:text-gray-200">
                    {t("nav.login")}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-1 mx-2 text-center text-white bg-indigo-500 rounded hover:bg-indigo-600"
                  >
                    {t("nav.register")}
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </>
  );
}
