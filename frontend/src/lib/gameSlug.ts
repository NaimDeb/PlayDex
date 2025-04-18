export function getIdFromSlug(slug: string): string {
  // Split the slug by hyphens and take the last part
  const parts = slug.split("-");
  const id = parts[parts.length - 1];

  // Check if the ID is a valid number
  if (isNaN(Number(id))) {
    throw new Error("Invalid ID in slug");
  }

  return id;
}