import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getReadings, getReadingById, createReading, updateReading, deleteReading } from "../controllers/readingController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getReadings);
router.post("/", createReading);
router.get("/:id", getReadingById);
router.put("/:id", updateReading);
router.delete("/:id", deleteReading);

export default router;
