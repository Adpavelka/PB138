import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { API_BASE_URL, authHeaders } from "../lib/api";
import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";

// TODO: replace with real newspaper_id once a public lookup-by-name endpoint exists
const NEWSPAPER_ID = "550e8400-e29b-41d4-a716-446655440000";

type ArticleStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "IN_REVIEW"
  | "APPROVED_BY_EDITOR"
  | "APPROVED_BY_MANAGER"
  | "APPROVED_BY_DIRECTOR"
  | "PUBLISHED"
  | "REJECTED";

interface DashboardArticle {
  id: string;
  title: string;
  perex: string;
  category: string;
  status: ArticleStatus;
  created_at: string;
  updated_at: string;
  assigned_editor: { id: string; full_name: string } | null;
  latest_feedback: string | null;
}

interface DashboardResponse {
  data: DashboardArticle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

const STATUS_LABELS: Record<ArticleStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  IN_REVIEW: "In Review",
  APPROVED_BY_EDITOR: "Editor Approved",
  APPROVED_BY_MANAGER: "Manager Approved",
  APPROVED_BY_DIRECTOR: "Director Approved",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
};

const STATUS_STYLES: Record<ArticleStatus, string> = {
  DRAFT: "bg-muted border border-border text-muted-foreground",
  SUBMITTED: "bg-[#2563eb18] text-[#2563eb]",
  IN_REVIEW: "bg-[#ea580c18] text-[#ea580c]",
  APPROVED_BY_EDITOR: "bg-[#7c3aed18] text-[#7c3aed]",
  APPROVED_BY_MANAGER: "bg-[#7c3aed18] text-[#7c3aed]",
  APPROVED_BY_DIRECTOR: "bg-[#0891b218] text-[#0891b2]",
  PUBLISHED: "bg-[#16a34a18] text-[#16a34a]",
  REJECTED: "bg-[#dc262618] text-[#dc2626]",
};

const STATUS_DOT: Record<ArticleStatus, string> = {
  DRAFT: "bg-muted-foreground",
  SUBMITTED: "bg-[#2563eb]",
  IN_REVIEW: "bg-[#ea580c]",
  APPROVED_BY_EDITOR: "bg-[#7c3aed]",
  APPROVED_BY_MANAGER: "bg-[#7c3aed]",
  APPROVED_BY_DIRECTOR: "bg-[#0891b2]",
  PUBLISHED: "bg-[#16a34a]",
  REJECTED: "bg-[#dc2626]",
};

const FILTER_STATUSES: { label: string; value: ArticleStatus | null }[] = [
  { label: "All Articles", value: null },
  { label: "Drafts", value: "DRAFT" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "In Review", value: "IN_REVIEW" },
  { label: "Approved", value: "APPROVED_BY_EDITOR" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Rejected", value: "REJECTED" },
];

function PencilIcon() {
  return (
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
      className="text-muted-foreground"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
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
      <path d="M5 12h14M12 5v14" />
    </svg>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AuthorDashboardPage() {
  const { newspaperName } = useParams<{ newspaperName: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeStatus =
    (searchParams.get("status") as ArticleStatus | null) ?? null;
  const currentPage = Number(searchParams.get("page") ?? "1");

  const [articles, setArticles] = useState<DashboardArticle[]>([]);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(false);

    const params = new URLSearchParams();
    if (activeStatus) params.set("status", activeStatus);
    params.set("page", String(currentPage));
    params.set("limit", "20");

    fetch(
      `${API_BASE_URL}/api/newspapers/${NEWSPAPER_ID}/articles/mine?${params}`,
      { headers: authHeaders() }
    )
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json() as Promise<DashboardResponse>;
      })
      .then((data) => {
        setArticles(data.data);
        setPagination({
          total: data.pagination.total,
          total_pages: data.pagination.total_pages,
        });
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [activeStatus, currentPage]);

  function setStatus(status: ArticleStatus | null) {
    const next = new URLSearchParams();
    if (status) next.set("status", status);
    setSearchParams(next);
  }

  function setPage(page: number) {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(page));
    setSearchParams(next);
  }

  const activeNavLabel =
    FILTER_STATUSES.find((s) => s.value === activeStatus)?.label ??
    "All Articles";

  // Status filter section passed as children into the Sidebar
  const statusFilter = (
    <div className="flex flex-col gap-0.5">
      <p className="text-muted-foreground px-2 pt-2 pb-1 text-[11px] font-semibold tracking-wider uppercase">
        Filter by Status
      </p>
      {FILTER_STATUSES.map((item) => (
        <button
          key={String(item.value)}
          onClick={() => setStatus(item.value)}
          className={`flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-[13px] font-medium transition-colors ${
            activeStatus === item.value
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {item.value ? (
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[item.value]}`}
            />
          ) : (
            <span className="border-muted-foreground h-2 w-2 shrink-0 rounded-full border" />
          )}
          {item.label}
          {item.value === null &&
            pagination.total > 0 &&
            activeStatus === null && (
              <span className="bg-foreground text-background ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold">
                {pagination.total}
              </span>
            )}
        </button>
      ))}
    </div>
  );

  return (
    <div className="bg-background text-foreground flex min-h-screen w-full flex-col">
      <Navbar newspaperName={newspaperName ?? ""} />

      <div className="flex flex-1">
        <Sidebar>{statusFilter}</Sidebar>

        {/* Main Content */}
        <main className="flex flex-1 flex-col gap-7 px-12 py-8">
          {/* Page Title */}
          <div className="flex items-center justify-between">
            <h1 className="text-foreground text-[24px] font-bold">
              {activeNavLabel}
            </h1>
            <Link
              to={`/${newspaperName}/articles/new`}
              className="bg-foreground text-background flex items-center gap-2 rounded-md px-4 py-2 text-[13px] font-semibold transition-opacity hover:opacity-90"
            >
              <PlusIcon />
              New Article
            </Link>
          </div>

          {/* Article List */}
          {error ? (
            <p className="text-muted-foreground py-16 text-center">
              Failed to load articles. Please sign in and try again.
            </p>
          ) : loading ? (
            <p className="text-muted-foreground py-16 text-center">Loading…</p>
          ) : articles.length === 0 ? (
            <p className="text-muted-foreground py-16 text-center">
              {activeStatus
                ? `No articles with status "${STATUS_LABELS[activeStatus]}".`
                : "You haven't written any articles yet."}
            </p>
          ) : (
            <>
              <div className="flex flex-col">
                {articles.map((article, index) => {
                  const isFirst = index === 0;
                  const isLast = index === articles.length - 1;
                  const isDraft = article.status === "DRAFT";

                  return (
                    <div
                      key={article.id}
                      className={`border-border bg-card flex items-center gap-4 px-5 py-4 ${
                        isFirst
                          ? "rounded-t-lg border"
                          : "border-r border-b border-l"
                      } ${isLast ? "rounded-b-lg" : ""}`}
                    >
                      {/* Article Info */}
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-foreground text-[15px] leading-snug font-semibold">
                          {article.title}
                        </span>
                        <span className="text-muted-foreground line-clamp-2 text-[13px] leading-[1.4]">
                          {article.perex}
                        </span>
                        {article.latest_feedback && (
                          <span className="mt-1 text-[12px] leading-[1.4] text-[#dc2626]">
                            Feedback: {article.latest_feedback}
                          </span>
                        )}
                        {article.assigned_editor && (
                          <span className="text-muted-foreground text-[12px]">
                            Editor: {article.assigned_editor.full_name}
                          </span>
                        )}
                        <span className="text-muted-foreground/60 text-[11px]">
                          Updated {formatDate(article.updated_at)}
                        </span>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex shrink-0 items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-[12px] font-semibold ${STATUS_STYLES[article.status]}`}
                        >
                          {STATUS_LABELS[article.status]}
                        </span>
                        {isDraft && (
                          <Link
                            to={`/${newspaperName}/articles/${article.id}/edit`}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Edit article"
                          >
                            <PencilIcon />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[13px]">
                    Page {currentPage} of {pagination.total_pages} &mdash;{" "}
                    {pagination.total} article
                    {pagination.total !== 1 ? "s" : ""}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="border-border text-foreground hover:bg-muted rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(currentPage + 1)}
                      disabled={currentPage >= pagination.total_pages}
                      className="border-border text-foreground hover:bg-muted rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
