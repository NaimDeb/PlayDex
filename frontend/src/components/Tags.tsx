export function Tags({ tags }: { tags: string[] }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {tags.map((tag) => (
        <span
          key={tag}
          className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}