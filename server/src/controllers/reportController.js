import pool from "../config/db.js";

const isValidDate = (date) => {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const [year, month, day] = date.split("-").map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  return (parsedDate.getUTCFullYear() === year && parsedDate.getUTCMonth() === month - 1 && parsedDate.getUTCDate() === day);
};

const getSummary = async (userId, startDate, endDate) => {
  const result = await pool.query(
    `SELECT MAX(value)::int AS highest, MIN(value)::int AS lowest, ROUND(AVG(value)::numeric, 1) AS average, COUNT(*)::int AS total_readings
     FROM readings
     WHERE user_id = $1
     AND reading_date >= $2
     AND reading_date < $3`,
    [userId, startDate, endDate]
  );

  const summary = result.rows[0];

  return { highest: summary.highest, lowest: summary.lowest, average: summary.average === null ? null : Number(summary.average), totalReadings: summary.total_readings };
};

export const getDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    if (!isValidDate(date)) {
      return res.status(400).json({ message: "Please provide a valid date in YYYY-MM-DD format." });
    }

    const [year, month, day] = date.split("-").map(Number);
    const nextDate = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
    const summary = await getSummary(req.user.id, date, nextDate);
    const readingsResult = await pool.query(
      `SELECT id, reading_date, time_slot, value, created_at, updated_at
       FROM readings
       WHERE user_id = $1
       AND reading_date = $2
       ORDER BY
         CASE time_slot
           WHEN 'Morning (fasting)' THEN 1
           WHEN 'After breakfast' THEN 2
           WHEN 'After lunch' THEN 3
           WHEN 'After dinner' THEN 4
         END`,
      [req.user.id, date]
    );

    return res.status(200).json({ reportType: "daily", date, summary, readings: readingsResult.rows });
  }
  catch (error) {
    console.error("Daily report error:", error);
    return res.status(500).json({ message: "Unable to generate daily report." });
  }
};

export const getMonthToDateReport = async (req, res) => {
  try {
    const { date } = req.query;
    if (!isValidDate(date)) {
      return res.status(400).json({ message: "Please provide a valid date in YYYY-MM-DD format." });
    }

    const startDate = `${date.slice(0, 7)}-01`;
    const [year, month, day] = date.split("-").map(Number);
    const nextDate = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
    const summary = await getSummary(req.user.id, startDate, nextDate);

    return res.status(200).json({ reportType: "month-to-date", from: startDate, to: date, summary });

  }
  catch (error) {
    console.error("Month-to-date report error:", error);
    return res.status(500).json({ message: "Unable to generate month-to-date report." });
  }
};


export const getPreviousMonthReport = async (req, res) => {
  try {
    const { date } = req.query;
    if (!isValidDate(date)) {
      return res.status(400).json({ message: "Please provide a valid date in YYYY-MM-DD format." });
    }

    const [year, month] = date.split("-").map(Number);
    const endDate = `${date.slice(0, 7)}-01`;
    const previousMonth = new Date(Date.UTC(year, month - 2, 1));
    const startDate = previousMonth.toISOString().slice(0, 10);
    const summary = await getSummary(req.user.id, startDate, endDate);

    return res.status(200).json({ reportType: "previous-month", from: startDate, to: new Date(Date.UTC(year, month - 1, 0)).toISOString().slice(0, 10), summary });

  }
  catch (error) {
    console.error("Previous month report error:", error);
    return res.status(500).json({ message: "Unable to generate previous month report." });
  }
};

export const getMonthlyTrends = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         TO_CHAR(months.month_start, 'Mon YYYY') AS month,
         ROUND(AVG(readings.value), 1) AS average,
         COUNT(readings.id)::INTEGER AS total_readings
       FROM generate_series(
         DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months',
         DATE_TRUNC('month', CURRENT_DATE),
         INTERVAL '1 month'
       ) AS months(month_start)
       LEFT JOIN readings
         ON readings.user_id = $1
         AND readings.reading_date >= months.month_start
         AND readings.reading_date < months.month_start + INTERVAL '1 month'
       GROUP BY months.month_start
       ORDER BY months.month_start`,
      [req.user.id]
    );

    res.status(200).json({ trends: result.rows.map((row) => ({ month: row.month, average: row.average === null ? null : Number(row.average), totalReadings: Number(row.total_readings) })) });
  }
  catch (error) {
    console.error("Get monthly trends error:", error);
    res.status(500).json({ message: "Unable to load monthly trends." });
  }
};