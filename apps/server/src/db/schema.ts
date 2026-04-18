import { pgTable, text, varchar, timestamp, uuid, boolean, primaryKey, uniqueIndex, unique } from "drizzle-orm/pg-core";
import { relations, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
export * from "./enums";
import { articleStateEnum, userRolesEnum, auditResultEnum, reviewDecisionsEnum } from "./enums";

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    newspaperId: uuid("newspaper_id").references(() => newspapers.id),
    email: varchar("email", { length: 255 }).notNull(),
    username: varchar("username", { length: 63 }).notNull(),
    fullname: varchar("fullname", { length: 127 }),
    passwordHash: text("password_hash").notNull(),
    email_verified: boolean("email_verified").default(false),
}, (table) => ([
    uniqueIndex("email_newspaper_idx").on(table.email, table.newspaperId),
]));

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export const newspapers = pgTable("newspapers", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
}, (table) => ([
    uniqueIndex("newspaper_slug_idx").on(table.slug),
]));

export type Newspaper = InferSelectModel<typeof newspapers>;
export type NewNewspaper = InferInsertModel<typeof newspapers>;

export const userRoles = pgTable("user_roles", {
    userId: uuid("user_id").references(() => users.id),
    newspaperId: uuid("newspaper_id").references(() => newspapers.id),
    role: userRolesEnum("user_role").default("VISITOR")
}, (table) => ([
    primaryKey({ columns: [table.userId, table.newspaperId, table.role] })
]));

export type UserRole = InferSelectModel<typeof userRoles>;
export type NewUserRole = InferInsertModel<typeof userRoles>;

export const newspaperAuthors = pgTable("newspaper_authors", {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),

    newspaperId: uuid("newspapers_id")
        .notNull()
        .references(() => newspapers.id, { onDelete: "cascade" }),

    biography: text("biography"),
    profilePictureUrl: text("url"),

}, (table) => ([
    unique().on(table.userId, table.newspaperId),
]));

export type NewspaperAuthor = InferSelectModel<typeof newspaperAuthors>;
export type NewNewspaperAuthor = InferInsertModel<typeof newspaperAuthors>;

export const articles = pgTable("articles", {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 255 }).notNull(),
    perex: text("perex").notNull(),
    content: text("content").notNull(),
    keywords: text("keywords"),
    state: articleStateEnum("article_state").default("DRAFT"),
    authorId: uuid("author_id").notNull().references(() => users.id),
    newspaperId: uuid("newspaper_id").notNull().references(() => newspapers.id),
    categoryId: uuid("category_id").references(() => articleCategory.id),
    publicationDate: timestamp("publication_date"),
    createdAt: timestamp("created_at").defaultNow()
});

export type Article = InferSelectModel<typeof articles>;
export type NewArticle = InferInsertModel<typeof articles>;
export type ArticleState = typeof articles.state.enumValues[number];

export const articleCategory = pgTable("article_category", {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryName: varchar("category_name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
}, (table) => ([
    uniqueIndex("article_slug_idx").on(table.slug),
]));

export type ArticleCategory = InferSelectModel<typeof articleCategory>;
export type NewArticleCategory = InferInsertModel<typeof articleCategory>;

export const articleImages = pgTable("article_images", {
    id: uuid("id").primaryKey().defaultRandom(),
    articleId: uuid("article_id")
        .notNull()
        .references(() => articles.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    caption: text("caption"),
    isPrimary: boolean("is_primary").default(false).notNull(),
});

export type ArticleImage = InferSelectModel<typeof articleImages>;
export type NewArticleImage = InferInsertModel<typeof articleImages>;

export const comments = pgTable("comments", {
    id: uuid("id").primaryKey().defaultRandom(),
    articleId: uuid("article_id")
        .notNull()
        .references(() => articles.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Comment = InferSelectModel<typeof comments>;
export type NewComment = InferInsertModel<typeof comments>;

export const likes = pgTable("likes", {
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    articleId: uuid("article_id")
        .notNull()
        .references(() => articles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ([
    primaryKey({ columns: [table.userId, table.articleId] }),
]));

export type Like = InferSelectModel<typeof likes>;
export type NewLike = InferInsertModel<typeof likes>;

export const articleReviews = pgTable("article_reviews", {
    id: uuid("id").primaryKey().defaultRandom(),
    articleId: uuid("article_id")
        .notNull()
        .references(() => articles.id, { onDelete: "cascade" }),
    reviewerId: uuid("reviewer_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    feedback: text("feedback"),
    decision: reviewDecisionsEnum("decision").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ArticleReview = InferSelectModel<typeof articleReviews>;
export type NewArticleReview = InferInsertModel<typeof articleReviews>;
export type ReviewDecision = typeof articleReviews.decision.enumValues[number];

export const auditLogs = pgTable("audit_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    operationType: varchar("operation_type", { length: 255 }).notNull(),
    targetObjectId: uuid("target_object_id"),
    result: auditResultEnum("result").notNull(),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
});