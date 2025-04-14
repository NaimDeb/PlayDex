import { Logo } from './Logo'; // Assuming you have a Logo component or will create one
import "../app/globals.css";

export function Footer() {
  return (
    <footer className="bg-off-gray text-off-white">
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <Logo />
            <span className="text-sm">
            A propos - Termes de confidentialité — Conditions d utilisation - Règles de la communauté
          </span>
        </div>

        {/* Right Section */}
        <div className="text-center md:text-right mt-4 md:mt-0">
          <p className="text-sm">
            © 2025 PlayDex &nbsp; | &nbsp; Powered by IGDB and Steamworks
          </p>
          <div className="flex justify-center md:justify-end space-x-2 mt-2">
            <span className="w-3 h-3 bg-white rounded-full"></span>
            <span className="w-3 h-3 bg-white rounded-full"></span>
            <span className="w-3 h-3 bg-white rounded-full"></span>
            <span className="w-3 h-3 bg-white rounded-full"></span>
            <span className="w-3 h-3 bg-white rounded-full"></span>
          </div>
        </div>
      </div>
    </footer>
  );
}