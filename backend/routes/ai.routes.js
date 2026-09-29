import express from "express";
const router = express.Router();

import {
  generateFoodAI,
  generateAndSaveFoodAI,
  analyzeRestaurantReviews,
  addReview,
} from "../controllers/ai.controller.js";

router.get("/test", (req, res) => {
  res.send("AI route working");
});

// GENERATE ONLY
router.post("/generate-food-ai", generateFoodAI);
router.post("/generate-food", generateFoodAI);

// GENERATE + SAVE
router.post("/generate-food-ai/:foodId", generateAndSaveFoodAI);

// ANALYZER — supports both dashboard and action paths
router.put("/admin/restaurants/:id/analyze", analyzeRestaurantReviews);
router.get("/analyze-reviews/:id", analyzeRestaurantReviews);
router.post("/analyze-reviews/:id", analyzeRestaurantReviews);

// REVIEW WITH AI
router.put("/stores/:id/review", addReview);

export default router;