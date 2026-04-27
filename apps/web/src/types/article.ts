export type {
  Article,
  ArticleDetail,
  AuthorPublicProfile as AuthorDetail,
} from "./index";
import type { Article } from "./index";
import type { PaginatedResponse } from "./index";
export type ArticlesResponse = PaginatedResponse<Article>;
