import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
} from "@lexical/list";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  type EditorState,
} from "lexical";
import { Navbar } from "../components/Navbar";
import { useNewspaper } from "../hooks/useNewspaper";
import { API_BASE_URL, authHeaders } from "../lib/api";
import type { Category, ArticleStatus } from "../types";

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface ArticleImage {
  id?: string;
  url: string;
  caption: string | null;
  is_primary: boolean;
}

interface LoadedArticle {
  id: string;
  title: string;
  perex: string;
  content: string;
  keywords: string[] | null;
  category_id: string | null;
  status: ArticleStatus;
  images: ArticleImage[];
}

/* ── Lexical theme ─────────────────────────────────────────────────────────── */

const editorTheme = {
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
  },
  list: {
    ul: "list-disc pl-6 my-2",
    ol: "list-decimal pl-6 my-2",
    listitem: "my-0.5",
    nested: {
      listitem: "list-none",
    },
  },
  quote: "border-l-4 border-border pl-4 text-muted-foreground italic my-3",
  heading: {
    h1: "text-2xl font-bold my-3",
    h2: "text-xl font-bold my-3",
    h3: "text-lg font-bold my-2",
  },
  paragraph: "my-1",
};

/* ── Toolbar ───────────────────────────────────────────────────────────────── */

function ToolbarButton({
  active,
  onClick,
  children,
  title,
  className = "",
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded px-2.5 py-1 text-[13px] font-medium transition-colors ${
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      editor.read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          setIsBold(selection.hasFormat("bold"));
          setIsItalic(selection.hasFormat("italic"));
          setIsUnderline(selection.hasFormat("underline"));
        }
      });
    });
  }, [editor]);

  return (
    <div className="border-border flex items-center gap-0.5 border-b px-3 py-2">
      <ToolbarButton
        active={isBold}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        title="Bold (Ctrl+B)"
        className="font-bold"
      >
        B
      </ToolbarButton>
      <ToolbarButton
        active={isItalic}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        title="Italic (Ctrl+I)"
        className="italic"
      >
        I
      </ToolbarButton>
      <ToolbarButton
        active={isUnderline}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        title="Underline (Ctrl+U)"
        className="underline"
      >
        U
      </ToolbarButton>
      <div className="bg-border mx-1.5 h-4 w-px" />
      <ToolbarButton
        onClick={() =>
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
        }
        title="Bullet list"
      >
        • List
      </ToolbarButton>
      <ToolbarButton
        onClick={() =>
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
        }
        title="Numbered list"
      >
        1. List
      </ToolbarButton>
    </div>
  );
}

/* ── RichTextEditor ─────────────────────────────────────────────────────────── */

function RichTextEditor({
  initialContent,
  onContentChange,
}: {
  initialContent: string;
  onContentChange: (json: string) => void;
}) {
  const handleChange = useCallback(
    (editorState: EditorState) => {
      onContentChange(JSON.stringify(editorState.toJSON()));
    },
    [onContentChange]
  );

  let initialEditorState: string | undefined;
  try {
    const parsed = JSON.parse(initialContent);
    if (parsed.root) {
      initialEditorState = initialContent;
    }
  } catch {
    // Not Lexical JSON — editor starts empty; plain text is not pre-loaded
  }

  const initialConfig = {
    namespace: "ArticleEditor",
    theme: editorTheme,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
    onError: (error: Error) => {
      console.error("Lexical error:", error);
    },
    editorState: initialEditorState,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="border-border bg-card overflow-hidden rounded-lg border">
        <ToolbarPlugin />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                aria-placeholder="Write your article content here…"
                placeholder={
                  <div className="text-muted-foreground pointer-events-none absolute top-4 left-4 text-[15px] select-none">
                    Write your article content here…
                  </div>
                }
                className="text-foreground min-h-[420px] px-4 py-4 text-[15px] leading-relaxed outline-none"
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
        </div>
      </div>
    </LexicalComposer>
  );
}

/* ── Helpers ────────────────────────────────────────────────────────────────── */

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

/* ── Main Page ──────────────────────────────────────────────────────────────── */

export function ArticleEditorPage() {
  const { newspaperName, articleId } = useParams<{
    newspaperName: string;
    articleId?: string;
  }>();
  const navigate = useNavigate();
  const { newspaper } = useNewspaper();

  const isNew = !articleId || articleId === "new";
  const np = newspaperName ?? "";
  const newspaperId = newspaper?.id ?? "";

  /* ── Form state ──────────────────────────────────────────────────────────── */
  const [title, setTitle] = useState("");
  const [perex, setPerex] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [keywords, setKeywords] = useState("");
  const [articleStatus, setArticleStatus] = useState<ArticleStatus>("DRAFT");
  const [images, setImages] = useState<ArticleImage[]>([]);

  /* ── UI state ────────────────────────────────────────────────────────────── */
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Load categories ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!newspaperId) return;
    fetch(`${API_BASE_URL}/api/newspapers/${newspaperId}/categories`)
      .then((res) => res.json() as Promise<{ data: Category[] }>)
      .then((data) => setCategories(data.data ?? []))
      .catch(() => {});
  }, [newspaperId]);

  /* ── Load existing article ──────────────────────────────────────────────── */
  useEffect(() => {
    if (isNew || !articleId || !newspaperId) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setLoadError(null);

    fetch(
      `${API_BASE_URL}/api/newspapers/${newspaperId}/articles/mine/${articleId}`,
      { headers: authHeaders() }
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json() as Promise<LoadedArticle>;
      })
      .then((data) => {
        setTitle(data.title ?? "");
        setPerex(data.perex ?? "");
        setContent(data.content ?? "");
        setCategoryId(data.category_id ?? "");
        setKeywords(
          Array.isArray(data.keywords) ? data.keywords.join(", ") : ""
        );
        setArticleStatus(data.status ?? "DRAFT");
        setImages(data.images ?? []);
        setEditorKey((k) => k + 1);
      })
      .catch((err: Error) => {
        const code = err.message;
        if (code === "404") {
          setLoadError("Article not found.");
        } else if (code === "403") {
          setLoadError("You don't have permission to edit this article.");
        } else {
          setLoadError("Failed to load article. Please try again.");
        }
      })
      .finally(() => setLoading(false));
  }, [isNew, articleId, newspaperId]);

  /* ── Save as draft ──────────────────────────────────────────────────────── */
  async function handleSave() {
    if (!title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!perex.trim()) {
      setFormError("Perex is required.");
      return;
    }
    if (!categoryId) {
      setFormError("Category is required.");
      return;
    }
    setFormError(null);
    setSaving(true);

    const keywordsArray = keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const body = {
      title: title.trim(),
      perex: perex.trim(),
      content,
      category_id: categoryId,
      keywords: keywordsArray.length > 0 ? keywordsArray : undefined,
    };

    try {
      let res: Response;
      if (isNew) {
        res = await fetch(
          `${API_BASE_URL}/api/newspapers/${newspaperId}/articles`,
          {
            method: "POST",
            headers: { ...authHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );
      } else {
        res = await fetch(
          `${API_BASE_URL}/api/newspapers/${newspaperId}/articles/${articleId}`,
          {
            method: "PUT",
            headers: { ...authHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );
      }

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          fields?: Record<string, string>;
        };
        if (data.fields) {
          setFormError(Object.values(data.fields).join(" "));
        } else {
          setFormError(data.error ?? "Failed to save article.");
        }
        return;
      }

      const saved = (await res.json()) as { id: string };
      if (isNew) {
        navigate(`/${np}/articles/${saved.id}/edit`, { replace: true });
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  /* ── Submit for review ──────────────────────────────────────────────────── */
  async function handleSubmit() {
    if (isNew) {
      setFormError("Save the article first before submitting.");
      return;
    }
    //if (images.length === 0) {
    //  setFormError("Upload at least one image before submitting for review.");
    //  return;
    //}
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/newspapers/${newspaperId}/articles/${articleId}/submit`,
        { method: "POST", headers: authHeaders() }
      );

      if (!res.ok) {
        console.log("Something went wrong");
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setFormError(
          data.error === "ARTICLE_MISSING_IMAGE"
            ? "Upload at least one image before submitting."
            : (data.error ?? "Failed to submit article.")
        );
        return;
      }

      setArticleStatus("SUBMITTED");
      navigate(`/${np}/author-dashboard?section=my-articles`);
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Delete article ─────────────────────────────────────────────────────── */
  async function handleDelete() {
    if (isNew) return;
    if (
      !confirm("Permanently delete this article? This action cannot be undone.")
    )
      return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/newspapers/${newspaperId}/articles/${articleId}`,
        { method: "DELETE", headers: authHeaders() }
      );
      if (!res.ok) throw new Error();
      navigate(`/${np}/author-dashboard?section=my-articles`);
    } catch {
      setFormError("Failed to delete article. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  /* ── Upload image ───────────────────────────────────────────────────────── */
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !articleId || isNew) return;

    setUploadingImage(true);
    setFormError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/newspapers/${newspaperId}/articles/${articleId}/images`,
        {
          method: "POST",
          headers: authHeaders(),
          body: formData,
        }
      );

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setFormError(data.error ?? "Failed to upload image.");
        return;
      }

      const img = (await res.json()) as {
        id: string;
        url: string;
        caption: string | null;
        is_primary: boolean;
      };
      setImages((prev) => [...prev, img]);
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  /* ── Delete image ───────────────────────────────────────────────────────── */
  async function handleImageDelete(imageId: string) {
    if (!articleId || isNew) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/newspapers/${newspaperId}/articles/${articleId}/images/${imageId}`,
        { method: "DELETE", headers: authHeaders() }
      );
      if (res.status === 422) {
        setFormError("Cannot remove the only image from the article.");
        return;
      }
      if (!res.ok) throw new Error();
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch {
      setFormError("Failed to delete image. Please try again.");
    }
  }

  const isDraft = articleStatus === "DRAFT";
  const canEdit = isNew || isDraft;

  /* ── Render ─────────────────────────────────────────────────────────────── */

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Navbar newspaperName={np} />

      <main className="flex flex-1 flex-col gap-6 px-8 py-6 md:px-12">
        {/* Header row */}
        <div className="flex items-center justify-between gap-4">
          <Link
            to={`/${np}/author-dashboard?section=my-articles`}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-[13px] font-medium transition-colors"
          >
            ← Back to Dashboard
          </Link>

          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="border-border text-foreground hover:bg-muted rounded-md border px-4 py-2 text-[13px] font-semibold transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Draft"}
              </button>
            )}
            {!isNew && isDraft && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-foreground text-background rounded-md px-4 py-2 text-[13px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit for Review"}
              </button>
            )}
          </div>
        </div>

        {/* Loading / error states */}
        {loading ? (
          <p className="text-muted-foreground py-16 text-center">Loading…</p>
        ) : loadError ? (
          <div className="rounded-lg border border-[#dc2626]/20 bg-[#dc262608] px-5 py-4">
            <p className="text-[14px] text-[#dc2626]">{loadError}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* ── Left: main editor area ─────────────────────────────── */}
            <div className="flex min-w-0 flex-1 flex-col gap-5">
              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-[13px] font-semibold">
                  Title <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Article title…"
                  disabled={!canEdit}
                  className="border-border bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-lg border px-4 py-2.5 text-[15px] font-semibold outline-none focus:ring-2 disabled:opacity-60"
                />
              </div>

              {/* Perex */}
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-[13px] font-semibold">
                  Perex <span className="text-[#dc2626]">*</span>
                </label>
                <textarea
                  value={perex}
                  onChange={(e) => setPerex(e.target.value)}
                  placeholder="Short introduction shown in article listings…"
                  disabled={!canEdit}
                  rows={3}
                  className="border-border bg-card text-foreground placeholder:text-muted-foreground focus:ring-ring w-full resize-none rounded-lg border px-4 py-3 text-[14px] leading-relaxed outline-none focus:ring-2 disabled:opacity-60"
                />
              </div>

              {/* Content */}
              <div className="flex flex-col gap-1.5">
                <label className="text-foreground text-[13px] font-semibold">
                  Content <span className="text-[#dc2626]">*</span>
                </label>
                <RichTextEditor
                  key={editorKey}
                  initialContent={content}
                  onContentChange={canEdit ? setContent : () => {}}
                />
              </div>
            </div>

            {/* ── Right: metadata + images sidebar ──────────────────── */}
            <div className="flex w-full flex-col gap-5 lg:w-72 lg:shrink-0">
              {/* Status */}
              {!isNew && (
                <div className="border-border bg-card flex flex-col gap-3 rounded-lg border px-4 py-4">
                  <h2 className="text-foreground text-[13px] font-semibold">
                    Status
                  </h2>
                  <span
                    className={`self-start rounded-full px-3 py-1 text-[12px] font-semibold ${STATUS_STYLES[articleStatus]}`}
                  >
                    {STATUS_LABELS[articleStatus]}
                  </span>
                  {!isDraft && (
                    <p className="text-muted-foreground text-[12px]">
                      This article cannot be edited in its current state.
                    </p>
                  )}
                </div>
              )}

              {/* Category & Keywords */}
              <div className="border-border bg-card flex flex-col gap-4 rounded-lg border px-4 py-4">
                <h2 className="text-foreground text-[13px] font-semibold">
                  Details
                </h2>

                <div className="flex flex-col gap-1.5">
                  <label className="text-muted-foreground text-[12px] font-medium">
                    Category <span className="text-[#dc2626]">*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    disabled={!canEdit}
                    className="border-border bg-background text-foreground focus:ring-ring w-full rounded-md border px-3 py-2 text-[13px] outline-none focus:ring-2 disabled:opacity-60"
                  >
                    <option value="">Select category…</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-muted-foreground text-[12px] font-medium">
                    Keywords
                  </label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="comma, separated, keywords"
                    disabled={!canEdit}
                    className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-md border px-3 py-2 text-[13px] outline-none focus:ring-2 disabled:opacity-60"
                  />
                  <p className="text-muted-foreground/70 text-[11px]">
                    Separate keywords with commas
                  </p>
                </div>
              </div>

              {/* Images */}
              <div className="border-border bg-card flex flex-col gap-3 rounded-lg border px-4 py-4">
                <h2 className="text-foreground text-[13px] font-semibold">
                  Images
                </h2>

                {images.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {images.map((img, i) => (
                      <div
                        key={img.id ?? img.url}
                        className="border-border group relative overflow-hidden rounded-md border"
                      >
                        <img
                          src={img.url}
                          alt={img.caption ?? `Image ${i + 1}`}
                          className="h-28 w-full object-cover"
                        />
                        <div className="bg-background/80 absolute inset-x-0 bottom-0 flex items-center justify-between px-2 py-1 backdrop-blur-sm">
                          <span className="text-foreground truncate text-[11px]">
                            {img.is_primary && (
                              <span className="mr-1 text-[#16a34a]">
                                ★ Primary
                              </span>
                            )}
                            {img.caption || `Image ${i + 1}`}
                          </span>
                          {img.id && canEdit && (
                            <button
                              type="button"
                              onClick={() => handleImageDelete(img.id!)}
                              className="text-muted-foreground shrink-0 text-[11px] font-medium transition-colors hover:text-[#dc2626]"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-[12px]">
                    No images yet.{" "}
                    {!canEdit
                      ? ""
                      : isNew
                        ? "Save the article first, then upload images."
                        : "At least one image is required before submitting."}
                  </p>
                )}

                {!isNew && canEdit && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="border-border text-foreground hover:bg-muted w-full rounded-md border px-3 py-2 text-[12px] font-medium transition-colors disabled:opacity-50"
                    >
                      {uploadingImage ? "Uploading…" : "Upload Image"}
                    </button>
                  </>
                )}
              </div>

              {/* Danger zone */}
              {!isNew && isDraft && (
                <div className="border-border bg-card rounded-lg border px-4 py-4">
                  <h2 className="text-foreground mb-3 text-[13px] font-semibold">
                    Danger Zone
                  </h2>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full rounded-md border border-[#dc2626]/30 px-3 py-2 text-[12px] font-medium text-[#dc2626] transition-colors hover:bg-[#dc262608] disabled:opacity-50"
                  >
                    {deleting ? "Deleting…" : "Delete Article"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form error */}
        {formError && (
          <div className="rounded-lg border border-[#dc2626]/20 bg-[#dc262608] px-4 py-3">
            <p className="text-[13px] text-[#dc2626]">{formError}</p>
          </div>
        )}
      </main>
    </div>
  );
}
