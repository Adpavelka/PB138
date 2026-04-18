import { db } from "../index";
import * as schema from "../schema";
import type { NewNewspaper } from "../schema";
import { slugify } from "../help_functions/slugify"


export async function seedNewspapers() {
    const SPECIFIC_NEWSPAPERS = ["DeníkN", "ClaudeDaily", "MuniJournal", "Forbes"];

    const newspapersToInsert: NewNewspaper[] = SPECIFIC_NEWSPAPERS.map((name) => ({
        name: name,
        slug: slugify(name),
    }))

    await db.insert(schema.newspapers).values(newspapersToInsert);
    console.log("Newspapers added successfully!");
}