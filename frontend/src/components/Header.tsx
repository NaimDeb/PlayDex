"use client";
import React from "react";
import { Logo } from "./Logo";
import { useAuth } from "@/providers/AuthProvider";

export function Header() {
  const { user, isAuthenticated } = useAuth();

  // Note: The exact percentages for left, right, and clip-path might need adjustment
  // to perfectly match the slanted background in the image.
  const purpleBackgroundStyle = {
    clipPath: 'polygon(5% 0, 95% 0, 100% 100%, 0% 100%)', // Adjust slant
  };

  function randomGame() {
    // Check the current URL to get the game ID or null
    const currentGameId = window.location.pathname.split("/article/")[1] || null;

    // Generate a random number between 1 and 120000
    const randomGameId = Math.floor(Math.random() * 120000) + 1;
    // If the random game ID is the same as the current one, generate a new one
    if (randomGameId === parseInt(currentGameId || "0")) {
      randomGame();
      return;
    }
    // Navigate to the random game page
    window.location.href = `/article/${randomGameId}`;
  }

  return (
    // Use a base dark background and relative positioning
    <header className="bg-off-gray text-white shadow-md relative h-16">
      <div className="container mx-auto h-full flex items-center justify-between px-4 relative">

        {/* Purple Background Shape - Positioned absolutely behind content */}
        <div
          className="absolute inset-y-0 left-[15%] right-[25%] bg-indigo-500 z-0" // Adjust left/right positioning
          style={purpleBackgroundStyle}
        ></div>

        {/* Logo (Left) - Positioned above background */}
        <div className="flex items-center z-10">
          <Logo />
          <span className="text-lg font-bold ml-2">PLAYDEX</span>
        </div>

        {/* Navigation Links - Centered using absolute positioning */}
        <nav className="absolute inset-y-0 left-0 right-0 flex justify-center items-center space-x-12 text-lg font-medium z-10">
          <a href="#accueil" className="hover:text-gray-200 px-2">
            Accueil
          </a>
          <a href="#jeux" className="hover:text-gray-200 px-2">
            Jeux
          </a>
          <a href="#home" className="hover:text-gray-200 px-2">
            Home
          </a>
          <a onClick={randomGame} className="hover:text-gray-200 px-2">
            Jeu au hasard
          </a>
        </nav>

        {/* Right side controls - Positioned above background */}
        <div className="flex items-center space-x-6 z-10">
          {/* Search Button */}
          <button className="hover:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* User Profile / Login */}
          {isAuthenticated ? (
            <div className="flex items-center space-x-6">
              {/* Ma Liste - Updated Icon */}
              <div className="flex items-center space-x-2 cursor-pointer hover:text-gray-200">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    {/* Rounded square */}
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6z" />
                    {/* Checkmark */}
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 11.25l3 3 6-6" />
                    {/* Lines */}
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5h-7.5" />
                 </svg>
                <span>Ma liste</span>
              </div>
              {/* Profile Icon - Updated Icon */}
              <button className="hover:text-gray-200 flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <span className="text-lg font-bold">{user?.username}</span>
                
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <a href="/login" className="hover:text-gray-200">
                Connexion
              </a>
              <a
                href="/register"
                className="bg-indigo-500 hover:bg-indigo-600 text-white py-1 px-3 rounded" // Updated style
              >
                Inscription
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}