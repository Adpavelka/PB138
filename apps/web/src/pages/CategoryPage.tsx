import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../lib/api";
import type { Article, ArticlesResponse } from "../types/article";
import { CategoryBadge } from "../components/CategoryBadge";
import { ArticleCard } from "../components/ArticleCard";
import { Navbar } from "../components/Navbar";
import { useNewspaper } from "../hooks/useNewspaper";
import { useCategory } from "../hooks/useCategory";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type SortOrder = "latest" | "oldest";

function sortArticles(articles: Article[], order: SortOrder): Article[] {
  return [...articles].sort((a, b) => {
    const diff =
      new Date(a.publication_date).getTime() -
      new Date(b.publication_date).getTime();
    return order === "latest" ? -diff : diff;
  });
}

export function CategoryPage() {
  const { newspaper, newspaperName } = useNewspaper();
  const { categorySlug, category } = useCategory(newspaper?.id);

  const [articles, setArticles] = useState<Article[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>("latest");

  useEffect(() => {
    if (!newspaper || !category) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setArticles([]);
    fetch(
      `${API_BASE_URL}/api/newspapers/${newspaper.id}/articles?category_id=${category.id}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json() as Promise<ArticlesResponse>;
      })
      .then((data) => setArticles(data.data))
      .catch(() => {});
  }, [newspaper, category]);

  const sorted = sortArticles(articles, sortOrder);
  const [featured, ...rest] = sorted;

  return (
    <div className="bg-background text-foreground min-h-screen w-full">
      <Navbar newspaperName={newspaperName} />

      {/* Category Hero */}
      <div className="relative h-[280px] w-full overflow-hidden">
        {/* Background — generic gradient fallback looks intentional for every category */}
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-950" />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/67" />
        {/* Centered content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-12 text-center">
          {/* Breadcrumb */}
          <p className="text-[13px] text-white/80">
            <Link
              to={`/${newspaperName}`}
              className="transition-colors hover:text-white"
            >
              Home
            </Link>
            {" › "}
            <span>{category?.name ?? categorySlug}</span>
          </p>
          {/* Category title */}
          <h1 className="text-[48px] leading-none font-black tracking-[-1px] text-white">
            {category?.name ?? categorySlug}
          </h1>
          {/* Article count badge */}
          <span className="rounded-full border border-white/20 bg-white/[0.13] px-4 py-1.5 text-[13px] font-medium text-white">
            {articles.length} Article{articles.length !== 1 ? "s" : ""}
          </span>
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
              {/* Image */}
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
              {/* Content */}
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
                  {featured.author.profile_picture ? (
                    <img
                      src={featured.author.profile_picture}
                      alt={featured.author.full_name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="bg-muted h-8 w-8 rounded-full" />
                  )}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-card-foreground text-[13px] font-semibold">
                      {featured.author.full_name}
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
            Showing {rest.length > 0 ? `1–${rest.length + 1}` : "0"} of{" "}
            {articles.length} article{articles.length !== 1 ? "s" : ""}
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
              No articles found in the{" "}
              <strong>{category?.name ?? categorySlug}</strong> category.
            </p>
          )
        )}
      </div>
    </div>
  );
}
