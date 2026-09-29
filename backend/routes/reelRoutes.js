import express from "express";
import {
  getReelsFeed,
  toggleLikeReel,
  recordReelInteraction,
  getOrderOptions,
  trackOrderConversion,
} from "../controllers/reelController.js";
import { protect } from "../controllers/authController.js";

const router = express.Router();

// Public & Personalized Discovery Feed
router.get("/feed", getReelsFeed);

// Order Options Search (Featured restaurant guaranteed #1)
router.get("/:reelId/order-options", getOrderOptions);

// Interaction Tracking (View / watch time / completion)
router.post("/:reelId/interaction", recordReelInteraction);

// Like / Unlike Reel (Protected)
router.post("/:reelId/like", protect, toggleLikeReel);

// Order Conversion Tracking (Protected)
router.post("/:reelId/order-conversion", protect, trackOrderConversion);

export default router;
