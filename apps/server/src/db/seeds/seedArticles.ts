import { faker } from "@faker-js/faker";
import { db } from "../index";
import * as schema from "../schema";
import type { NewArticle } from "../schema";

export async function seedArticles() {
    const authors = await db.query.newspaperAuthors.findMany();

    if (authors.length === 0) {
        throw new Error("❌ No authors found!");
    }

    const categories = await db.query.articleCategory.findMany();
    const articlesToInsert: NewArticle[] = [];

    for (const author of authors) {
        const articlesCount = faker.number.int({ min: 3, max: 7 });

        for (let i = 0; i < articlesCount; i++) {
            articlesToInsert.push({
                title: faker.lorem.sentence({ min: 4, max: 10 }).replace(/\.$/, ""),
                perex: faker.lorem.paragraph(1),
                content: faker.lorem.paragraphs({ min: 3, max: 8 }, "\n\n"),
                keywords: faker.lorem.words(5).split(" ").join(", "),
                state: faker.helpers.arrayElement(["PUBLISHED", "DRAFT", "DRAFT"]),

                authorId: author.userId,
                newspaperId: author.newspaperId,

                categoryId: categories.length > 0
                    ? faker.helpers.arrayElement(categories).id
                    : null,

                publicationDate: faker.date.past(),
            });
        }
    }

    await db.insert(schema.articles).values(articlesToInsert);

    console.log(`Successfully added ${articlesToInsert.length} articles.`);
}
