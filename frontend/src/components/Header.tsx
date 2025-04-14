import React from "react";
import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="bg-off-gray text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Logo/>
          <span className="text-lg font-bold">PLAYDEX</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex space-x-6">
          <a href="#accueil" className="hover:text-gray-300">
            Accueil
          </a>
          <a href="#jeux" className="hover:text-gray-300">
            Jeux
          </a>
          <a href="#home" className="hover:text-gray-300">
            Home
          </a>
          <a href="#ma-liste" className="hover:text-gray-300">
            Ma liste
          </a>
        </nav>

        {/* Icons */}
        <div className="flex items-center space-x-4">
          <button className="hover:text-gray-300">
            <i className="fas fa-search"></i>
          </button>
          <button className="hover:text-gray-300">
            <i className="fas fa-list"></i>
          </button>
          <button className="hover:text-gray-300">
            <i className="fas fa-user"></i>
          </button>
        </div>
      </div>
    </header>
  );
}