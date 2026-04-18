import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

export default defineConfig({
    schema: "./src/db/schema.ts", // Cesta k vašemu schématu
    out: "./drizzle",             // Složka, kam se budou generovat migrace
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});