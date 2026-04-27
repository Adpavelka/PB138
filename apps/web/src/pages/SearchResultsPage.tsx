import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../lib/api";
import type { Article, PaginatedResponse } from "../types";
import { ArticleCard } from "../components/ArticleCard";
import { Navbar } from "../components/Navbar";
import { useNewspaper } from "../hooks/useNewspaper";

export function SearchResultsPage() {
  const { newspaperName, newspaper } = useNewspaper();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialQuery = searchParams.get("q") ?? "";
  const [inputValue, setInputValue] = useState(initialQuery);
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInputValue(q);

    if (!q.trim() || !newspaper) {
      setArticles([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    setError(false);

    fetch(
      `${API_BASE_URL}/api/newspapers/${newspaper.id}/articles/search?q=${encodeURIComponent(q)}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json() as Promise<PaginatedResponse<Article>>;
      })
      .then((data) => {
        setArticles(data.data);
        setTotal(data.pagination.total);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [searchParams, newspaper]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (inputValue.trim()) {
      navigate(
        `/${newspaperName}/search?q=${encodeURIComponent(inputValue.trim())}`
      );
    }
  }

  const query = searchParams.get("q") ?? "";

  return (
    <div className="bg-background text-foreground min-h-screen w-full">
      <Navbar newspaperName={newspaperName ?? ""} />

      <div className="flex flex-col gap-6 px-16 py-12">
        {/* Search Section */}
        <div className="flex flex-col gap-4">
          <h1 className="text-foreground text-[32px] font-extrabold tracking-[-0.5px]">
            Search Results
          </h1>
          <form onSubmit={handleSearch}>
            <div className="border-border bg-card flex h-12 w-full items-center gap-2.5 rounded-lg border px-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground shrink-0"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search articles..."
                className="text-foreground placeholder:text-muted-foreground flex-1 bg-transparent text-[15px] outline-none"
              />
            </div>
          </form>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between">
          {query ? (
            <span className="text-foreground text-[15px] font-semibold">
              {loading
                ? "Searching…"
                : `${total} Result${total !== 1 ? "s" : ""}`}
            </span>
          ) : (
            <span className="text-foreground text-[15px] font-semibold">
              Enter a search term above
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="bg-border h-px w-full" />

        {/* Results Grid */}
        {error ? (
          <p className="text-muted-foreground py-16 text-center">
            Something went wrong. Please try again.
          </p>
        ) : loading ? (
          <p className="text-muted-foreground py-16 text-center">Loading…</p>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : query ? (
          <p className="text-muted-foreground py-16 text-center">
            No results found for <strong>"{query}"</strong>.
          </p>
        ) : null}
      </div>
    </div>
  );
}
