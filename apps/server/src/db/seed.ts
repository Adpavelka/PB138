import { seedNewspapers } from "./seeds/seedNewspaper"
import { seedUsers } from "./seeds/seedUsers"
import { seedNewArticleCategory } from "./seeds/seedArticleCategories"
import { seedAsignRoles } from "./seeds/seedUserRoles"
import { seedArticles } from "./seeds/seedArticles";
import { seedRandomAuthors } from "./seeds/seedRandomAuthors";
import { seedEmma } from "./seeds/seedEmma";
import { seedArticleReviews } from "./seeds/seedArticleReviews";


async function seed() {
    await seedNewspapers();
    await seedNewArticleCategory();
    await seedUsers();
    await seedAsignRoles();
    await seedRandomAuthors(10);
    await seedArticles();
    await seedEmma();
    await seedArticleReviews();

}

console.log("Getting ready...");
seed()
    .then(() => {
        console.log("✅ Done!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Something went wrong...", err);
        process.exit(1);
    });