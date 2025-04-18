interface Update {
  importance?: string;
  title: string;
}

export function PatchnoteCard({ update }: { update: Update }) {
  return (
    <div>
      <h3 className="ml-2 text-lg font-semibold mb-2 capitalize">
        {update.importance} update
      </h3>{" "}
      {/* Simple type display */}
      <div className="bg-[#2a2a2a] p-4 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-bold">{update.title}</h4>
          {/* Add Modifier/Like/Dislike buttons here */}
          <div className="flex gap-2 items-center">
            <button className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded">
              Modifier
            </button>
            {/* Placeholder icons */}
            <span className="text-gray-400 cursor-pointer">👍</span>
            <span className="text-gray-400 cursor-pointer">👎</span>
          </div>
        </div>
        <p className="text-gray-300 text-sm mb-3 whitespace-pre-line">
          {update.title}
        </p>
        <button className="text-purple-400 hover:text-purple-300 text-sm">
          Voir plus
        </button>
      </div>
    </div>
  );
}
