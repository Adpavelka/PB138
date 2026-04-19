CREATE TYPE "public"."article_state" AS ENUM('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED_BY_EDITOR', 'APPROVED_BY_MANAGER', 'APPROVED_BY_DIRECTOR', 'PUBLISHED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."audit_result" AS ENUM('SUCCESS', 'FAILURE');--> statement-breakpoint
CREATE TYPE "public"."review_decisions" AS ENUM('APPROVED', 'REJECTED', 'REVISION_REQUESTED');--> statement-breakpoint
CREATE TYPE "public"."user_roles_enum" AS ENUM('VISITOR', 'REGISTERED_USER', 'AUTHOR', 'EDITOR', 'NEWSPAPER_MANAGER', 'DIRECTOR', 'SYSTEM_ADMINISTRATOR');--> statement-breakpoint
CREATE TABLE "article_category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	CONSTRAINT "article_category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "article_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"url" text NOT NULL,
	"caption" text,
	"is_primary" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"feedback" text,
	"decision" "review_decisions" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"perex" text NOT NULL,
	"content" text NOT NULL,
	"keywords" text,
	"article_state" "article_state" DEFAULT 'DRAFT',
	"author_id" uuid NOT NULL,
	"newspaper_id" uuid NOT NULL,
	"category_id" uuid,
	"publication_date" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"operation_type" varchar(255) NOT NULL,
	"target_object_id" uuid,
	"result" "audit_result" NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"user_id" uuid NOT NULL,
	"article_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "likes_user_id_article_id_pk" PRIMARY KEY("user_id","article_id")
);
--> statement-breakpoint
CREATE TABLE "newspaper_authors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"newspapers_id" uuid NOT NULL,
	"biography" text,
	"url" text,
	CONSTRAINT "newspaper_authors_user_id_newspapers_id_unique" UNIQUE("user_id","newspapers_id")
);
--> statement-breakpoint
CREATE TABLE "newspapers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	CONSTRAINT "newspapers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid,
	"newspaper_id" uuid,
	"user_role" "user_roles_enum" DEFAULT 'VISITOR',
	CONSTRAINT "user_roles_user_id_newspaper_id_user_role_pk" PRIMARY KEY("user_id","newspaper_id","user_role")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"newspaper_id" uuid,
	"email" varchar(255) NOT NULL,
	"username" varchar(63) NOT NULL,
	"fullname" varchar(127),
	"password_hash" text NOT NULL,
	"email_verified" boolean DEFAULT false
);
--> statement-breakpoint
ALTER TABLE "article_images" ADD CONSTRAINT "article_images_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_reviews" ADD CONSTRAINT "article_reviews_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_reviews" ADD CONSTRAINT "article_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_newspaper_id_newspapers_id_fk" FOREIGN KEY ("newspaper_id") REFERENCES "public"."newspapers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_article_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."article_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newspaper_authors" ADD CONSTRAINT "newspaper_authors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newspaper_authors" ADD CONSTRAINT "newspaper_authors_newspapers_id_newspapers_id_fk" FOREIGN KEY ("newspapers_id") REFERENCES "public"."newspapers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_newspaper_id_newspapers_id_fk" FOREIGN KEY ("newspaper_id") REFERENCES "public"."newspapers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_newspaper_id_newspapers_id_fk" FOREIGN KEY ("newspaper_id") REFERENCES "public"."newspapers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "article_slug_idx" ON "article_category" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "newspaper_slug_idx" ON "newspapers" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "email_newspaper_idx" ON "users" USING btree ("email","newspaper_id");