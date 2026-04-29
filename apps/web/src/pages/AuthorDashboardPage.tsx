import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { API_BASE_URL, authHeaders } from "../lib/api";
import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { useNewspaper } from "../hooks/useNewspaper";
import type {
  ArticleStatus,
  Category,
  PaginatedResponse,
  ReviewDecision,
} from "../types";
import { PencilIcon, PlusIcon, TrashIcon } from "../components/Icons";
import type {
  DashboardArticle,
  NewspaperEntry,
  QueueArticle,
  Statistics,
  UserEntry,
} from "../types/dashboard";

/* ── Constants ─────────────────────────────────────────────────────────────── */

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

const MY_ARTICLE_FILTERS: { label: string; value: ArticleStatus | null }[] = [
  { label: "All Articles", value: null },
  { label: "Drafts", value: "DRAFT" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "In Review", value: "IN_REVIEW" },
  { label: "Approved", value: "APPROVED_BY_EDITOR" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Rejected", value: "REJECTED" },
];

const EDITORIAL_ROLES = ["AUTHOR", "EDITOR", "NEWSPAPER_MANAGER", "DIRECTOR"];

/* ── Utility ───────────────────────────────────────────────────────────────── */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function deriveDefaultSection(roles: string[]): string {
  if (roles.includes("AUTHOR")) return "my-articles";
  if (roles.includes("EDITOR")) return "review-queue";
  if (roles.includes("NEWSPAPER_MANAGER")) return "editorial-queue";
  if (roles.includes("DIRECTOR")) return "director-queue";
  return "my-articles";
}

/* ── Shared components ─────────────────────────────────────────────────────── */

function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-foreground text-[24px] font-bold">{title}</h1>
      {action}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-muted-foreground py-16 text-center">{message}</p>;
}

function LoadingState() {
  return <p className="text-muted-foreground py-16 text-center">Loading…</p>;
}

function ErrorState({
  message = "Something went wrong. Please try again.",
}: {
  message?: string;
}) {
  return <p className="text-muted-foreground py-16 text-center">{message}</p>;
}

function Pagination({
  currentPage,
  totalPages,
  total,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground text-[13px]">
        Page {currentPage} of {totalPages} — {total} item
        {total !== 1 ? "s" : ""}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="border-border text-foreground hover:bg-muted rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-40"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="border-border text-foreground hover:bg-muted rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

/* ── ArticleList rows ──────────────────────────────────────────────────────── */

function ArticleListRow({
  index,
  total,
  children,
}: {
  index: number;
  total: number;
  children: React.ReactNode;
}) {
  const isFirst = index === 0;
  const isLast = index === total - 1;
  return (
    <div
      className={`border-border bg-card px-5 py-4 ${
        isFirst ? "rounded-t-lg border" : "border-r border-b border-l"
      } ${isLast ? "rounded-b-lg" : ""}`}
    >
      {children}
    </div>
  );
}

/* ── DecisionForm — inline review / approve form ───────────────────────────── */

function DecisionForm({
  onSubmit,
  onCancel,
  submitting,
  requireNoteFor = ["REJECT", "REQUEST_REVISION"],
}: {
  onSubmit: (decision: ReviewDecision, note: string) => void;
  onCancel: () => void;
  submitting: boolean;
  requireNoteFor?: ReviewDecision[];
}) {
  const [decision, setDecision] = useState<ReviewDecision>("APPROVE");
  const [note, setNote] = useState("");

  const noteRequired = requireNoteFor.includes(decision);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (noteRequired && !note.trim()) return;
    onSubmit(decision, note);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-border bg-muted/30 mt-3 flex flex-col gap-3 rounded-lg border p-4"
    >
      <div className="flex gap-2">
        {(["APPROVE", "REJECT", "REQUEST_REVISION"] as ReviewDecision[]).map(
          (d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDecision(d)}
              className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                decision === d
                  ? d === "APPROVE"
                    ? "bg-[#16a34a] text-white"
                    : d === "REJECT"
                      ? "bg-[#dc2626] text-white"
                      : "bg-[#ea580c] text-white"
                  : "border-border bg-background text-muted-foreground hover:bg-muted border"
              }`}
            >
              {d === "REQUEST_REVISION"
                ? "Request Revision"
                : d.charAt(0) + d.slice(1).toLowerCase()}
            </button>
          )
        )}
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={
          noteRequired
            ? "Note is required for this decision…"
            : "Optional note for the author…"
        }
        required={noteRequired}
        rows={3}
        className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-md border px-3 py-2 text-[13px] outline-none focus:ring-2"
      />

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="border-border text-muted-foreground hover:bg-muted rounded-md border px-3 py-1.5 text-[13px] font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || (noteRequired && !note.trim())}
          className="bg-foreground text-background rounded-md px-3 py-1.5 text-[13px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit"}
        </button>
      </div>
    </form>
  );
}

/* ── MyArticlesSection ─────────────────────────────────────────────────────── */

function MyArticlesSection({
  newspaperId,
  newspaperName,
}: {
  newspaperId: string;
  newspaperName: string;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeStatus =
    (searchParams.get("status") as ArticleStatus | null) ?? null;
  const currentPage = Number(searchParams.get("page") ?? "1");

  const [articles, setArticles] = useState<DashboardArticle[]>([]);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!newspaperId) return;
    async function doFetch() {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams();
        if (activeStatus) params.set("status", activeStatus);
        params.set("page", String(currentPage));
        params.set("limit", "20");
        const res = await fetch(
          `${API_BASE_URL}/api/newspapers/${newspaperId}/articles/mine?${params}`,
          { headers: authHeaders() }
        );
        if (!res.ok) throw new Error();
        const data = (await res.json()) as PaginatedResponse<DashboardArticle>;
        setArticles(data.data);
        setPagination({
          total: data.pagination.total,
          total_pages: data.pagination.total_pages,
        });
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    doFetch();
  }, [newspaperId, activeStatus, currentPage]);

  function setStatus(status: ArticleStatus | null) {
    const next = new URLSearchParams();
    next.set("section", "my-articles");
    if (status) next.set("status", status);
    setSearchParams(next);
  }

  function setPage(page: number) {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(page));
    setSearchParams(next);
  }

  const activeLabel =
    MY_ARTICLE_FILTERS.find((s) => s.value === activeStatus)?.label ??
    "All Articles";

  return (
    <div className="flex flex-col gap-7">
      <SectionTitle
        title={activeLabel}
        action={
          <Link
            to={`/${newspaperName}/articles/new`}
            className="bg-foreground text-background flex items-center gap-2 rounded-md px-4 py-2 text-[13px] font-semibold transition-opacity hover:opacity-90"
          >
            <PlusIcon />
            New Article
          </Link>
        }
      />

      {error ? (
        <ErrorState message="Failed to load articles. Please sign in and try again." />
      ) : loading ? (
        <LoadingState />
      ) : articles.length === 0 ? (
        <EmptyState
          message={
            activeStatus
              ? `No articles with status "${STATUS_LABELS[activeStatus]}".`
              : "You haven't written any articles yet."
          }
        />
      ) : (
        <>
          <div className="flex flex-col">
            {articles.map((article, index) => (
              <ArticleListRow
                key={article.id}
                index={index}
                total={articles.length}
              >
                <div className="flex items-center gap-4">
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
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-[12px] font-semibold ${STATUS_STYLES[article.status]}`}
                    >
                      {STATUS_LABELS[article.status]}
                    </span>
                    {article.status === "DRAFT" && (
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
              </ArticleListRow>
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.total_pages}
            total={pagination.total}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Status filter injected into sidebar via parent — rendered here as secondary filter bar for context */}
      <div className="hidden">
        {MY_ARTICLE_FILTERS.map((item) => (
          <button
            key={String(item.value)}
            onClick={() => setStatus(item.value)}
          />
        ))}
      </div>
    </div>
  );
}

/* ── ReviewQueueSection (EDITOR) ───────────────────────────────────────────── */

function ReviewQueueSection({ newspaperId }: { newspaperId: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Number(searchParams.get("page") ?? "1");

  const [articles, setArticles] = useState<QueueArticle[]>([]);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!newspaperId) return;
    await null;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: "20",
        view: "EDITOR",
      });
      const res = await fetch(
        `${API_BASE_URL}/api/newspapers/${newspaperId}/articles/queue?${params}`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error();
      const data = (await res.json()) as PaginatedResponse<QueueArticle>;
      setArticles(data.data);
      setPagination({
        total: data.pagination.total,
        total_pages: data.pagination.total_pages,
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [newspaperId, currentPage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleReview(
    articleId: string,
    decision: ReviewDecision,
    note: string
  ) {
    setSubmitting(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/newspapers/${newspaperId}/articles/${articleId}/review`,
        {
          method: "POST",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ decision, note: note || undefined }),
        }
      );
      if (!res.ok) throw new Error();
      setActiveId(null);
      load();
    } catch {
      alert("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <SectionTitle title="Review Queue" />

      {error ? (
        <ErrorState />
      ) : loading ? (
        <LoadingState />
      ) : articles.length === 0 ? (
        <EmptyState message="No articles awaiting your review." />
      ) : (
        <>
          <div className="flex flex-col">
            {articles.map((article, index) => (
              <ArticleListRow
                key={article.id}
                index={index}
                total={articles.length}
              >
                <div className="flex items-start gap-4">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-foreground text-[15px] leading-snug font-semibold">
                      {article.title}
                    </span>
                    <span className="text-muted-foreground line-clamp-2 text-[13px] leading-[1.4]">
                      {article.perex}
                    </span>
                    <div className="text-muted-foreground flex flex-wrap gap-3 text-[12px]">
                      <span>Author: {article.author.full_name}</span>
                      <span>Category: {article.category}</span>
                      <span>Submitted: {formatDate(article.submitted_at)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-[12px] font-semibold ${STATUS_STYLES[article.status]}`}
                    >
                      {STATUS_LABELS[article.status]}
                    </span>
                    <button
                      onClick={() =>
                        setActiveId(activeId === article.id ? null : article.id)
                      }
                      className="border-border text-foreground hover:bg-muted rounded-md border px-3 py-1.5 text-[12px] font-semibold transition-colors"
                    >
                      Review
                    </button>
                  </div>
                </div>
                {activeId === article.id && (
                  <DecisionForm
                    onSubmit={(d, n) => handleReview(article.id, d, n)}
                    onCancel={() => setActiveId(null)}
                    submitting={submitting}
                  />
                )}
              </ArticleListRow>
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.total_pages}
            total={pagination.total}
            onPageChange={(p) => {
              const next = new URLSearchParams(searchParams);
              next.set("page", String(p));
              setSearchParams(next);
            }}
          />
        </>
      )}
    </div>
  );
}

/* ── EditorialQueueSection (NEWSPAPER_MANAGER) ─────────────────────────────── */

function EditorialQueueSection({ newspaperId }: { newspaperId: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Number(searchParams.get("page") ?? "1");

  const [articles, setArticles] = useState<QueueArticle[]>([]);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [assignEditorId, setAssignEditorId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!newspaperId) return;
    await null;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: "20",
        view: "NEWSPAPER_MANAGER",
      });
      const res = await fetch(
        `${API_BASE_URL}/api/newspapers/${newspaperId}/articles/queue?${params}`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error();
      const data = (await res.json()) as PaginatedResponse<QueueArticle>;
      setArticles(data.data);
      setPagination({
        total: data.pagination.total,
        total_pages: data.pagination.total_pages,
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [newspaperId, currentPage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleAssignEditor(articleId: string) {
    if (!assignEditorId.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/newspapers/${newspaperId}/articles/${articleId}/assign-editor`,
        {
          method: "POST",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ editor_id: assignEditorId.trim() }),
        }
      );
      if (!res.ok) throw new Error();
      setActiveId(null);
      setAssignEditorId("");
      load();
    } catch {
      alert(
        "Failed to assign editor. Please check the editor ID and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(
    articleId: string,
    decision: ReviewDecision,
    note: string
  ) {
    setSubmitting(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/newspapers/${newspaperId}/articles/${articleId}/approve`,
        {
          method: "POST",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ decision, note: note || undefined }),
        }
      );
      if (!res.ok) throw new Error();
      setActiveId(null);
      load();
    } catch {
      alert("Failed to submit decision. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <SectionTitle title="Editorial Queue" />

      {error ? (
        <ErrorState />
      ) : loading ? (
        <LoadingState />
      ) : articles.length === 0 ? (
        <EmptyState message="No articles awaiting editorial action." />
      ) : (
        <>
          <div className="flex flex-col">
            {articles.map((article, index) => {
              const isSubmitted = article.status === "SUBMITTED";
              return (
                <ArticleListRow
                  key={article.id}
                  index={index}
                  total={articles.length}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-foreground text-[15px] leading-snug font-semibold">
                        {article.title}
                      </span>
                      <span className="text-muted-foreground line-clamp-2 text-[13px] leading-[1.4]">
                        {article.perex}
                      </span>
                      <div className="text-muted-foreground flex flex-wrap gap-3 text-[12px]">
                        <span>Author: {article.author.full_name}</span>
                        <span>Category: {article.category}</span>
                        {article.assigned_editor && (
                          <span>
                            Editor: {article.assigned_editor.full_name}
                          </span>
                        )}
                        <span>
                          Submitted: {formatDate(article.submitted_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-[12px] font-semibold ${STATUS_STYLES[article.status]}`}
                      >
                        {STATUS_LABELS[article.status]}
                      </span>
                      <button
                        onClick={() =>
                          setActiveId(
                            activeId === article.id ? null : article.id
                          )
                        }
                        className="border-border text-foreground hover:bg-muted rounded-md border px-3 py-1.5 text-[12px] font-semibold transition-colors"
                      >
                        {isSubmitted ? "Assign Editor" : "Review"}
                      </button>
                    </div>
                  </div>

                  {activeId === article.id && isSubmitted && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleAssignEditor(article.id);
                      }}
                      className="border-border bg-muted/30 mt-3 flex flex-col gap-3 rounded-lg border p-4"
                    >
                      <label className="text-foreground text-[13px] font-medium">
                        Editor ID
                        <input
                          type="text"
                          value={assignEditorId}
                          onChange={(e) => setAssignEditorId(e.target.value)}
                          placeholder="UUID of the editor…"
                          required
                          className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring mt-1.5 w-full rounded-md border px-3 py-2 text-[13px] outline-none focus:ring-2"
                        />
                      </label>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveId(null)}
                          className="border-border text-muted-foreground hover:bg-muted rounded-md border px-3 py-1.5 text-[13px] font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting || !assignEditorId.trim()}
                          className="bg-foreground text-background rounded-md px-3 py-1.5 text-[13px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          {submitting ? "Assigning…" : "Assign"}
                        </button>
                      </div>
                    </form>
                  )}

                  {activeId === article.id && !isSubmitted && (
                    <DecisionForm
                      onSubmit={(d, n) => handleApprove(article.id, d, n)}
                      onCancel={() => setActiveId(null)}
                      submitting={submitting}
                    />
                  )}
                </ArticleListRow>
              );
            })}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.total_pages}
            total={pagination.total}
            onPageChange={(p) => {
              const next = new URLSearchParams(searchParams);
              next.set("page", String(p));
              setSearchParams(next);
            }}
          />
        </>
      )}
    </div>
  );
}

/* ── DirectorQueueSection (DIRECTOR) ───────────────────────────────────────── */

function DirectorQueueSection({ newspaperId }: { newspaperId: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Number(searchParams.get("page") ?? "1");

  const [articles, setArticles] = useState<QueueArticle[]>([]);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!newspaperId) return;
    await null;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: "20",
        view: "DIRECTOR",
      });
      const res = await fetch(
        `${API_BASE_URL}/api/newspapers/${newspaperId}/articles/queue?${params}`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error();
      const data = (await res.json()) as PaginatedResponse<QueueArticle>;
      setArticles(data.data);
      setPagination({
        total: data.pagination.total,
        total_pages: data.pagination.total_pages,
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [newspaperId, currentPage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleApprove(
    articleId: string,
    decision: ReviewDecision,
    note: string
  ) {
    setSubmitting(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/newspapers/${newspaperId}/articles/${articleId}/approve`,
        {
          method: "POST",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ decision, note: note || undefined }),
        }
      );
      if (!res.ok) throw new Error();
      setActiveId(null);
      load();
    } catch {
      alert("Failed to submit decision. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <SectionTitle title="Approval Queue" />

      {error ? (
        <ErrorState />
      ) : loading ? (
        <LoadingState />
      ) : articles.length === 0 ? (
        <EmptyState message="No articles awaiting your approval." />
      ) : (
        <>
          <div className="flex flex-col">
            {articles.map((article, index) => (
              <ArticleListRow
                key={article.id}
                index={index}
                total={articles.length}
              >
                <div className="flex items-start gap-4">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-foreground text-[15px] leading-snug font-semibold">
                      {article.title}
                    </span>
                    <span className="text-muted-foreground line-clamp-2 text-[13px] leading-[1.4]">
                      {article.perex}
                    </span>
                    <div className="text-muted-foreground flex flex-wrap gap-3 text-[12px]">
                      <span>Author: {article.author.full_name}</span>
                      <span>Category: {article.category}</span>
                      <span>Submitted: {formatDate(article.submitted_at)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-[12px] font-semibold ${STATUS_STYLES[article.status]}`}
                    >
                      {STATUS_LABELS[article.status]}
                    </span>
                    <button
                      onClick={() =>
                        setActiveId(activeId === article.id ? null : article.id)
                      }
                      className="border-border text-foreground hover:bg-muted rounded-md border px-3 py-1.5 text-[12px] font-semibold transition-colors"
                    >
                      Decide
                    </button>
                  </div>
                </div>
                {activeId === article.id && (
                  <DecisionForm
                    onSubmit={(d, n) => handleApprove(article.id, d, n)}
                    onCancel={() => setActiveId(null)}
                    submitting={submitting}
                  />
                )}
              </ArticleListRow>
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.total_pages}
            total={pagination.total}
            onPageChange={(p) => {
              const next = new URLSearchParams(searchParams);
              next.set("page", String(p));
              setSearchParams(next);
            }}
          />
        </>
      )}
    </div>
  );
}

/* ── CategoriesSection (NEWSPAPER_MANAGER) ─────────────────────────────────── */

function CategoriesSection({ newspaperId }: { newspaperId: string }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!newspaperId) return;
    await null;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/newspapers/${newspaperId}/categories`
      );
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { data: Category[] };
      setCategories(data.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [newspaperId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/newspapers/${newspaperId}/categories`,
        {
          method: "POST",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName.trim() }),
        }
      );
      if (!res.ok) throw new Error();
      setNewName("");
      load();
    } catch {
      alert("Failed to create category.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: string) {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/newspapers/${newspaperId}/categories/${id}`,
        {
          method: "PUT",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ name: editName.trim() }),
        }
      );
      if (!res.ok) throw new Error();
      setEditId(null);
      setEditName("");
      load();
    } catch {
      alert("Failed to update category.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (
      !confirm(
        "Delete this category? This will fail if articles are assigned to it."
      )
    )
      return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/newspapers/${newspaperId}/categories/${id}`,
        { method: "DELETE", headers: authHeaders() }
      );
      if (res.status === 409) {
        alert("Cannot delete: articles are assigned to this category.");
        return;
      }
      if (!res.ok) throw new Error();
      load();
    } catch {
      alert("Failed to delete category.");
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <SectionTitle title="Categories" />

      <form
        onSubmit={handleCreate}
        className="border-border bg-card flex items-center gap-3 rounded-lg border px-5 py-4"
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name…"
          className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring flex-1 rounded-md border px-3 py-2 text-[13px] outline-none focus:ring-2"
        />
        <button
          type="submit"
          disabled={saving || !newName.trim()}
          className="bg-foreground text-background flex items-center gap-2 rounded-md px-4 py-2 text-[13px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <PlusIcon />
          Add Category
        </button>
      </form>

      {error ? (
        <ErrorState />
      ) : loading ? (
        <LoadingState />
      ) : categories.length === 0 ? (
        <EmptyState message="No categories yet. Add one above." />
      ) : (
        <div className="flex flex-col">
          {categories.map((cat, index) => (
            <ArticleListRow
              key={cat.id}
              index={index}
              total={categories.length}
            >
              <div className="flex items-center gap-4">
                {editId === cat.id ? (
                  <input
                    autoFocus
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="border-border bg-background text-foreground focus:ring-ring flex-1 rounded-md border px-3 py-1.5 text-[13px] outline-none focus:ring-2"
                  />
                ) : (
                  <span className="text-foreground flex-1 text-[14px] font-medium">
                    {cat.name}
                  </span>
                )}
                <div className="flex shrink-0 items-center gap-2">
                  {editId === cat.id ? (
                    <>
                      <button
                        onClick={() => handleUpdate(cat.id)}
                        disabled={saving || !editName.trim()}
                        className="bg-foreground text-background rounded-md px-3 py-1.5 text-[12px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditId(null);
                          setEditName("");
                        }}
                        className="border-border text-muted-foreground hover:bg-muted rounded-md border px-3 py-1.5 text-[12px] font-medium"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditId(cat.id);
                          setEditName(cat.name);
                        }}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Edit category"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="text-muted-foreground transition-colors hover:text-[#dc2626]"
                        aria-label="Delete category"
                      >
                        <TrashIcon />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </ArticleListRow>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── StatisticsSection (NEWSPAPER_MANAGER | DIRECTOR) ──────────────────────── */

function StatisticsSection({ newspaperId }: { newspaperId: string }) {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!newspaperId) return;
    fetch(`${API_BASE_URL}/api/newspapers/${newspaperId}/statistics`, {
      headers: authHeaders(),
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json() as Promise<Statistics>;
      })
      .then(setStats)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [newspaperId]);

  return (
    <div className="flex flex-col gap-7">
      <SectionTitle title="Statistics" />

      {error ? (
        <ErrorState />
      ) : loading ? (
        <LoadingState />
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              {
                label: "Published",
                value: stats.articles.total_published,
                color: "text-[#16a34a]",
              },
              {
                label: "In Review",
                value: stats.articles.total_in_review,
                color: "text-[#ea580c]",
              },
              {
                label: "Drafts",
                value: stats.articles.total_draft,
                color: "text-muted-foreground",
              },
              {
                label: "Rejected",
                value: stats.articles.total_rejected,
                color: "text-[#dc2626]",
              },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="border-border bg-card flex flex-col gap-1 rounded-lg border px-5 py-4"
              >
                <span className="text-muted-foreground text-[12px] font-medium tracking-wide uppercase">
                  {label}
                </span>
                <span className={`text-[32px] font-bold ${color}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border-border bg-card flex flex-col gap-1 rounded-lg border px-5 py-4">
              <span className="text-muted-foreground text-[12px] font-medium tracking-wide uppercase">
                Total Comments
              </span>
              <span className="text-foreground text-[32px] font-bold">
                {stats.engagement.total_comments}
              </span>
            </div>
            <div className="border-border bg-card flex flex-col gap-1 rounded-lg border px-5 py-4">
              <span className="text-muted-foreground text-[12px] font-medium tracking-wide uppercase">
                Total Likes
              </span>
              <span className="text-foreground text-[32px] font-bold">
                {stats.engagement.total_likes}
              </span>
            </div>
          </div>

          {stats.articles.published_by_category.length > 0 && (
            <div className="border-border bg-card flex flex-col gap-4 rounded-lg border px-5 py-4">
              <h2 className="text-foreground text-[15px] font-semibold">
                Published by Category
              </h2>
              <div className="flex flex-col gap-2">
                {stats.articles.published_by_category.map(
                  ({ category, count }) => (
                    <div
                      key={category}
                      className="flex items-center justify-between"
                    >
                      <span className="text-muted-foreground text-[13px]">
                        {category}
                      </span>
                      <span className="text-foreground text-[13px] font-semibold">
                        {count}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {stats.articles.published_by_author.length > 0 && (
            <div className="border-border bg-card flex flex-col gap-4 rounded-lg border px-5 py-4">
              <h2 className="text-foreground text-[15px] font-semibold">
                Published by Author
              </h2>
              <div className="flex flex-col gap-2">
                {stats.articles.published_by_author.map(
                  ({ author_id, full_name, count }) => (
                    <div
                      key={author_id}
                      className="flex items-center justify-between"
                    >
                      <span className="text-muted-foreground text-[13px]">
                        {full_name}
                      </span>
                      <span className="text-foreground text-[13px] font-semibold">
                        {count}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

/* ── AllNewspapersSection (DIRECTOR) ───────────────────────────────────────── */

function AllNewspapersSection() {
  const [newspapers, setNewspapers] = useState<NewspaperEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/newspapers`, { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json() as Promise<{ data: NewspaperEntry[] }>;
      })
      .then((data) => setNewspapers(data.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-7">
      <SectionTitle title="All Newspapers" />

      {error ? (
        <ErrorState />
      ) : loading ? (
        <LoadingState />
      ) : newspapers.length === 0 ? (
        <EmptyState message="No newspapers found." />
      ) : (
        <div className="flex flex-col">
          {newspapers.map((np, index) => (
            <ArticleListRow key={np.id} index={index} total={newspapers.length}>
              <div className="flex items-center gap-4">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-foreground text-[15px] font-semibold">
                    {np.name}
                  </span>
                  <span className="text-muted-foreground text-[12px]">
                    Created {formatDate(np.created_at)}
                  </span>
                </div>
              </div>
            </ArticleListRow>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── UserManagementSection (SYSTEM_ADMINISTRATOR) ──────────────────────────── */

function UserManagementSection({ newspaperId }: { newspaperId: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Number(searchParams.get("page") ?? "1");

  const [users, setUsers] = useState<UserEntry[]>([]);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [roleInput, setRoleInput] = useState("");
  const [saving, setSaving] = useState(false);

  const ALL_ROLES = [
    "REGISTERED_USER",
    "AUTHOR",
    "EDITOR",
    "NEWSPAPER_MANAGER",
    "DIRECTOR",
  ];

  const load = useCallback(async () => {
    if (!newspaperId) return;
    await null;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: "50",
      });
      const res = await fetch(
        `${API_BASE_URL}/api/newspapers/${newspaperId}/users?${params}`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error();
      const data = (await res.json()) as PaginatedResponse<UserEntry>;
      setUsers(data.data);
      setPagination({
        total: data.pagination.total,
        total_pages: data.pagination.total_pages,
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [newspaperId, currentPage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleAssignRole(userId: string) {
    if (!roleInput) return;
    setSaving(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/newspapers/${newspaperId}/users/${userId}/roles`,
        {
          method: "POST",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ role: roleInput }),
        }
      );
      if (res.status === 409) {
        alert("User already has this role.");
        return;
      }
      if (!res.ok) throw new Error();
      setActiveUserId(null);
      setRoleInput("");
      load();
    } catch {
      alert("Failed to assign role.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveRole(userId: string, role: string) {
    if (role === "REGISTERED_USER") {
      alert("Cannot remove the base REGISTERED_USER role.");
      return;
    }
    if (!confirm(`Remove role ${role} from this user?`)) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/newspapers/${newspaperId}/users/${userId}/roles/${role}`,
        { method: "DELETE", headers: authHeaders() }
      );
      if (!res.ok) throw new Error();
      load();
    } catch {
      alert("Failed to remove role.");
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <SectionTitle title="User Management" />

      {error ? (
        <ErrorState />
      ) : loading ? (
        <LoadingState />
      ) : users.length === 0 ? (
        <EmptyState message="No users found." />
      ) : (
        <>
          <div className="flex flex-col">
            {users.map((user, index) => (
              <ArticleListRow key={user.id} index={index} total={users.length}>
                <div className="flex items-start gap-4">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-foreground text-[14px] font-semibold">
                      {user.full_name ?? user.username}
                    </span>
                    <span className="text-muted-foreground text-[12px]">
                      @{user.username} · {user.email}
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {user.roles.map((role) => (
                        <span
                          key={role}
                          className="bg-muted text-muted-foreground flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                        >
                          {role}
                          {role !== "REGISTERED_USER" && (
                            <button
                              onClick={() => handleRemoveRole(user.id, role)}
                              className="ml-0.5 transition-colors hover:text-[#dc2626]"
                              aria-label={`Remove ${role}`}
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setActiveUserId(activeUserId === user.id ? null : user.id)
                    }
                    className="border-border text-foreground hover:bg-muted shrink-0 rounded-md border px-3 py-1.5 text-[12px] font-semibold transition-colors"
                  >
                    Assign Role
                  </button>
                </div>

                {activeUserId === user.id && (
                  <div className="border-border bg-muted/30 mt-3 flex items-center gap-3 rounded-lg border p-4">
                    <select
                      value={roleInput}
                      onChange={(e) => setRoleInput(e.target.value)}
                      className="border-border bg-background text-foreground focus:ring-ring flex-1 rounded-md border px-3 py-2 text-[13px] outline-none focus:ring-2"
                    >
                      <option value="">Select a role…</option>
                      {ALL_ROLES.filter((r) => !user.roles.includes(r)).map(
                        (r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        )
                      )}
                    </select>
                    <button
                      onClick={() => handleAssignRole(user.id)}
                      disabled={saving || !roleInput}
                      className="bg-foreground text-background rounded-md px-3 py-2 text-[13px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {saving ? "Saving…" : "Assign"}
                    </button>
                    <button
                      onClick={() => {
                        setActiveUserId(null);
                        setRoleInput("");
                      }}
                      className="border-border text-muted-foreground hover:bg-muted rounded-md border px-3 py-2 text-[13px] font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </ArticleListRow>
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.total_pages}
            total={pagination.total}
            onPageChange={(p) => {
              const next = new URLSearchParams(searchParams);
              next.set("page", String(p));
              setSearchParams(next);
            }}
          />
        </>
      )}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────────────── */

export function AuthorDashboardPage() {
  const { newspaperName } = useParams<{ newspaperName: string }>();
  const { newspaper } = useNewspaper();
  const [searchParams, setSearchParams] = useSearchParams();

  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [rolesLoaded, setRolesLoaded] = useState(false);

  const np = newspaperName ?? "";
  const newspaperId = newspaper?.id ?? "";

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/users/me`, { headers: authHeaders() })
      .then((res) =>
        res.ok ? (res.json() as Promise<{ roles: string[] }>) : Promise.reject()
      )
      .then((data) => setUserRoles(data.roles ?? []))
      .catch(() => {})
      .finally(() => setRolesLoaded(true));
  }, []);

  const sectionParam = searchParams.get("section");
  const activeSection =
    sectionParam ?? (rolesLoaded ? deriveDefaultSection(userRoles) : null);

  function setStatusFilter(status: ArticleStatus | null) {
    const next = new URLSearchParams(searchParams);
    next.set("section", "my-articles");
    if (status) next.set("status", status);
    else next.delete("status");
    setSearchParams(next);
  }

  const statusInSearch =
    (searchParams.get("status") as ArticleStatus | null) ?? null;

  const sidebarChildren =
    activeSection === "my-articles" ? (
      <div className="flex flex-col gap-0.5">
        <p className="text-muted-foreground px-2 pt-2 pb-1 text-[11px] font-semibold tracking-wider uppercase">
          Filter by Status
        </p>
        {MY_ARTICLE_FILTERS.map((item) => (
          <button
            key={String(item.value)}
            onClick={() => setStatusFilter(item.value)}
            className={`flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-[13px] font-medium transition-colors ${
              statusInSearch === item.value
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
          </button>
        ))}
      </div>
    ) : null;

  const hasAccess = userRoles.some((r) => EDITORIAL_ROLES.includes(r));

  return (
    <div className="bg-background text-foreground flex min-h-screen w-full flex-col">
      <Navbar newspaperName={np} />

      <div className="flex flex-1">
        <Sidebar>{sidebarChildren}</Sidebar>

        <main className="flex flex-1 flex-col gap-7 px-12 py-8">
          {!rolesLoaded ? (
            <LoadingState />
          ) : !hasAccess ? (
            <EmptyState message="You don't have access to the dashboard." />
          ) : !activeSection ? (
            <LoadingState />
          ) : activeSection === "my-articles" ? (
            <MyArticlesSection newspaperId={newspaperId} newspaperName={np} />
          ) : activeSection === "review-queue" ? (
            <ReviewQueueSection newspaperId={newspaperId} />
          ) : activeSection === "editorial-queue" ? (
            <EditorialQueueSection newspaperId={newspaperId} />
          ) : activeSection === "categories" ? (
            <CategoriesSection newspaperId={newspaperId} />
          ) : activeSection === "statistics" ? (
            <StatisticsSection newspaperId={newspaperId} />
          ) : activeSection === "director-queue" ? (
            <DirectorQueueSection newspaperId={newspaperId} />
          ) : activeSection === "all-newspapers" ? (
            <AllNewspapersSection />
          ) : activeSection === "user-management" ? (
            <UserManagementSection newspaperId={newspaperId} />
          ) : (
            <EmptyState message="This section is not available." />
          )}
        </main>
      </div>
    </div>
  );
}
