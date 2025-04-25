export default function FiltersSidebar() {
    return (
        <aside className="w-full lg:w-1/4">
        <div className="bg-off-gray p-4 rounded-lg text-white">
          <h2 className="text-xl font-semibold mb-4">Filters</h2>
          {/* Add filter sections here based on the image */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Genre</h3>
            {/* Genre checkboxes */}
          </div>
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Plateforme</h3>
            {/* Platform checkboxes */}
          </div>
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Jeu parent</h3>
            {/* Parent game input */}
          </div>
          <div>
            <h3 className="font-semibold mb-2">Date de sortie</h3>
            {/* Date range inputs */}
          </div>
        </div>
      </aside>
    )
}