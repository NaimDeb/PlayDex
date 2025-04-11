export default function ArticlePage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-montserrat font-bold">Article {params.id}</h1>
    </div>
  );
}