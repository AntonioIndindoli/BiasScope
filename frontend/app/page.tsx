"use client";

import { useEffect, useMemo, useState } from "react";

type Article = {
  id: number;
  title: string;
  url: string;
  source: string;
  summary: string | null;
  publishedAt: string;
};

type ArticlesResponse = {
  items: Article[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
  };
};

const PAGE_SIZE = 10;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

function formatPublishedDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [offset, setOffset] = useState(0);
  const [pagination, setPagination] = useState<ArticlesResponse["pagination"]>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadArticles() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/articles?limit=${PAGE_SIZE}&offset=${offset}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data: ArticlesResponse = await response.json();

        if (!active) return;

        setArticles(Array.isArray(data.items) ? data.items : []);
        setPagination(data.pagination);
      } catch (err) {
        if (!active) return;

        setError(err instanceof Error ? err.message : "Failed to load articles");
        setArticles([]);
        setPagination(undefined);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadArticles();

    return () => {
      active = false;
    };
  }, [offset]);

  const currentPage = useMemo(() => Math.floor(offset / PAGE_SIZE) + 1, [offset]);
  const totalPages = useMemo(() => {
    if (!pagination) return null;
    return Math.max(1, Math.ceil(pagination.total / pagination.limit));
  }, [pagination]);

  const canGoPrev = offset > 0;
  const canGoNext = pagination
    ? offset + pagination.limit < pagination.total
    : articles.length === PAGE_SIZE;

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-semibold">Latest Articles</h1>

      {loading ? (
        <p className="rounded-md border border-zinc-300 p-4">Loading articles…</p>
      ) : null}

      {!loading && error ? (
        <p className="rounded-md border border-red-300 bg-red-50 p-4 text-red-700">
          Could not load articles: {error}
        </p>
      ) : null}

      {!loading && !error && articles.length === 0 ? (
        <p className="rounded-md border border-zinc-300 p-4">No articles found.</p>
      ) : null}

      {!loading && !error && articles.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                  <th className="px-4 py-3 font-semibold">Published date</th>
                  <th className="px-4 py-3 font-semibold">Summary preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {articles.map((article) => (
                  <tr key={article.id}>
                    <td className="px-4 py-3">
                      <a
                        className="text-blue-700 underline-offset-2 hover:underline"
                        href={article.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {article.title}
                      </a>
                    </td>
                    <td className="px-4 py-3">{article.source}</td>
                    <td className="px-4 py-3">{formatPublishedDate(article.publishedAt)}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {article.summary ? article.summary : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              className="rounded-md border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
              disabled={!canGoPrev}
            >
              Previous
            </button>

            <p className="text-sm text-zinc-600">
              Page {currentPage}
              {totalPages ? ` of ${totalPages}` : ""}
            </p>

            <button
              className="rounded-md border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
              disabled={!canGoNext}
            >
              Next
            </button>
          </div>
        </>
      ) : null}
    </main>
  );
}
