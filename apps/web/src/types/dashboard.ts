import type { ArticleStatus } from "./index";

export interface DashboardArticle {
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

export interface QueueArticle {
  id: string;
  title: string;
  perex: string;
  category: string;
  status: ArticleStatus;
  submitted_at: string;
  author: { id: string; full_name: string };
  assigned_editor: { id: string; full_name: string } | null;
}

export interface Statistics {
  articles: {
    total_published: number;
    total_draft: number;
    total_in_review: number;
    total_rejected: number;
    published_by_category: { category: string; count: number }[];
    published_by_author: {
      author_id: string;
      full_name: string;
      count: number;
    }[];
  };
  engagement: { total_comments: number; total_likes: number };
}

export interface NewspaperEntry {
  id: string;
  name: string;
  created_at: string;
}

export interface UserEntry {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  roles: string[];
}
