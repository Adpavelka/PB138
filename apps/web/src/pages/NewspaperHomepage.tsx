import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../lib/api";
import { sampleArticles } from "../lib/sampleData";
import type { Article, ArticlesResponse } from "../types/article";
import { ArticleCard } from "../components/ArticleCard";
import { CategoryBadge } from "../components/CategoryBadge";
import { Navbar } from "../components/Navbar";
import { useNewspaper } from "../hooks/useNewspaper";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function NewspaperHomepage() {
  const { newspaperName, newspaper } = useNewspaper();
  const [articles, setArticles] = useState<Article[]>(sampleArticles.data);

  useEffect(() => {
    if (!newspaper) return;
    fetch(`${API_BASE_URL}/api/newspapers/${newspaper.id}/articles`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json() as Promise<ArticlesResponse>;
      })
      .then((data) => setArticles(data.data))
      .catch(() => {});
  }, [newspaper]);

  const [featured, ...rest] = articles;

  return (
    <div className="bg-background text-foreground min-h-screen w-full">
      <Navbar
        newspaperName={newspaperName ?? ""}
        displayName={newspaper?.name}
      />

      {/* Hero Section */}
      {featured && (
        <section className="bg-background flex px-12">
          <div className="h-[500px] flex-1 overflow-hidden">
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
          <div className="flex w-[540px] shrink-0 flex-col justify-center gap-5 px-10 py-12">
            <CategoryBadge label="Featured" />
            <h1 className="text-foreground text-[32px] leading-[1.15] font-extrabold tracking-[-0.5px]">
              {featured.title}
            </h1>
            <Link
              to={`/${newspaperName}/authors/${featured.author.id}`}
              className="flex items-center gap-3"
            >
              {featured.author.profile_picture ? (
                <img
                  src={featured.author.profile_picture}
                  alt={featured.author.full_name}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="bg-muted h-9 w-9 rounded-full" />
              )}
              <div className="flex flex-col gap-0.5">
                <span className="text-foreground text-[14px] font-semibold">
                  {featured.author.full_name}
                </span>
                <span className="text-muted-foreground text-[13px]">
                  {formatDate(featured.publication_date)}
                </span>
              </div>
            </Link>
            <p className="text-muted-foreground text-[15px] leading-[1.6]">
              {featured.perex}
            </p>
            <Link
              to={`/${newspaperName}/articles/${featured.id}`}
              className="bg-foreground text-background flex w-fit items-center gap-2 rounded-lg px-5 py-2.5 text-[14px] font-semibold hover:opacity-90"
            >
              Read Full Article
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      )}

      {/* Latest News */}
      <section className="bg-background flex flex-col gap-8 px-12 py-12">
        <h2 className="text-foreground text-[28px] font-extrabold tracking-[-0.5px]">
          Latest News
        </h2>
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {rest.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </section>
    </div>
  );
}
