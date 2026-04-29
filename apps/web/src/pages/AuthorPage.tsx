import { useEffect, useState } from "react";
import { UserIcon } from "../components/Icons";
import { Link, useParams } from "react-router-dom";
import { API_BASE_URL } from "../lib/api";
import type { AuthorPublicProfile, Article } from "../types";
import { CategoryBadge } from "../components/CategoryBadge";
import { ArticleCard } from "../components/ArticleCard";
import { Navbar } from "../components/Navbar";
import { useNewspaper } from "../hooks/useNewspaper";

type SortOrder = "latest" | "oldest";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

function sortArticles(
  articles: Article[] | undefined,
  order: SortOrder
): Article[] {
  if (!articles) return [];
  return [...articles].sort((a, b) => {
    const diff =
      new Date(a.publication_date).getTime() -
      new Date(b.publication_date).getTime();
    return order === "latest" ? -diff : diff;
  });
}

export function AuthorPage() {
  const { authorId } = useParams<{ authorId: string }>();
  const { newspaperName, newspaper } = useNewspaper();

  const [author, setAuthor] = useState<AuthorPublicProfile | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("latest");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!newspaper || !authorId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAuthor(null);
    setError(false);
    setSortOrder("latest");

    fetch(`${API_BASE_URL}/api/newspapers/${newspaper.id}/authors/${authorId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json() as Promise<AuthorPublicProfile>;
      })
      .then((data) => setAuthor(data))
      .catch(() => setError(true));
  }, [newspaper, authorId]);

  const sorted = sortArticles(author?.articles.data, sortOrder);
  const [featured, ...rest] = sorted;

  if (error) {
    return (
      <div className="bg-background text-foreground min-h-screen w-full">
        <Navbar newspaperName={newspaperName} />
        <p className="text-muted-foreground py-16 text-center">
          Author not found.
        </p>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="bg-background text-foreground min-h-screen w-full">
        <Navbar newspaperName={newspaperName} />
        <p className="text-muted-foreground py-16 text-center">Loading…</p>
      </div>
    );
  }

  const articleCount = author.articles.pagination.total;

  return (
    <div className="bg-background text-foreground min-h-screen w-full">
      <Navbar newspaperName={newspaperName} />

      {/* Author Hero */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-950" />
        <div className="absolute inset-0 bg-black/67" />
        <div className="relative flex items-center gap-10 px-16 py-12">
          {author.profile_picture ? (
            <img
              src={author.profile_picture}
              alt={author.full_name}
              className="h-24 w-24 shrink-0 rounded-full object-cover ring-2 ring-white/20"
            />
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/20">
              <UserIcon size={40} className="text-white/60" />
            </div>
          )}

          {/* Info */}
          <div className="flex flex-1 flex-col gap-3">
            {/* Breadcrumb */}
            <p className="text-[13px] text-white/80">
              <Link
                to={`/${newspaperName}`}
                className="transition-colors hover:text-white"
              >
                Home
              </Link>
              {" › "}
              <span>Authors</span>
            </p>

            <div className="flex items-start justify-between gap-8">
              <div className="flex flex-col gap-2">
                <h1 className="text-[32px] leading-none font-extrabold tracking-[-0.5px] text-white">
                  {author.full_name}
                </h1>
                <p className="max-w-[600px] text-[14px] leading-[1.6] text-white/70">
                  {author.bio}
                </p>
              </div>

              {/* Stats */}
              <div className="flex shrink-0 items-center gap-8 self-center pr-4">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[28px] font-extrabold text-white">
                    {formatCount(articleCount)}
                  </span>
                  <span className="text-[12px] text-white/60">Articles</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-12 px-16 py-12">
        {/* Featured Article */}
        {featured && (
          <Link
            to={`/${newspaperName}/articles/${featured.id}`}
            className="block"
          >
            <div className="border-border bg-card flex overflow-hidden rounded-lg border shadow-sm">
              <div className="h-[360px] w-[560px] shrink-0 overflow-hidden rounded-tl-lg rounded-bl-lg">
                {featured.primary_image ? (
                  <img
                    src={featured.primary_image.url}
                    alt={featured.primary_image.caption}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="bg-muted h-full w-full" />
                )}
              </div>
              <div className="flex flex-1 flex-col justify-center gap-3 px-8 py-6">
                <div className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase">
                    Featured
                  </span>
                  <CategoryBadge label={featured.category} />
                </div>
                <h2 className="text-card-foreground text-[28px] leading-[1.2] font-extrabold tracking-[-0.5px]">
                  {featured.title}
                </h2>
                <p className="text-muted-foreground line-clamp-3 text-[15px] leading-[1.6]">
                  {featured.perex}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  {featured.author?.profile_picture ? (
                    <img
                      src={featured.author.profile_picture}
                      alt={featured.author.full_name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
                      <UserIcon size={16} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-card-foreground text-[13px] font-semibold">
                      {featured.author?.full_name}
                    </span>
                    <span className="text-muted-foreground text-[12px]">
                      {formatDate(featured.publication_date)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Filter Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-[14px] font-medium">
              Sort by:
            </span>
            <button
              onClick={() => setSortOrder("latest")}
              className={`rounded-full px-[14px] py-1.5 text-[13px] font-medium transition-colors ${
                sortOrder === "latest"
                  ? "bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground border"
              }`}
            >
              Latest
            </button>
            <button
              onClick={() => setSortOrder("oldest")}
              className={`rounded-full px-[14px] py-1.5 text-[13px] font-medium transition-colors ${
                sortOrder === "oldest"
                  ? "bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground border"
              }`}
            >
              Oldest
            </button>
          </div>
          <span className="text-muted-foreground text-[13px]">
            {articleCount} article{articleCount !== 1 ? "s" : ""} total
          </span>
        </div>

        {/* Article Grid */}
        {rest.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          !featured && (
            <p className="text-muted-foreground py-16 text-center">
              No published articles found for this author.
            </p>
          )
        )}
      </div>
    </div>
  );
}
