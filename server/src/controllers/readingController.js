import pool from "../config/db.js";
import { validateReading } from "../utils/validators.js";

export const getReadings = async (req, res) => {
  try {
    const hasPagination = req.query.page !== undefined || req.query.limit !== undefined;

    if (hasPagination) {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const offset = (page - 1) * limit;
      const [readingsResult, countResult] = await Promise.all([
        pool.query(
          `SELECT id, reading_date, time_slot, value, created_at, updated_at
           FROM readings
           WHERE user_id = $1
           ORDER BY reading_date DESC, created_at DESC
           LIMIT $2 OFFSET $3`,
          [req.user.id, limit, offset]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS total
           FROM readings
           WHERE user_id = $1`,
          [req.user.id]
        )
      ]);

      const total = countResult.rows[0].total;

      return res.status(200).json({
        readings: readingsResult.rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      });
    }

    const result = await pool.query(
      `SELECT id, reading_date, time_slot, value, created_at, updated_at
       FROM readings
       WHERE user_id = $1
       ORDER BY reading_date DESC, created_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({ readings: result.rows });
  }
  catch (error) {
    console.error("Get readings error:", error);
    return res.status(500).json({ message: "Unable to fetch readings." });
  }
};


export const getReadingById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, reading_date, time_slot, value, created_at, updated_at
       FROM readings
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Reading not found." });
    }

    return res.status(200).json({ reading: result.rows[0] });
  }
  catch (error) {
    console.error("Get reading error:", error);
    return res.status(500).json({ message: "Unable to fetch reading." });
  }
};


export const createReading = async (req, res) => {
  try {
    const { date, slot, value } = req.body || {};
    const validationError = validateReading({ date, slot, value });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const numericValue = Number(value);

    const existingReading = await pool.query(
      `SELECT id FROM readings
       WHERE user_id = $1
       AND reading_date = $2
       AND time_slot = $3`,
      [req.user.id, date, slot]
    );

    if (existingReading.rows.length > 0) {
      return res.status(409).json({ message: `You already have an ${slot} reading for this date.` });
    }

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM readings
       WHERE user_id = $1 AND reading_date = $2`,
      [req.user.id, date]
    );

    if (countResult.rows[0].total >= 4) {
      return res.status(400).json({ message: "You can add only 4 readings per day." });
    }

    const result = await pool.query(
      `INSERT INTO readings
       (user_id, reading_date, time_slot, value)
       VALUES ($1, $2, $3, $4)
       RETURNING id, reading_date, time_slot, value, created_at, updated_at`,
      [req.user.id, date, slot, numericValue]
    );

    return res.status(201).json({ message: "Reading added successfully.", reading: result.rows[0] });

  }
  catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "A reading already exists for this time slot and date." });
    }
    console.error("Create reading error:", error);
    return res.status(500).json({ message: "Unable to add reading." });
  }
};


export const updateReading = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, slot, value } = req.body || {};
    const validationError = validateReading({ date, slot, value });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const currentResult = await pool.query(
      `SELECT id FROM readings
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ message: "Reading not found." });
    }

    const duplicateResult = await pool.query(
      `SELECT id FROM readings
       WHERE user_id = $1
       AND reading_date = $2
       AND time_slot = $3
       AND id != $4`,
      [req.user.id, date, slot, id]
    );

    if (duplicateResult.rows.length > 0) {
      return res.status(409).json({ message: `You already have an ${slot} reading for this date.` });
    }

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM readings
       WHERE user_id = $1
       AND reading_date = $2
       AND id != $3`,
      [req.user.id, date, id]
    );

    if (countResult.rows[0].total >= 4) {
      return res.status(400).json({ message: "You can add only 4 readings per day." });
    }

    const result = await pool.query(
      `UPDATE readings SET reading_date = $1, time_slot = $2, value = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING id, reading_date, time_slot, value, created_at, updated_at`,
      [date, slot, Number(value), id, req.user.id]
    );

    return res.status(200).json({ message: "Reading updated successfully.", reading: result.rows[0] });

  }
  catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "A reading already exists for this time slot and date." });
    }
    console.error("Update reading error:", error);
    return res.status(500).json({ message: "Unable to update reading." });
  }
};


export const deleteReading = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `DELETE FROM readings
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Reading not found." });
    }

    return res.status(200).json({ message: "Reading deleted successfully." });

  }
  catch (error) {
    console.error("Delete reading error:", error);
    return res.status(500).json({ message: "Unable to delete reading." });
  }
};
