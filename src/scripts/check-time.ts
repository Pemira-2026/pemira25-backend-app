import { db } from '../config/db';
import { sql } from 'drizzle-orm';
import pool from '../config/db';

async function checkTime() {
     try {
          console.log("Checking DB Timezone...");

          // 1. Check Configured Timezone
          const tzResult = await db.execute(sql`SHOW TIMEZONE`);
          console.log("Current DB Session Timezone:", tzResult.rows[0]);

          // 2. Check Current Time (should be WIB)
          const timeResult = await db.execute(sql`SELECT NOW() as current_time`);
          console.log("Current DB Time (NOW):", timeResult.rows[0]);

          console.log("Local System Time:", new Date().toString());
     } catch (e) {
          console.error("Error:", e);
     } finally {
          await pool.end();
     }
}

checkTime();
