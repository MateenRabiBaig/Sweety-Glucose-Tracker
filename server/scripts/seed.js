import bcrypt from "bcryptjs";
import pool from "../src/config/db.js";

const seedDatabase = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const passwordHash = await bcrypt.hash("Demo@123", 12);
    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email)
       DO UPDATE SET
         name = EXCLUDED.name,
         password_hash = EXCLUDED.password_hash
       RETURNING id`,
      ["Demo User", "demo@sweety.com", passwordHash]
    );
    const userId = userResult.rows[0].id;

    await client.query(
      `INSERT INTO readings (user_id, reading_date, time_slot, value)
       SELECT
         $1,
         LEAST(
           months.month_start + INTERVAL '14 days',
           CURRENT_DATE
         )::date,
         sample.time_slot,
         sample.value
       FROM generate_series(
         DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months',
         DATE_TRUNC('month', CURRENT_DATE),
         INTERVAL '1 month'
       ) AS months(month_start)
       CROSS JOIN (
         VALUES
           ('Morning (fasting)', 110),
           ('After lunch', 145)
       ) AS sample(time_slot, value)
       ON CONFLICT (user_id, reading_date, time_slot)
       DO UPDATE SET
         value = EXCLUDED.value,
         updated_at = CURRENT_TIMESTAMP`,
      [userId]
    );

    await client.query("COMMIT");

    console.log("Database seeded successfully.");
    console.log("Demo email: demo@sweety.com");
    console.log("Demo password: Demo@123");

  }
  catch (error) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", error);
    process.exitCode = 1;
  }
  finally {
    client.release();
    await pool.end();
  }
};

seedDatabase();