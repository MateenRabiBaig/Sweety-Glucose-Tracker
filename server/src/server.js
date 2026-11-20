import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import pool from "./config/db.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await pool.query("SELECT 1");

    console.log("PostgreSQL connected successfully.");

    app.listen(PORT, () => {
      console.log(`Sweety server running on port ${PORT}`);
    });

  }
  catch (error) {
    console.error("Unable to connect to PostgreSQL:", error.message);
    process.exit(1);
  }
};

startServer();