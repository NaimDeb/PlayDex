type UpdatesBadgeProps = {
  count: number;
};

export function UpdatesBadge({ count }: UpdatesBadgeProps) {
  if (!count || count <= 0) return null;

  return (
    <span className="px-3 py-1 text-xs font-bold text-black bg-yellow-400 rounded-full shadow-md whitespace-nowrap">
      {count > 99 ? "99+" : count} updates
    </span>
  );
}
