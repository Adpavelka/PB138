// --- Enums ---

export type UserRole =
  | "REGISTERED_USER"
  | "AUTHOR"
  | "EDITOR"
  | "NEWSPAPER_MANAGER"
  | "DIRECTOR"
  | "SYSTEM_ADMINISTRATOR";

export type ArticleStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "IN_REVIEW"
  | "APPROVED_BY_EDITOR"
  | "APPROVED_BY_MANAGER"
  | "APPROVED_BY_DIRECTOR"
  | "PUBLISHED"
  | "REJECTED";

export type ReviewDecision = "APPROVE" | "REJECT" | "REQUEST_REVISION";

// --- Core entities ---

export interface Newspaper {
  id: string;
  name: string;
  slug: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  email_verified: boolean;
  profile_picture: string | null;
  bio: string | null;
  roles: UserRole[];
}

export interface Category {
  id: string;
  name: string;
}

// --- Article building blocks ---

export interface ArticleImage {
  url: string;
  caption: string;
  is_primary: boolean;
}

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  author: {
    id: string;
    username: string;
  };
}

export interface ArticleAuthorSummary {
  id: string;
  full_name: string;
  profile_picture: string | null;
}

// --- Article shapes ---

export interface Article {
  id: string;
  title: string;
  perex: string;
  publication_date: string;
  category: string;
  keywords: string[];
  primary_image: { url: string; caption: string } | null;
  author: ArticleAuthorSummary;
}

export interface ArticleDetail {
  id: string;
  title: string;
  perex: string;
  content: string;
  publication_date: string;
  category: string;
  category_slug: string;
  keywords: string[];
  likes_count: number;
  liked_by_me: boolean;
  author: ArticleAuthorSummary;
  images: ArticleImage[];
  comments: Comment[];
}

// --- Pagination ---

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

// --- Author public profile ---

export interface AuthorPublicProfile {
  id: string;
  full_name: string;
  username: string;
  bio: string | null;
  profile_picture: string | null;
  articles: PaginatedResponse<Article>;
}

// --- Auth responses ---

export interface LoginResponse {
  token: string;
  user: User;
}
