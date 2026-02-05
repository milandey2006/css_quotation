
require('dotenv').config();
const postgres = require('postgres');

async function checkData() {
    try {
        if (!process.env.DATABASE_URL) {
            console.error("❌ DATABASE_URL is missing from .env");
            process.exit(1);
        }
        
        console.log("Checking database connection...");
        const sql = postgres(process.env.DATABASE_URL);
        
        const result = await sql`SELECT count(*) FROM quotations`;
        console.log("✅ Connection Successful!");
        console.log("📊 Quotations Count:", result[0].count);
        
        await sql.end();
    } catch (e) {
        console.error("❌ Database Error:", e);
    }
    process.exit(0);
}

checkData();
