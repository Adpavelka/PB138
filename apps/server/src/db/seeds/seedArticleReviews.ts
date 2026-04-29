import { faker } from "@faker-js/faker";
import { db } from "../index";
import * as schema from "../schema";
import type { NewArticleReview } from "../schema";
import { eq } from "drizzle-orm";

export async function seedArticleReviews() {
    const newspaper = await db.query.newspapers.findFirst({
        where: eq(schema.newspapers.name, "ClaudeDaily"),
        columns: { id: true },
    });

    if (!newspaper) {
        console.warn("ClaudeDaily newspaper not found, skipping article reviews seed.");
        return;
    }

    const emma = await db.query.users.findFirst({
        where: eq(schema.users.email, "emma.bednarikova@email.cz"),
        columns: { id: true },
    });

    if (!emma) {
        console.warn("Emma not found, skipping article reviews seed.");
        return;
    }

    const articles = await db.query.articles.findMany({
        where: eq(schema.articles.newspaperId, newspaper.id),
        columns: { id: true },
    });

    if (articles.length === 0) {
        console.warn("No articles found in ClaudeDaily, skipping article reviews seed.");
        return;
    }

    const decisions = ["REJECTED", "APPROVED"] as const;

    const reviewsToInsert: NewArticleReview[] = articles.map((article) => {
        const decision = faker.helpers.arrayElement(decisions);
        return {
            articleId: article.id,
            reviewerId: emma.id,
            decision: decision ?? undefined,
            feedback: decision ? faker.lorem.sentence() : undefined,
        };
    });

    await db.insert(schema.articleReviews).values(reviewsToInsert);

    console.log(`Article reviews seeded successfully (${reviewsToInsert.length} reviews).`);
}
