import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getDailyReport, getMonthToDateReport, getPreviousMonthReport, getMonthlyTrends } from "../controllers/reportController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/daily", getDailyReport);
router.get("/mtd", getMonthToDateReport);
router.get("/monthly", getPreviousMonthReport);
router.get("/trends", getMonthlyTrends);

export default router;